/**
 * AI 输出的解析层
 *
 * 模型会同时返回两种东西：
 * 1. 给人看的两个固定板块（📋复盘 / 📂饵料库）
 * 2. <data> 里的 JSON，给程序入库用
 *
 * 优先用 JSON；模型抽风没给 JSON 时，用规则从排版文本里兜底提取，
 * 保证「功能永远可用」优先于「格式永远完美」。
 */

import { TAGS } from './text'

/* ---------------------------- 数据块 ---------------------------- */

export function extractDataBlock(text = '') {
  const m = String(text).match(/<data>([\s\S]*?)<\/data>/i)
  if (!m) return null

  let raw = m[1].trim()
  raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  raw = raw.replace(/,\s*([}\]])/g, '$1') // 去掉尾逗号

  try {
    return JSON.parse(raw)
  } catch (_) {
    const a = raw.indexOf('{')
    const b = raw.lastIndexOf('}')
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(raw.slice(a, b + 1))
      } catch (_) {
        return null
      }
    }
    return null
  }
}

export function stripDataBlock(text = '') {
  return String(text).replace(/<data>[\s\S]*?<\/data>/i, '').trim()
}

/** 流式过程中：data 块还没收完时直接截掉，避免吓到用户 */
export function stripStreaming(text = '') {
  const i = String(text).indexOf('<data>')
  return i >= 0 ? text.slice(0, i).trimEnd() : text
}

/* ---------------------------- 规范化 ---------------------------- */

function normRisk(x) {
  if (typeof x === 'string') return { point: x.trim(), advice: '' }
  const point = x.point || x.text || x.title || x.problem || ''
  const advice = x.advice || x.suggestion || x.fix || ''
  return { point: String(point).trim(), advice: String(advice).trim() }
}

function normTodo(x) {
  if (typeof x === 'string') {
    return { text: x.trim(), priority: /高/.test(x) ? '高' : '中', done: false }
  }
  const text = String(x.text || x.content || x.todo || '').trim()
  const p = String(x.priority || x.level || '中')
  return { text, priority: /高|high|P1/i.test(p) ? '高' : '中', done: !!x.done }
}

function normMaterial(x) {
  let tag = String(x.tag || x.category || '').trim()
  if (!TAGS.includes(tag)) tag = TAGS.find((t) => tag.includes(t)) || '想法'
  let stars = Number(x.stars || x.star || 3)
  if (!Number.isFinite(stars)) stars = 3
  stars = Math.min(5, Math.max(1, Math.round(stars)))
  return {
    tag,
    stars,
    summary: String(x.summary || x.content || x.text || '').trim(),
    note: String(x.note || x.usage || '').trim()
  }
}

/* ---------------------------- 文本兜底 ---------------------------- */

const HEADINGS = {
  done: ['今日收成', '今天收成', '收成'],
  risks: ['鱼塘暗礁', '暗礁'],
  todos: ['下轮投喂清单', '投喂清单'],
  comment: ['肥鱼点评', '点评'],
  library: ['饵料收纳库', '收纳库']
}

function cutSection(text, keys, endKeys) {
  for (const k of keys) {
    const i = text.indexOf(k)
    if (i < 0) continue
    const start = i + k.length
    let end = text.length
    for (const e of endKeys) {
      const j = text.indexOf(e, start)
      if (j >= 0 && j < end) end = j
    }
    return text
      .slice(start, end)
      .replace(/^[\s:：*]+/, '')
      .trim()
  }
  return ''
}

function cleanLines(body) {
  return body
    .split('\n')
    .map((l) =>
      l
        .replace(/^[\s>*`]+/, '')
        .replace(/^(\d+[.、)）]|[-•·])\s*/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .trim()
    )
    .filter((l) => l && !/^（?(略|无|暂无|没有)）?$/.test(l))
}

function parseLibrary(body) {
  if (!body) return []

  let chunks = body
    .split(/🏷️/)
    .slice(1)
    .map((c) => `🏷️${c}`)

  // 模型没写 🏷️，退一步按编号切
  if (chunks.length === 0) {
    const parts = body.split(/\n(?=\s*\d+[.、)）]\s)/)
    if (parts.length > 1) chunks = parts.map((p) => p.trim()).filter(Boolean)
  }

  const out = []
  for (const chunk of chunks) {
    const tagLine = chunk.slice(0, 26)
    const tag = TAGS.find((t) => tagLine.includes(t)) || '想法'

    let stars = (chunk.match(/⭐/g) || []).length
    if (!stars) {
      const m = chunk.match(/([1-5])\s*(?:星|\/\s*5)/)
      stars = m ? Number(m[1]) : 3
    }

    const summary =
      cutSection(chunk, ['提纯摘要', '摘要', '核心内容'], ['使用备注', '💡', '\n\n']) ||
      ''
    const note = cutSection(chunk, ['使用备注', '使用场景', '备注'], [])

    if (!summary && !note) continue
    out.push(normMaterial({ tag, stars, summary: summary || note, note }))
  }
  return out
}

function fallbackParse(clean) {
  const done = cleanLines(cutSection(clean, HEADINGS.done, [...HEADINGS.risks, ...HEADINGS.todos]))
  const riskRaw = cleanLines(cutSection(clean, HEADINGS.risks, [...HEADINGS.todos, ...HEADINGS.comment]))
  const todoRaw = cleanLines(cutSection(clean, HEADINGS.todos, [...HEADINGS.comment, ...HEADINGS.library]))
  const commentRaw = cutSection(clean, HEADINGS.comment, [...HEADINGS.library])

  const risks = riskRaw.map((line) => {
    const m = line.match(/^(.*?)(?:[，,。;；]\s*(?:建议|可以|不妨|试试)[:：]?)(.*)$/)
    if (m) return { point: m[1].trim(), advice: m[2].trim() }
    return { point: line, advice: '' }
  })

  const todos = todoRaw.map((line) => normTodo({ text: line }))

  return {
    recap: {
      done,
      risks,
      todos,
      comment: cleanLines(commentRaw).join(' ')
    },
    materials: parseLibrary(cutSection(clean, HEADINGS.library, []))
  }
}

/* ---------------------------- 主入口 ---------------------------- */

export function parseAnalysis(text = '') {
  const clean = stripDataBlock(text)
  const data = extractDataBlock(text)

  if (data && data.recap) {
    const r = data.recap
    return {
      recap: {
        done: toArray(r.done).map((x) => String(x).trim()).filter(Boolean),
        risks: toArray(r.risks).map(normRisk).filter((x) => x.point),
        todos: toArray(r.todos).map(normTodo).filter((x) => x.text),
        comment: String(r.comment || '').trim()
      },
      materials: toArray(data.materials).map(normMaterial).filter((m) => m.summary || m.note)
    }
  }

  return fallbackParse(clean)
}

function toArray(v) {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

/* ------------------------ 周报的轻量排版 ------------------------ */

export function toBlocks(text = '') {
  const lines = String(text)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const blocks = []
  for (const line of lines) {
    const clean = line.replace(/\*\*/g, '').replace(/^#{1,4}\s*/, '')
    if (/^[^\w\s]{0,2}【.+】$/.test(clean) || /^【.+】$/.test(clean)) {
      // 把开头的表情符号单独拆出来，渲染时才能和文字对齐
      const m = clean.match(/^([\p{Extended_Pictographic}\uFE0F]+)\s*([\s\S]*)$/u)
      if (m && m[2]) blocks.push({ type: 'h', emoji: m[1], text: m[2] })
      else blocks.push({ type: 'h', emoji: '', text: clean })
    } else if (/^(\d+[.、)）]|[-•·*])\s+/.test(clean)) {
      blocks.push({
        type: 'li',
        text: clean.replace(/^(\d+[.、)）]|[-•·*])\s+/, '')
      })
    } else {
      blocks.push({ type: 'p', text: clean })
    }
  }
  return blocks
}
