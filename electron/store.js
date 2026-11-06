/**
 * 本地存储层
 * 数据文件：<系统文档目录>/鱼塘周记馆/fishpond.json
 * 优先使用 lowdb（JSON 文档数据库），若运行环境加载 ESM 失败则自动降级为
 * 内置的原子写入实现，保证任何情况下数据都能落盘。
 */

import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

const DEFAULT_STATE = {
  version: 1,
  settings: {
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    mode: 'feast',
    maxChars: 6000
  },
  entries: [],
  materials: [],
  weeklies: []
}

let state = null
let filePath = ''
let saveFn = async () => {}
let engineName = 'builtin'

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function dataDir() {
  const dir = path.join(app.getPath('documents'), '鱼塘周记馆')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function atomicWrite(file, data) {
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, file)
}

/** 补齐历史数据里缺失的字段，避免升级后炸掉 */
function migrate(data) {
  const base = clone(DEFAULT_STATE)
  data.version = base.version
  data.settings = Object.assign({}, base.settings, data.settings || {})
  data.entries = Array.isArray(data.entries) ? data.entries : []
  data.materials = Array.isArray(data.materials) ? data.materials : []
  data.weeklies = Array.isArray(data.weeklies) ? data.weeklies : []
  return data
}

async function init() {
  filePath = path.join(dataDir(), 'fishpond.json')

  try {
    const { JSONFilePreset } = await import('lowdb/node')
    const db = await JSONFilePreset(filePath, clone(DEFAULT_STATE))
    migrate(db.data)
    state = db.data
    saveFn = () => db.write()
    engineName = 'lowdb'
    await db.write()
  } catch (err) {
    // 降级：读取已有文件或初始化
    let data = clone(DEFAULT_STATE)
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } catch (e) {
        // 文件损坏时备份一份，避免用户数据被直接覆盖
        try {
          fs.copyFileSync(filePath, `${filePath}.broken-${Date.now()}`)
        } catch (_) {}
      }
    }
    state = migrate(data)
    saveFn = async () => atomicWrite(filePath, state)
    engineName = 'builtin'
    await saveFn()
    console.warn('[store] lowdb 不可用，已切换内置存储：', err && err.message)
  }

  return state
}

function get() {
  return state
}

async function save() {
  await saveFn()
}

/** 导入备份：整体替换，并写回磁盘 */
async function replace(next) {
  state = migrate(next)
  await saveFn()
  return state
}

function pathOf() {
  return filePath
}

function dirOf() {
  return path.dirname(filePath)
}

/** 当前使用的存储引擎（lowdb / builtin），仅用于排查 */
function engine() {
  return engineName
}

export { init, get, save, replace, pathOf, dirOf, engine }
