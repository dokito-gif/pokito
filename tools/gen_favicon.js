/* ファビコン生成：32x32 PNG（赤背景＋白の再生▶）。依存ナシ、zlib のみ。
   実行: node tools/gen_favicon.js → assets/favicon.png */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const W = 32, H = 32;
const px = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    // 赤背景（上→下で微妙にグラデ）
    let r = 192, g = 57, b = 43;
    const t = y / (H - 1);
    r = Math.round(r + (123 - r) * t); g = Math.round(g + (31 - g) * t); b = Math.round(b + (162 - b) * t);
    // 白い再生三角形：左辺 x=8、右の頂点 (26,15.5)、縦は中央から離れると短くなる
    const dy = Math.abs(y + 0.5 - 15.5);
    const tri = dy < 8 && x + 0.5 >= 8 && (x + 0.5 - 8) <= (8 - dy) * 2.25;
    if (tri) { r = 255; g = 255; b = 255; }
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }
}
// raw スキャンライン（フィルタ0付き）
const raw = Buffer.alloc(H * (W * 4 + 1));
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0;
  px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0))
]);
const out = path.join(__dirname, "..", "assets", "favicon.png");
fs.writeFileSync(out, png);
console.log("favicon.png 生成: " + png.length + " bytes → " + out);
