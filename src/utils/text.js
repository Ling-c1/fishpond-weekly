/** 通用小工具：日期、ID、白饭估算 */

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** 本地日期 YYYY-MM-DD（不能用 toISOString，那是 UTC） */
export function todayStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function offsetDay(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return todayStr(d)
}

/** 2026-11-06 → 11月6日 周五 */
export function prettyDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${m}月${d}日 ${week}`
}

export function prettyTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 相对今天的口语化标签 */
export function dayLabel(str) {
  const t = todayStr()
  if (str === t) return '今天'
  if (str === offsetDay(t, -1)) return '昨天'
  return ''
}

/**
 * 白饭（token）粗估
 * 中文大致 1 字 ≈ 0.7 token，这里取 0.75 偏保守
 */
export function estimateTokens(text = '') {
  return Math.ceil(String(text).length * 0.75)
}

/** 一次投喂的白饭预估（含系统提示词与输出） */
export function estimateMeal(chars, mode) {
  const base = 700 // 内置系统提示词 + 数据块格式说明
  const input = Math.ceil(chars * 0.75)
  const output = mode === 'feast' ? 1000 : 210
  return base + input + output
}

export const TAGS = ['选题', '金句', '想法', '论据']

export const TAG_STYLE = {
  选题: 'bg-pond-100 text-pond-700',
  金句: 'bg-amber-50 text-amber-700',
  想法: 'bg-emerald-50 text-emerald-700',
  论据: 'bg-violet-50 text-violet-700'
}

export const TAG_DOT = {
  选题: '#4fa2cc',
  金句: '#e0a355',
  想法: '#4ba882',
  论据: '#8f7cc7'
}
