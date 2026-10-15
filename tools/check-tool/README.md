# Model Check Tool

3D モデリング作業のセルフチェックを支援するデスクトップアプリケーションです。  
設問編集ツール（`tools/question-editor`）からエクスポートしたチェックリスト（CSV + 画像）を読み込み、Good / Bad 画像を並べながら設問ごとに OK / Skip / BAD の判定を行います。

---

## 機能

- **CSV 読み込み**：設問編集ツールのエクスポートフォルダを選択するだけで設問と画像を自動認識
- **カテゴリ選択**：チェックしたいカテゴリだけを選んで開始
- **Good / Bad 画像比較**：設問ごとに参考画像を並べて確認
- **再テスト機能**：BAD 判定した設問のみ自動で再出題
- **常時最前面表示**：Maya・MotionBuilder などの作業ウィンドウと並べて使用可能
- **レスポンシブレイアウト**：ウィンドウサイズに合わせて画像エリアが可変（最小 960×720）

---

## 使い方（配布版）

配布された `ModelCheckTool-win-x64.zip` を展開し、`Model Check Tool.exe` をダブルクリックして起動してください。  
Node.js・Python などの追加インストールは不要です。

### チェックリストの準備

設問編集ツールでチェックリストを作成してエクスポートしてください。CSV のカラム構成は以下のとおりです。

| カラム名 | 内容 |
|---|---|
| `Title` | 設問のタイトル（必須） |
| `Category` | カテゴリ名（必須） |
| `Description` | 説明文 |
| `Note` | 補足メモ |
| `Good_Image` | OK 例の画像ファイルパス（カンマ区切りで複数可） |
| `Bad_Image` | NG 例の画像ファイルパス（カンマ区切りで複数可） |
| `URL` | 参考リンク |

エクスポートすると CSV ファイルと画像が同じフォルダに生成されます。  
アプリ起動後、「チェックリストを開く」からそのフォルダを選択してください。

---

## 開発・ビルド

### 必要環境

- **Node.js** v18 以上（`node -v` で確認）
- インターネット接続（初回セットアップ時に Electron 本体 ~200MB をダウンロード）

### セットアップ

```bash
cd tools/check-tool
npm install
```

> **補足**：まれに Electron バイナリのダウンロードが失敗する場合があります。  
> その際は以下を追加で実行してください。
> ```bash
> node node_modules/electron/install.js
> ```

### 動作確認

```bash
npm start
```

アプリが起動すれば環境は正常です。

### ビルド（配布版の作成）

#### zip 版（ポータブル）― Developer Mode 不要

```bash
npm run dist      # エラーが表示されても dist/win-unpacked/ は生成されます
npm run make-zip  # dist/ModelCheckTool-win-x64.zip が完成します
```

受け取った側は zip を展開して `Model Check Tool.exe` を実行するだけで動作します。

#### インストーラー版（.exe）― Developer Mode が必要

Windows の Developer Mode を有効にしてからビルドしてください。

> **設定** → **システム** → **開発者向け** → **開発者モード** → オン

```bash
npm run dist
```

`dist/` フォルダにインストーラー（`Model Check Tool Setup x.x.x.exe`）と zip の両方が生成されます。

---

## ファイル構成

```
tools/check-tool/
├── index.html          # 画面の土台とスタイル（CSP 設定を含む）
├── app.js              # UI 本体（React.createElement で記述、ビルド不要）
├── csv-parser.js       # CSV 解析・設問データ生成
├── main.js             # Electron メインプロセス
├── package.json        # 依存関係・ビルド設定
├── package-lock.json   # 依存バージョン固定
├── vendor/             # オフライン動作用ローカルライブラリ
│   ├── react.production.min.js
│   └── react-dom.production.min.js
└── .gitignore          # node_modules/ dist/ を除外
```

> `node_modules/` と `dist/` は `.gitignore` により管理対象外です。  
> リポジトリ取得後は必ず `npm install` を実行してください。

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| UI フレームワーク | React 18.3.1 (UMD) |
| デスクトップ化 | Electron 42 |
| パッケージング | electron-builder 26 |
| ビルドツール | なし（JSX を使わず `React.createElement` で記述） |
