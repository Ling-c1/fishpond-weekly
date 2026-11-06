import { defineStore } from 'pinia'
import { estimateMeal, offsetDay, todayStr, uid } from '../utils/text'
import { parseAnalysis, stripDataBlock } from '../utils/parse'

const api = typeof window !== 'undefined' ? window.fishpond : null

/** 去掉 Vue 的响应式代理，IPC 只接受可结构化克隆的纯数据 */
function toPlain(value) {
  return JSON.parse(JSON.stringify(value))
}

/** 兜底：纯浏览器打开时不至于白屏 */
const safeApi = api || {
  load: async () => ({ ok: false }),
  onChunk: () => () => {}
}

export const useFishStore = defineStore('fish', {
  state: () => ({
    ready: false,
    view: 'today',

    settings: {
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      mode: 'feast',
      maxChars: 6000
    },

    entries: [],
    materials: [],
    weeklies: [],

    /* 运行态 */
    busy: false,
    busyKind: '',
    reqId: '',
    streamText: '',
    lastResult: null, // 最近一次分析（结构化）
    lastRaw: '',
    inputDraft: '',

    toastList: [],
    dataPath: '',
    systemPrompt: ''
  }),

  getters: {
    /** 今日已投喂次数 */
    todayCount: (s) => s.entries.filter((e) => e.date === todayStr()).length,

    /** 按日期倒序分组的历史 */
    groupedEntries: (s) => {
      const map = new Map()
      const sorted = [...s.entries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      for (const e of sorted) {
        if (!map.has(e.date)) map.set(e.date, [])
        map.get(e.date).push(e)
      }
      return [...map.entries()].map(([date, list]) => ({ date, list }))
    },

    materialsSorted: (s) => [...s.materials].sort((a, b) => b.createdAt - a.createdAt),

    lowMaterials: (s) => s.materials.filter((m) => m.stars <= 2).sort((a, b) => a.stars - b.stars),

    weekliesSorted: (s) => [...s.weeklies].sort((a, b) => b.createdAt - a.createdAt),

    highMaterials: (s) => s.materials.filter((m) => m.stars >= 4),

    /** 当前模式一次的预计白饭 */
    mealCost: (s) => estimateMeal((s.inputDraft || '').length, s.settings.mode)
  },

  actions: {
    /* ------------------------- 初始化 ------------------------- */

    async init() {
      const res = await safeApi.load()
      if (res && res.ok) {
        const d = res.data || {}
        this.settings = Object.assign({}, this.settings, d.settings || {})
        this.entries = d.entries || []
        this.materials = d.materials || []
        this.weeklies = d.weeklies || []
        this.dataPath = res.dataPath || ''
      }

      if (api) {
        api.onChunk(({ reqId, delta }) => {
          if (reqId === this.reqId) this.streamText += delta
        })
        const p = await api.getSystemPrompt()
        if (p && p.ok) this.systemPrompt = p.systemPrompt
      }

      this.ready = true
    },

    /* ------------------------- 提示条 ------------------------- */

    notify(text, type = 'info', ms = 3200) {
      const id = uid('t')
      this.toastList.push({ id, text, type })
      setTimeout(() => {
        this.toastList = this.toastList.filter((t) => t.id !== id)
      }, ms)
    },

    dismissToast(id) {
      this.toastList = this.toastList.filter((t) => t.id !== id)
    },

    go(view) {
      this.view = view
    },

    /* ------------------------- 设置 ------------------------- */

    async patchSettings(patch) {
      this.settings = Object.assign({}, this.settings, patch)
      if (api) await api.saveSettings(patch)
    },

    async setMode(mode) {
      this.settings.mode = mode
      if (api) await api.saveSettings({ mode })
    },

    /* ------------------------- 分析主流程 ------------------------- */

    async analyze() {
      const input = (this.inputDraft || '').trim()

      if (!input) {
        this.notify('还没有投喂内容哦，把你的碎碎念或者饵料丢进来吧', 'warn')
        return
      }
      if (input.length > this.settings.maxChars) {
        this.notify('投喂内容太多，肥鱼嚼不动，建议拆分投喂', 'warn', 4200)
        return
      }
      if (!this.settings.apiKey) {
        this.notify('先填一个 API 密钥，肥鱼才能开饭', 'warn')
        this.view = 'settings'
        return
      }
      if (this.busy) return

      const reqId = uid('req')
      this.reqId = reqId
      this.busy = true
      this.busyKind = 'analyze'
      this.streamText = ''
      this.lastResult = null

      let res
      try {
        res = await api.analyze({
          input,
          mode: this.settings.mode,
          date: todayStr(),
          reqId
        })
      } catch (err) {
        res = { ok: false, error: '肥鱼出去干饭迷路啦，请检查API密钥和网络' }
      }

      this.busy = false

      if (!res || !res.ok) {
        this.notify((res && res.error) || '肥鱼出去干饭迷路啦，请检查API密钥和网络', 'error', 6000)
        if (res && res.detail) console.warn('[肥鱼]', res.detail)
        this.streamText = ''
        return
      }

      const parsed = parseAnalysis(res.text)
      const entryId = uid('e')
      const createdAt = Date.now()

      const materials = parsed.materials.map((m, i) => ({
        id: uid('m'),
        entryId,
        date: todayStr(),
        tag: m.tag,
        stars: m.stars,
        summary: m.summary,
        note: m.note,
        createdAt: createdAt + i
      }))

      const entry = {
        id: entryId,
        date: todayStr(),
        createdAt,
        mode: this.settings.mode,
        model: this.settings.model,
        rawInput: input,
        plainText: stripDataBlock(res.text),
        recap: parsed.recap,
        materialIds: materials.map((m) => m.id),
        usage: res.usage || null
      }

      if (api) await api.saveEntry({ entry: toPlain(entry), materials: toPlain(materials) })

      this.entries.unshift(entry)
      this.materials = materials.concat(this.materials)
      this.lastResult = { entry, materials }
      this.lastRaw = res.text
      this.inputDraft = ''
      this.streamText = ''

      this.notify(
        `收工！这次捞到 ${materials.length} 条饵料${materials.length ? `，其中 ${materials.filter((m) => m.stars >= 4).length} 条是 4 星以上的好货` : ''}`,
        'success'
      )
    },

    /* ------------------------- 记录操作 ------------------------- */

    async removeEntry(id) {
      if (api) await api.deleteEntry(id)
      this.entries = this.entries.filter((e) => e.id !== id)
      this.materials = this.materials.filter((m) => m.entryId !== id)
      if (this.lastResult && this.lastResult.entry.id === id) this.lastResult = null
      this.notify('这条记录已经放回水里了', 'info')
    },

    async toggleTodo(entryId, index) {
      const entry = this.entries.find((e) => e.id === entryId)
      if (!entry || !entry.recap || !entry.recap.todos[index]) return
      entry.recap.todos[index].done = !entry.recap.todos[index].done
      if (api) await api.toggleTodo({ entryId, index })
    },

    async updateMaterial(material) {
      if (api) await api.saveMaterial(material)
      const i = this.materials.findIndex((m) => m.id === material.id)
      if (i >= 0) this.materials.splice(i, 1, material)
    },

    async removeMaterials(ids) {
      if (!ids.length) return
      if (api) await api.deleteMaterials(ids)
      const set = new Set(ids)
      this.materials = this.materials.filter((m) => !set.has(m.id))
      // 同步清理记录里的引用，避免历史页显示幽灵素材
      for (const e of this.entries) {
        if (e.materialIds) e.materialIds = e.materialIds.filter((id) => !set.has(id))
      }
      this.notify(`清仓完成，扔掉了 ${ids.length} 条低价值饵料`, 'success')
    },

    /* ------------------------- 周报 ------------------------- */

    async generateWeekly(from, to, mode = 'feast') {
      if (this.busy) return null
      if (!this.settings.apiKey) {
        this.notify('先填一个 API 密钥，肥鱼才能开饭', 'warn')
        this.view = 'settings'
        return null
      }

      const inRange = (d) => d >= from && d <= to
      const entries = this.entries.filter((e) => inRange(e.date)).sort((a, b) => (a.date < b.date ? -1 : 1))
      const materials = this.materials.filter((m) => inRange(m.date))

      if (!entries.length && !materials.length) {
        this.notify('这段时间鱼塘空空如也，先投喂几天再来捞', 'warn')
        return null
      }

      const reqId = uid('req')
      this.reqId = reqId
      this.busy = true
      this.busyKind = 'weekly'
      this.streamText = ''

      let res
      try {
        // Pinia 的 state 是响应式代理，过 IPC 前必须先转成纯对象
        res = await api.generateWeekly({
          from,
          to,
          reqId,
          entries: toPlain(entries),
          materials: toPlain(materials)
        })
      } catch (err) {
        console.error('[肥鱼] 周报请求失败：', err)
        res = { ok: false, error: '肥鱼出去干饭迷路啦，请检查API密钥和网络' }
      }

      this.busy = false

      if (!res || !res.ok) {
        this.notify((res && res.error) || '肥鱼出去干饭迷路啦，请检查API密钥和网络', 'error', 6000)
        this.streamText = ''
        return null
      }

      const weekly = {
        id: uid('w'),
        from,
        to,
        createdAt: Date.now(),
        mode,
        model: this.settings.model,
        content: stripDataBlock(res.text),
        stats: { entries: entries.length, materials: materials.length },
        usage: res.usage || null
      }

      if (api) await api.saveWeekly(weekly)
      this.weeklies.unshift(weekly)
      this.streamText = ''
      this.notify('鱼塘周记出锅了，收进历史里了', 'success')
      return weekly
    },

    async removeWeekly(id) {
      if (api) await api.deleteWeekly(id)
      this.weeklies = this.weeklies.filter((w) => w.id !== id)
      this.notify('这份周记已经删掉了', 'info')
    },

    /* ------------------------- 备份 ------------------------- */

    async exportBackup() {
      const res = await api.exportBackup()
      if (res && res.ok) this.notify('备份已经导出，记得放到安全的地方', 'success')
      else if (res && res.error) this.notify(res.error, 'error')
    },

    async importBackup() {
      const res = await api.importBackup()
      if (!res || res.canceled) return
      if (!res.ok) {
        this.notify(res.error || '导入失败了', 'error')
        return
      }
      const d = res.data || {}
      this.settings = Object.assign({}, this.settings, d.settings || {})
      this.entries = d.entries || []
      this.materials = d.materials || []
      this.weeklies = d.weeklies || []
      this.lastResult = null
      this.notify('备份已经倒回鱼塘里了', 'success')
    },

    async openFolder() {
      if (api) await api.openDataFolder()
    },

    /* ------------------------- 素材筛选 ------------------------- */

    searchMaterials({ keyword = '', tag = '', minStars = 0, sort = 'new' } = {}) {
      const k = keyword.trim().toLowerCase()
      let list = this.materials.filter((m) => {
        if (tag && m.tag !== tag) return false
        if (minStars && m.stars < minStars) return false
        if (!k) return true
        return (
          (m.summary || '').toLowerCase().includes(k) ||
          (m.note || '').toLowerCase().includes(k) ||
          (m.tag || '').toLowerCase().includes(k)
        )
      })
      if (sort === 'star') list = list.sort((a, b) => b.stars - a.stars || b.createdAt - a.createdAt)
      else list = list.sort((a, b) => b.createdAt - a.createdAt)
      return list
    }
  }
})

export { offsetDay }
