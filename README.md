# 激ヤバ通信 — po-kaki-to.com 風サイト

海外バズ動画ニュースまとめサイト「**激ヤバ通信**」（18禁アグリ）の自作HTML/JS実装。
サーバー不要、`index.html` をダブルクリックで動きます。収益化（広告・FANZAアフィリエイト・Xシェア）対応済み。

## 使い方
- **開く**: `index.html` をブラウザで開く（またはこのフォルダごと任意の無料レンタルにアップ）
- **年齢確認**: 初回は18禁ゲート表示。「18歳以上です」でブラウザに記憶される
- **記事の追加**: `assets/data.js` の `articles` 配列の**一番上**に1件追記 → `node tools/gen_share_pages.js` → git push

### 動画の3方式（詳細ページ、この優先順で自動選択）
1. **公式埋め込み（本命・ダウンロード不要）**: `src` に TheYNC の記事URL（`https://theync.com/video/15102/...`）を入れると、自動で `https://theync.com/embed/15102` をiframeで差し込む。当サイトの帯域ゼロ。X-Frame-Optionsが無制限なことは実測確認済み
2. **自前mp4（保険）**: `mp4: "videos/106.mp4"` を入れるとプレビュー画像タップでその場で再生。埋め込みが塞がれた時用に10本分は手元にある
3. **YouTube埋め込み**: `video: "https://www.youtube.com/embed/ID"`

```js
{
  id: 116, cat: "guro",            // ero | guro | sfw の3カテゴリ
  date: "2026-11-16 12:00",        // 数字が大きいほど新着扱い（idも降順）
  title: "【閲覧注意】…（ここがSEOとXで勝敗を決める）",
  tags: ["海外", "事故"],
  views: 0,                        // PV表示用カウント。0でOK
  img: "assets/img/116.jpg",       // プレビュー画像（TheYNCの preview.jpg をDLして assets/img/ へ）
  mp4: "videos/116.mp4",           // 自前動画。埋め込みだけで良いなら "" でも可
  emoji: "🤕", color: ["#c0392b", "#7b1fa2"],  // 画像が無い時のフォールバック
  excerpt: "一覧に出るボールド抜粋（2〜3文）",
  body: ["本文段落1", "本文段落2", "※出典: TheYNC / 元メディア"],
  src: "https://theync.com/video/15xxx/slug/", srcName: "TheYNC",  // 出典リンク
  buy: { label: "…（PR）", url: "FANZAのクリックURL" },            // 任意
  comments: [ { name: "名無しさん", date: "...", text: "..." } ]
}
```
**画像DLの手順**: TheYNCはcurl等だとCloudflare 403になる。ブラウザで開いて右クリック保存、またはブラウザ経由のfetch（referrerpolicy=no-referrer 相当）で取ってくる

## 実装済み機能
- 一覧（新着順）＋ページネーション（6件/頁、`perPage` で変更可）
- 記事詳細（動画はめ込み枠・関連記事・前後記事リンク）
- カテゴリ（エロ/グロ/SFW）・タグ・キーワード検索
- タグクラウド／人気ランキング／最新記事サイドバー
- コメント（ブラウザのlocalStorageに保存。デモなので環境ごとにあるだけ）
- 18禁年齢確認ゲート、レスポンシブ（860px以下で1カラム）
- **収益化**: 広告枠4種＋FANZAアフィリエイトCTA＋Xシェア/OGP共有ページ（下記参照）

## 収益化の設定（全部 `data.js` の `site` に書く）

### ① 広告ネットワーク（18禁対応推奨・ExoClick等）
`site.ads.exoclick` に登録後にもらえるIDを記入するだけ。未設定のうちは斜線模様のプレースホルダーが出る:
| 設定項目 | 意味 |
|---|---|
| `key` / `tagid` | ExoClickのアカウントキー・タグID |
| `zoneid_leader` | 一覧上部728x90枠 |
| `zoneid_rect` | 記事文中／一覧3記事目の下の300x250枠 |
| `zoneid_side` | サイドバー300x600枠 |

ExoClick以外（Adsterra・MGID等）を使いたい場合は `site.ads.headerRaw` / `footRaw` に登録時スニペットのHTMLをそのまま貼ればヘッダ下・フッタ前に出せる。

### ② FANZA(DMM.R18)アフィリエイト
1. FANZAアフィリエイトに登録してクリックURLを発行
2. 記事本文の下に出る大きいCTAボタン: 各記事の `buy` にそのURLを入れる
3. 全記事・サイドバー共通にしたいなら `site.fanza.defaultUrl` に入れる（記事の `buy` がないときは自動でそれを使う）
4. 広告表記（ステマ防止）は自動で「PR」「スポンサー提供」の注記が出る

### ③ X（旧Twitter）共有・bot投稿
1. `site.url`（GitHub PagesのURL）と `site.twitter`（XのID）を設定
2. 記事ページに「Xで共有」ボタンとリンクコピーが出る
3. **XのbotにOGPカード（タイトル＋画像）を出すには静的ページが必要**: 記事追加のたびに
   ```
   node tools/gen_share_pages.js
   ```
   を実行して `share/` フォルダと `assets/og-image.png` を一緒にGitHubへ上げる（GitHub Pagesにアップするだけなら、`share/` ごとドラッグに含まれるので忘れないこと）
4. 自動化（botが1日おきに自動投稿）させるなら、無料範囲では「共有ページURLを自分で投稿」→習慣化、本格的にやるなら GitHub Actions にこの生成スクリプトを走らせて外部のX投稿サービスへ、が定番ルート

## 本家 po-kaki-to.com との対応
| 本家 | このプロトタイプ |
|---|---|
| WordPress + テーマ | 静的HTML + JS（`data.js` がデータベース代わり） |
| 約4万5千記事 | デモ12記事 |
| 動画埋め込み（YouTube等） | `video` フィールドにURL入れると同位置に埋まる |
| コメント欄 | localStorage保存（実運用はサーバー or 無料コメントサービス要） |

## 次のステップ（実運用に乗せるなら）
1. **更新**: 記事追加を手作業からCMS化。`data.js` を更新する投稿フォームをサーバー側に置くか、WordPress/Laravelに移行
2. **コメント**: localStorage → Firebase か Discourse 等の外部サービスへ
3. **動画**: 直置きせずYouTube/Xの埋め込み推奨（転送量対策）
4. **公開**: 18禁OKのレンタル（Xserver等）か静的ホスティングへ。`assets` フォルダごと上げればそのまま動く
