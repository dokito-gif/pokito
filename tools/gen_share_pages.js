/* X(Twitter)のbotにOGPカードを出させるための静的共有ページ生成器
   使い: node tools/gen_share_pages.js
   data.js の内容が変わったら実行して、share/ ごとGitHubに上げる（XのクローラーはJSを実行しないため静的ページが必要） */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

require(path.join(__dirname, "..", "assets", "data.js"));
const POKI = globalThis.POKI;
const SITE = POKI.site || {};
const noPh = (s) => s && !/YOUR[-_]/.test(String(s));
const root = noPh(SITE.url) ? String(SITE.url).replace(/\/+$/, "") : "https://example.github.io/pokito";
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- OGP画像（600x315の横長グラデPNG）を生成 ---------- */
function crcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
}
function crc32(buf) {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function makeOgPng(file) {
  const W = 600, H = 315;
  const c1 = [192, 57, 43], c2 = [123, 31, 162]; // #c0392b → #7b1fa2
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.alloc(1 + W * 3);
    for (let x = 0; x < W; x++) {
      const t = x / (W - 1);
      row[1 + x * 3] = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      row[2 + x * 3] = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      row[3 + x * 3] = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8bit RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

/* ---------- 記事ごとの共有ページ ---------- */
const shareDir = path.join(__dirname, "..", "share");
fs.mkdirSync(shareDir, { recursive: true });

const ogSize = makeOgPng(path.join(__dirname, "..", "assets", "og-image.png"));
let n = 0;
POKI.articles.forEach(a => {
  const title = a.title + "｜" + (SITE.name || "禁断通信");
  const abs = root + "/share/" + a.id + ".html";
  const via = noPh(SITE.twitter) ? '<meta name="twitter:site" content="@' + esc(SITE.twitter) + '">' : "";
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<!-- X(Twitter)bot向けOGP静的ページ。人は即座に記事へリダイレクト -->
<title>${esc(title)}</title>
<meta http-equiv="refresh" content="0;url=../index.html?id=${a.id}">
<link rel="canonical" href="${esc(abs)}">
<meta property="og:site_name" content="${esc(SITE.name || "禁断通信")}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(a.excerpt)}">
<meta property="og:url" content="${esc(abs)}">
<meta property="og:image" content="${esc(root)}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(a.excerpt)}">
${via}
<script>location.replace("../index.html?id=${a.id}");</script>
</head>
<body>
<p><a href="../index.html?id=${a.id}">▶ ${esc(title)}</a>（18歳以上の方はこちらへ）</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(shareDir, a.id + ".html"), html, "utf8");
  n++;
});
console.log("生成完了: share/ に " + n + " ページ, og-image.png (" + ogSize + " bytes)");

/* ---------- Google用に sitemap.xml と robots.txt も再生成 ---------- */
const artUrls = POKI.articles.map(a => root + "/index.html?id=" + a.id);
const allUrls = [root + "/", root + "/index.html?cat=ero", root + "/index.html?cat=guro", root + "/index.html?cat=sfw"].concat(artUrls);
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  allUrls.map(u => "  <url><loc>" + esc(u) + "</loc></url>").join("\n") + "\n</urlset>\n";
fs.writeFileSync(path.join(__dirname, "..", "sitemap.xml"), xml, "utf8");
fs.writeFileSync(path.join(__dirname, "..", "robots.txt"),
  "User-agent: *\nAllow: /\n\nSitemap: " + root + "/sitemap.xml\n", "utf8");
console.log("sitemap.xml / robots.txt も更新 (" + allUrls.length + " URL)");
console.log("OGPのURLプレビュー: " + root + " （data.js の site.url を実際の公開URLに書き換えよう）");
