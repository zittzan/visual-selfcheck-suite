# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

参照画像（Good / Bad 例）を見ながらセルフチェックするための、独立した 2 つの Electron アプリのセット。

- `tools/check-tool`（Model Check Tool）: 設問を表示して OK / Skip / BAD を判定するビューワー
- `tools/question-editor`（Question Editor）: 設問データ（CSV + 画像）を作って書き出すエディター

データの流れは「エディターが `checklist.csv` + `images/` を書き出す → ビューワーがそのフォルダを読む」の一方向。2 つのアプリはコードもパッケージも共有しておらず、ルートに `package.json` は無い。

### 経緯（判断の背景）

- check-tool は最初ブラウザで開く単体 HTML として作り、のちに Electron 化した。3D モデラーが Maya や MotionBuilder の横に並べて使う前提なので、ウィンドウは既定で最前面表示になっている。
- 設問データは当初 Notion からエクスポートする想定だったが、権限の都合でチーム全員がエクスポートできないと分かり、question-editor を別に作った。要件は `docs/question-editor-requirements.md`。
- リポジトリ名はアプリの用途を分野に依存せず表すために付けたもので、`productName`、`appId`（`com.ricasso.*`）、配布物のファイル名（`ModelCheckTool-win-x64.zip` など）とは一致しない。配布物の名前は利用者向けに意図的に据え置いているので変えない。
- 設問データ（CSV、画像、`project.json`）はコミットしない。実データを含みうるため `.gitignore` で `SampleData/`、`checklist.csv`、`project.json` を除外している。手元で試すデータは `SampleData/` に置く。

## コマンド

各ツールのディレクトリ（`tools/check-tool` または `tools/question-editor`）で実行する。

```bash
npm install        # 初回、および package.json の依存バージョンを変えた後は必ず
npm start          # 開発起動（electron .）
npm run dist       # electron-builder で Windows x64 ビルド（出力は dist/）
npm run make-zip   # dist/win-unpacked を PowerShell の Compress-Archive で zip 化
```

- テスト、リンター、型チェックは無い。動作確認はアプリを起動して行う。
- `npm install` 後に Electron 本体が入っていないとき（`node_modules/electron/path.txt` が無い）は `node node_modules/electron/install.js` を実行する。npm 12 の環境では、`npm install` のたびにこの状態になった。
- 依存バージョンを上げた後に `npm install` を忘れ、古い Electron 33 のままビルドした事故が過去にある。ビルド前に `node_modules/electron/package.json` の version が `package.json` の指定（現在 ^42.11.14）と合っているか確かめる。2 つのツールの Electron と electron-builder のバージョンは揃えておく。
- check-tool の `dist` は zip と NSIS インストーラーの両方を作る。NSIS 側（winCodeSign の展開）は Windows の開発者モードが無いと失敗することがあるが、`dist/win-unpacked/` は生成されるので `make-zip` で配布用 zip を作れる。question-editor の `dist` は zip のみ。
- バージョンは各 `package.json` の `version` で管理する（check-tool 1.0.2、question-editor 0.1.0）。

## アーキテクチャ

### 共通: ビルド工程の無い React

- React 18.3.1 の UMD 版を `vendor/` に置き、`index.html` から `<script>` で順に読む。バンドラー、JSX、ランタイムの Babel はどれも使っていない。Babel Standalone は 3MB あり起動も遅くなるため、レビューを受けて意図的に外した。戻さない。
- スクリプトはモジュールではなくグローバルで連携するので、読み込み順に意味がある（react → react-dom → CSV パーサー → app.js）。
- ファイルを追加したら、`index.html` の `<script>` と `package.json` の `build.files` の両方に足す。`build.files` に漏れると `npm start` では動くのに、ビルドした配布版でだけ読み込めずに起動しなくなる。
- `tools/check-tool/app.js` は JSX を Babel でコンパイルした出力（`/*#__PURE__*/React.createElement(...)`）で、元の JSX ソースはもう無い。`app.js` を `React.createElement` の形のまま直接編集する。
- `tools/question-editor/app.js` は手書きで、IIFE の中で `h = React.createElement` の別名を使っている。

### check-tool（ビューワー）

- preload も IPC も無く、ファイルはレンダラーが `<input webkitdirectory>` で読む（`webkitdirectory` は ref 経由でプロパティとして設定）。CSV ファイル単体ではなくフォルダを選ばせているのは、ブラウザの File API では選んだファイルの隣にある画像フォルダへ届かないため。ユーザーが一度 CSV 選択を希望し、この制約を説明して今の形に戻した経緯がある。
- `csv-parser.js` がフォルダ内のファイルを解析する: ルート直下の `.csv` を探し、画像を blob URL に変え、設問の ID（`カテゴリ名-01` 形式）を読み込み時に振る。
- `app.js` の `App` が画面遷移を持つ: `loading → category → check → (retest → check) → complete`。BAD にした設問は `pass2` に貯まり、再テストで出し直される。
- レイアウトは可変で、最小サイズは CSS の `.mct-stage`（960×720）と `BrowserWindow` の `minWidth/minHeight`（980×759）の両方でかけている。チェック画面はヘッダー / ボディ / フッターの flex column で、ボディに `flex: 1; minHeight: 0` が必要。
- 参照画像のサムネイルは `position: absolute; inset: 0` + `objectFit: cover` で中央を残すトリミング（グリッド内では `height: 100%` が効かなかったためこの形）。クリックで出るポップアップは `objectFit: contain` とビューポート単位で、ウィンドウに画像全体を収める。
- デザイントークン（`--mct-*`）は `index.html` の `<style>` にある。フォントは Google Fonts の Noto Sans JP。

### question-editor（エディター）

- ファイル I/O はすべて `main.js` が担い、`preload.js` が `window.qeAPI` として contextBridge で公開する。
- IPC で受け取るパスは、`main.js` の承認リスト（`approvedFiles` / `approvedFolders`）で必ず検証する。承認リストに入るのは、ダイアログで選ばれたパス、DnD のパス（preload の `webUtils.getPathForFile` → `paths:registerDropped`）、開いた `project.json` が参照する画像パスだけ。パスを扱う IPC ハンドラを足すときは `isApprovedPath`（読み取り）か `isApprovedTarget`（書き込み先）を通す。
- エクスポートは `checklist.csv`（UTF-8 BOM、CRLF）と `images/` を書き出す。画像名は basename だけを使い、重複は `name-2.ext` にリネームし、参照切れは CSV に書かずに警告する。
- 編集途中の状態は `project.json`（`version: 1`）に保存する。画像は絶対パスで持つので、別の PC へはそのままでは持っていけない。
- DevTools はパッケージ版では無効（`app.isPackaged` で判定）。

### CSV の取り決め

- 仕様の正本は `docs/question-editor-requirements.md` の §1。
- 同じ解析ロジックが `tools/check-tool/csv-parser.js`（読む側）と `tools/question-editor/src/csv.js`（読み書き両方、`window.QECsv`）に重複している。CSV の仕様を変えるときは両方を合わせて直す。なお `src/csv.js` 冒頭のコメントにある `index.html:82-114` は分離前の古い場所で、今は `csv-parser.js` にある。
- ヘッダーは小文字化して名前で照合する。Title と Category の両方が空の行は読み飛ばす。`Good_Image` / `Bad_Image` はフォルダのルートからの相対パスをカンマ区切りで並べ、`decodeURIComponent` してから解決する。見つからない画像は黙って無視する。

## セキュリティ設定（意図的なもの）

コードレビューと実機での不具合を経て決めた設定。理由を確かめずに外したり足したりしない。

- 両アプリ共通: `nodeIntegration: false`、`contextIsolation: true`。外部 URL は `openExternalHttpUrl()` で http / https だけを `shell.openExternal` に渡す。`will-navigate` は自ページの URL ならそのまま通す（初回ロードを止めないため）。
- check-tool の CSP は `script-src 'self'` で `'unsafe-inline'` を含まない。そのために CSV パーサーを `index.html` から `csv-parser.js` へ分離した。インラインの `<script>` を足すと起動しなくなる。画像は blob URL なので `img-src blob: data:`。
- question-editor の CSP は `img-src 'self' data: file:`。`file:` は DnD 中のドラッグプレビューのために残している。
- 両アプリとも `style-src 'unsafe-inline'` は残す。React のインライン style に必要で、外すと question-editor の DnD が動かなくなった。
- `sandbox: true` は有効にしない。OS からのファイル DnD が壊れるため question-editor では無効にしており、check-tool も同じ判断で付けていない。

## UI の確認

Electron のウィンドウはブラウザペインのツールで直接スクリーンショットを撮れない。見た目だけなら、ツールのディレクトリを静的サーバーで配信して `index.html` をブラウザで開く方法がある（このリポジトリではまだ試していない）。question-editor は `window.qeAPI` に依存する機能（ダイアログ、保存、エクスポートなど）がブラウザでは動かないので、それらは実際に Electron で起動して確かめる。
