# GitHub Pages で無料公開する手順（18禁アグリ版）

サーバー代ゼロ。ブラウザ操作だけで公開→更新までできます。
所要時間: 約10分。`git` やコマンド操作は一切不要です。

## 0. 前提
- GitHubアカウント（無料）: https://github.com/join に未作成なら作成

## 1. リポジトリを作る
1. https://github.com/new を開く
2. Repository name: `pokito` など半角英数の短い名前（URLになる。例: `https://自分のID.github.io/pokito/`）
3. Public を選択 → Create repository

## 2. ファイルをドラッグで上げる
1. 作成されたリポジトリページの **"uploading an existing file"** リンクをクリック
2. このフォルダの中身をそのままドラッグ&ドロップ:
   - `index.html`
   - `README.md` / `DEPLOY.md`
   - `assets/` フォルダごと（`style.css` `data.js` `app.js` `og-image.png`）
   - `share/` フォルダごと（Xシェア用のOGP静的ページ。無いとXでカードが出ない）
   - ※ `tools/` はPC側で使うスクリプトなので上げなくても動く（上げても無害）
3. 下の **Commit changes** を押す

## 3. PagesをONにする
1. リポジトリの **Settings** タブ → 左メニュー **Pages**
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: `main` / **`/ (root)`** → Save
4. 1分ほどで `https://自分のID.github.io/pokito/` に反映（Linkが緑になります）

## 4. 18禁のマークを付ける（重要）
1. Settings（General のまま）→ Options までスクロール
2. **"Include this repository as a part of my profile areas"** の付近にある
   **"This repository contains Not Safe For Work (NSFW) content"**（成人向け）にチェック
3. GitHubは成人向けコンテンツのPagesホスティングを許可していますが、NSFWマークがないと通報で消されることがあります

## 5. 今後の記事追加（これもブラウザだけ）
1. リポジトリで `assets/data.js` をクリック → 鉛筆アイコン（Edit）
2. `articles: [` の直後にREADMEに載っているテンプレで1件追記して **Commit changes**
3. 約1分でサイト全体に自動反映。**idは必ず新規の番号に**（id重複NG）
4. 記事を追加したらPCで `node tools/gen_share_pages.js` を1回実行 → 増えた `share/` をブラウザで again ドラッグアップロード（Xに載せる予定のときだけ。不要ならこの4は飛ばしてOK、サイト自体はそのまま動く）

## 5.5 収益化IDを入れる場所（任意）
公開URLが決まったら `assets/data.js` の `site:` を編集して Commit:
- `url`: `https://自分のID.github.io/pokito` に
- `twitter`: 自分のX ID（@なし）
- `ads.exoclick` 各項目: 広告ネットワーク登録後のID
- `fanza.defaultUrl`: FANZAアフィリエイトのクリックURL

## うまく表示されないとき
- 1分待ってから `Ctrl+F5`（Pagesの反映待ち・ブラウザキャッシュ）
- `assets` フォルダがバラけて上がってないか確認（`assets/app.js` のパスが通ってないと画面が真っ白気味になります）

## 補足
- 帯域: Pagesは静的サイトなので基本無料枠で足りないことはまずありません
- 独自ドメインにしたくなったら `.dev` 等で年数百円～（任意。サブドメインで十分）
- コメント欄は現在ブラウザ内保存のみ。訪問者全員と共有したくなったら Giscus（無料）載せ替え
- 18禁動画のYouTube埋め込みは埋め込み禁止されることがある。Xの埋め込みが現行の定番（本家po-kaki-toも実質これ）
