import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import * as store from './store'
import { buildAnalyzeMessages, buildWeeklyMessages, SYSTEM_PROMPT } from './prompts'

const DEV_URL = process.env.VITE_DEV_SERVER_URL
let win = null

/* ------------------------------------------------------------------ */
/* 窗口                                                                */
/* ------------------------------------------------------------------ */

function createWindow() {
  win = new BrowserWindow({
    width: 1220,
    height: 840,
    minWidth: 1000,
    minHeight: 660,
    show: false,
    backgroundColor: '#f5fbfe',
    title: '鱼塘周记馆',
    icon: path.join(__dirname, '../build/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win.show())

  if (DEV_URL) {
    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 外部链接一律用系统浏览器打开，不在应用内导航
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  await store.init()
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ------------------------------------------------------------------ */
/* 大模型调用                                                          */
/*                                                                     */
/* 放在主进程发请求：绕过浏览器 CORS 限制，也不把 Key 暴露在页面里。    */
/* ------------------------------------------------------------------ */

const ERR_NETWORK = '肥鱼出去干饭迷路啦，请检查API密钥和网络'

function normalizeUrl(baseUrl) {
  let base = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!base) base = 'https://api.deepseek.com/v1'
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`
  // 用户可能直接填了完整的 .../chat/completions
  if (/\/chat\/completions$/i.test(base)) return base
  if (/\/v\d+$/i.test(base)) return `${base}/chat/completions`
  return `${base}/v1/chat/completions`
}

/**
 * 流式请求，逐块把增量文本推回渲染进程
 * @returns {Promise<{ok:boolean, text:string, usage:object|null, error?:string}>}
 */
async function streamChat({ messages, settings, reqId, sender }) {
  const url = normalizeUrl(settings.baseUrl)
  const headers = { 'Content-Type': 'application/json' }
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`

  const body = {
    model: settings.model || 'deepseek-chat',
    messages,
    stream: true,
    temperature: 0.7
  }

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  } catch (err) {
    return { ok: false, text: '', usage: null, error: ERR_NETWORK, detail: err.message }
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const j = await res.json()
      detail = (j.error && (j.error.message || j.error.type)) || JSON.stringify(j).slice(0, 300)
    } catch (_) {
      try {
        detail = (await res.text()).slice(0, 300)
      } catch (_) {}
    }
    const hint =
      res.status === 401 || res.status === 403
        ? 'API 密钥好像不对，或者没有这个模型的权限'
        : res.status === 404
          ? '模型地址填错啦，检查一下接口地址和模型名'
          : res.status === 429
            ? '白饭不够或者请求太频繁，喝口水再来'
            : '服务器那边有点状况'
    return { ok: false, text: '', usage: null, error: ERR_NETWORK, detail: `${hint}（${detail}）` }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let text = ''
  let usage = null

  const push = (delta) => {
    if (!delta) return
    text += delta
    if (sender && !sender.isDestroyed()) sender.send('ai:chunk', { reqId, delta })
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const raw of lines) {
      const line = raw.trim()
      if (!line || !line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        if (json.usage) usage = json.usage
        const delta = json.choices && json.choices[0] && json.choices[0].delta
        push((delta && delta.content) || '')
      } catch (_) {
        // 忽略不完整的分片
      }
    }
  }

  return { ok: true, text, usage }
}

/* ------------------------------------------------------------------ */
/* IPC                                                                 */
/* ------------------------------------------------------------------ */

function registerIpc() {
  /* ---- 数据读写 ---- */

  ipcMain.handle('store:load', async () => {
    const s = store.get()
    return { ok: true, data: s, dataPath: store.pathOf(), engine: store.engine() }
  })

  ipcMain.handle('settings:save', async (_e, patch) => {
    const s = store.get()
    s.settings = Object.assign({}, s.settings, patch || {})
    await store.save()
    return { ok: true, settings: s.settings }
  })

  // 一次投喂 = 一条复盘记录 + 若干条饵料，一次 IPC 落盘
  ipcMain.handle('entry:save', async (_e, { entry, materials = [] }) => {
    const s = store.get()
    const i = s.entries.findIndex((x) => x.id === entry.id)
    if (i >= 0) s.entries.splice(i, 1, entry)
    else s.entries.unshift(entry)

    s.materials = s.materials.filter((x) => x.entryId !== entry.id).concat(materials)
    await store.save()
    return { ok: true }
  })

  ipcMain.handle('entry:delete', async (_e, id) => {
    const s = store.get()
    s.entries = s.entries.filter((x) => x.id !== id)
    // 连带删除该次投喂产出的素材
    s.materials = s.materials.filter((x) => x.entryId !== id)
    await store.save()
    return { ok: true }
  })

  ipcMain.handle('entry:toggle-todo', async (_e, { entryId, index }) => {
    const s = store.get()
    const entry = s.entries.find((x) => x.id === entryId)
    if (entry && entry.recap && entry.recap.todos && entry.recap.todos[index]) {
      entry.recap.todos[index].done = !entry.recap.todos[index].done
      await store.save()
    }
    return { ok: true }
  })

  ipcMain.handle('material:save', async (_e, material) => {
    const s = store.get()
    const i = s.materials.findIndex((x) => x.id === material.id)
    if (i >= 0) s.materials.splice(i, 1, material)
    else s.materials.unshift(material)
    await store.save()
    return { ok: true }
  })

  ipcMain.handle('material:delete', async (_e, ids) => {
    const s = store.get()
    const set = new Set(ids || [])
    s.materials = s.materials.filter((x) => !set.has(x.id))
    // 同步清掉记录里的引用，避免历史页出现指向已删素材的空位
    for (const e of s.entries) {
      if (Array.isArray(e.materialIds)) {
        e.materialIds = e.materialIds.filter((id) => !set.has(id))
      }
    }
    await store.save()
    return { ok: true }
  })

  ipcMain.handle('weekly:save', async (_e, weekly) => {
    const s = store.get()
    const i = s.weeklies.findIndex((x) => x.id === weekly.id)
    if (i >= 0) s.weeklies.splice(i, 1, weekly)
    else s.weeklies.unshift(weekly)
    await store.save()
    return { ok: true }
  })

  ipcMain.handle('weekly:delete', async (_e, id) => {
    const s = store.get()
    s.weeklies = s.weeklies.filter((x) => x.id !== id)
    await store.save()
    return { ok: true }
  })

  /* ---- 大模型 ---- */

  ipcMain.handle('ai:analyze', async (e, { input, mode, date, reqId }) => {
    const s = store.get()
    if (!s.settings.apiKey) {
      return { ok: false, error: '还没填 API 密钥，先去「鱼塘设置」里填一下吧', needKey: true }
    }
    const messages = buildAnalyzeMessages({ mode, input, date })
    return streamChat({ messages, settings: s.settings, reqId, sender: e.sender })
  })

  ipcMain.handle('ai:weekly', async (e, { from, to, entries, materials, reqId }) => {
    const s = store.get()
    if (!s.settings.apiKey) {
      return { ok: false, error: '还没填 API 密钥，先去「鱼塘设置」里填一下吧', needKey: true }
    }
    const messages = buildWeeklyMessages({ from, to, entries, materials })
    return streamChat({ messages, settings: s.settings, reqId, sender: e.sender })
  })

  ipcMain.handle('ai:test', async () => {
    const s = store.get()
    if (!s.settings.apiKey) return { ok: false, error: '还没有填 API 密钥' }
    const r = await streamChat({
      messages: [{ role: 'user', content: '回复两个字：开饭' }],
      settings: s.settings,
      reqId: 'test',
      sender: null
    })
    if (!r.ok) return { ok: false, error: r.detail || r.error }
    return { ok: true, text: r.text.slice(0, 60) }
  })

  /* ---- 备份 / 目录 ---- */

  ipcMain.handle('backup:export', async () => {
    const stamp = new Date().toISOString().slice(0, 10)
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: '导出鱼塘备份',
      defaultPath: `鱼塘周记馆-备份-${stamp}.json`,
      filters: [{ name: 'JSON 备份', extensions: ['json'] }]
    })
    if (canceled || !filePath) return { ok: false, canceled: true }

    const payload = {
      app: '鱼塘周记馆',
      exportedAt: new Date().toISOString(),
      data: store.get()
    }
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
    return { ok: true, path: filePath }
  })

  ipcMain.handle('backup:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: '导入鱼塘备份',
      properties: ['openFile'],
      filters: [{ name: 'JSON 备份', extensions: ['json'] }]
    })
    if (canceled || !filePaths || !filePaths.length) return { ok: false, canceled: true }

    let payload
    try {
      payload = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
    } catch (err) {
      return { ok: false, error: '这个文件读不出来，可能不是鱼塘的备份' }
    }

    const data = payload.data || payload
    if (!data || (!Array.isArray(data.entries) && !Array.isArray(data.materials))) {
      return { ok: false, error: '文件内容不太对，不像是鱼塘备份' }
    }

    const next = await store.replace(data)
    return { ok: true, data: next }
  })

  ipcMain.handle('app:data-folder', async () => {
    shell.openPath(store.dirOf())
    return { ok: true, path: store.dirOf() }
  })

  ipcMain.handle('app:prompt', async () => ({ ok: true, systemPrompt: SYSTEM_PROMPT }))
}
