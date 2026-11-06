'use strict'

/**
 * 生成应用图标 build/icon.png（512x512）
 * 纯 Node 实现：先超采样绘制一只小肥鱼，再盒式降采样，最后手写 PNG。
 * 跑法：npm run icon
 */

const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const SIZE = 512
const SS = 3 // 超采样倍数
const W = SIZE * SS

const px = new Uint8ClampedArray(W * W * 4)

/* ------------------------------ 绘制原语 ------------------------------ */

function put(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= W || y >= W || a <= 0) return
  const i = (y * W + x) * 4
  const sa = Math.min(1, a)
  const da = px[i + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa <= 0) return
  px[i] = (r * sa + px[i] * da * (1 - sa)) / oa
  px[i + 1] = (g * sa + px[i + 1] * da * (1 - sa)) / oa
  px[i + 2] = (b * sa + px[i + 2] * da * (1 - sa)) / oa
  px[i + 3] = oa * 255
}

function hex(h) {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function circle(cx, cy, r, color) {
  const [R, G, B] = hex(color)
  for (let y = Math.max(0, cy - r - 2); y < Math.min(W, cy + r + 2); y++) {
    for (let x = Math.max(0, cx - r - 2); x < Math.min(W, cx + r + 2); x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d <= r) put(x, y, R, G, B, 1)
    }
  }
}

function ellipse(cx, cy, rx, ry, color) {
  const [R, G, B] = hex(color)
  for (let y = Math.max(0, cy - ry - 2); y < Math.min(W, cy + ry + 2); y++) {
    for (let x = Math.max(0, cx - rx - 2); x < Math.min(W, cx + rx + 2); x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
      if (d <= 1) put(x, y, R, G, B, 1)
    }
  }
}

/** 旋转椭圆：卡通感的圆润部件都用它 */
function rotEllipse(cx, cy, rx, ry, angle, color) {
  const [R, G, B] = hex(color)
  const cos = Math.cos(-angle)
  const sin = Math.sin(-angle)
  const reach = Math.max(rx, ry) + 2
  for (let y = Math.max(0, Math.floor(cy - reach)); y < Math.min(W, cy + reach); y++) {
    for (let x = Math.max(0, Math.floor(cx - reach)); x < Math.min(W, cx + reach); x++) {
      const dx = x - cx
      const dy = y - cy
      const u = dx * cos - dy * sin
      const v = dx * sin + dy * cos
      if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) put(x, y, R, G, B, 1)
    }
  }
}

/** 粗线条（用于水波），只在圆内绘制 */
function waveLine(y0, amp, thickness, color, clipR) {
  const [R, G, B] = hex(color)
  const cx = W / 2
  const cy = W / 2
  for (let x = 0; x < W; x++) {
    const y = y0 + Math.sin((x / W) * Math.PI * 4) * amp
    for (let t = -thickness; t <= thickness; t++) {
      const yy = Math.round(y + t)
      if (yy < 0 || yy >= W || x < 0) continue
      if (Math.hypot(x - cx, yy - cy) > clipR - thickness) continue
      put(x, yy, R, G, B, 1)
    }
  }
}

/* ------------------------------ 构图 ------------------------------ */

const S = SS // 简写：所有坐标乘上超采样倍数
const mid = W / 2
const R = 236 * S

// 塘底
circle(mid, mid, R, '#E8F4FB')

// 水波（画在鱼身后方）
waveLine(400 * S, 8 * S, 2.6 * S, '#C7E5F4', R)

// 鱼尾：上下两瓣，交叠成圆润的燕尾
rotEllipse(126 * S, 234 * S, 68 * S, 35 * S, -0.55, '#5FB0D6')
rotEllipse(126 * S, 314 * S, 68 * S, 35 * S, 0.55, '#5FB0D6')

// 背鳍（半埋在鱼身里，只露出圆弧）
rotEllipse(298 * S, 194 * S, 52 * S, 36 * S, -0.28, '#5FB0D6')

// 鱼身
ellipse(292 * S, 274 * S, 126 * S, 86 * S, '#7CC0E0')

// 肚皮
ellipse(286 * S, 304 * S, 88 * S, 32 * S, '#94CCE5')

// 眼睛
circle(352 * S, 250 * S, 25 * S, '#FFFFFF')
circle(359 * S, 250 * S, 13 * S, '#274A60')
circle(364 * S, 244 * S, 4 * S, '#FFFFFF')

// 泡泡
circle(432 * S, 148 * S, 14 * S, '#D6EDF9')
circle(462 * S, 104 * S, 8 * S, '#D6EDF9')

/* ------------------------------ 降采样 ------------------------------ */

const out = Buffer.alloc(SIZE * SIZE * 4)
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0
    let g = 0
    let b = 0
    let a = 0
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const i = ((y * SS + sy) * W + (x * SS + sx)) * 4
        r += px[i]
        g += px[i + 1]
        b += px[i + 2]
        a += px[i + 3]
      }
    }
    const n = SS * SS
    const o = (y * SIZE + x) * 4
    // 预乘后再均，避免边缘发黑
    const af = a / n / 255
    out[o] = af > 0 ? r / n / af : 0
    out[o + 1] = af > 0 ? g / n / af : 0
    out[o + 2] = af > 0 ? b / n / af : 0
    out[o + 3] = a / n
  }
}

/* ------------------------------ PNG 编码 ------------------------------ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// 每行前加一个 filter 字节（0 = None）
const rawRows = Buffer.alloc((SIZE * 4 + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  rawRows[y * (SIZE * 4 + 1)] = 0
  out.copy(rawRows, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(rawRows, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
])

const outDir = path.join(__dirname, '..', 'build')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon.png'), png)
console.log(`✅ build/icon.png 已生成（${SIZE}x${SIZE}，${(png.length / 1024).toFixed(1)} KB）`)
