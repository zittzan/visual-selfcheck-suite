# Question Editor

Model Check Tool 用の設問編集エディタ。
`tools/check-tool` が読み込む `checklist.csv` + `images/` フォルダを GUI で編集・出力する。

## 主な機能

- カテゴリと設問の CRUD（追加・編集・削除・並び替え）
- ドラッグ&ドロップ または ↑↓ ボタンで並び替え
- 設問のカテゴリ間移動（DnD でカテゴリにドロップ）
- 画像（OK 例 / NG 例）の追加（ファイル選択 or DnD）
- ドラフトを `project.json` で保存・再開
- `checklist.csv` + `images/` フォルダのエクスポート
- 既存 check-tool フォルダの取り込み（CSV パース）
- エクスポート前の警告（Title/Category 未設定、参照切れ画像）

## 必要環境

- Windows 11（Mac は未検証だが Electron なので動くはず）
- Node.js（開発時のみ）

## 開発

```bash
cd tools/question-editor
npm install
npm start
```

## 配布物のビルド

```bash
npm run dist       # electron-builder で zip 生成
# または
npm run make-zip   # dist/win-unpacked を手動 zip 化
```

成果物は `dist/QuestionEditor-win-x64.zip`（または electron-builder 既定の zip）。
解凍して `Question Editor.exe` を起動するだけで動作する。

## ファイル構成

```
question-editor/
  package.json         electron / electron-builder
  main.js              メインプロセス（ファイル I/O・ダイアログ）
  preload.js           contextBridge で安全に API 公開
  index.html           HTML + CSS
  app.js               React アプリ本体（プリコンパイル不要・素 JS）
  src/
    csv.js             CSV パース / シリアライズ（check-tool と同等）
  vendor/
    react.production.min.js
    react-dom.production.min.js
  build/               アイコン等
```

## CSV スキーマ

check-tool 側の仕様に従う。詳細は
[../../docs/question-editor-requirements.md](../../docs/question-editor-requirements.md) §1-2 を参照。

| カラム | 必須 | 補足 |
|---|---|---|
| `Title` | ✅ | 空だと check-tool に読み飛ばされる |
| `Category` | ✅ | 同上 |
| `Description` | | 複数行可 |
| `Note` | | |
| `Good_Image` | | カンマ区切り複数可、`images/<file>` 形式 |
| `Bad_Image` | | 同上 |
| `URL` | | 参考リンク |

- ヘッダー名は **小文字化して比較**されるので大文字小文字どちらでも可
- UTF-8 BOM 付きで出力
- 改行は CRLF

## 動作フロー

1. **新規** または **CSV取込** で開始
2. 左ペインでカテゴリを選択・追加
3. 中央で設問を選択・追加・並び替え
4. 右ペインで内容と画像を編集
5. **保存** で `project.json` を残し、いつでも再開可能
6. **エクスポート** で check-tool が読める CSV + 画像フォルダを出力

## メモ

- `project.json` 内の画像パスは**絶対パス**で保持される。別 PC に project.json を渡す場合は画像も同じ場所に置く必要がある
- エクスポート時、同名画像はリネーム（`name-2.ext`）して衝突回避
- 参照切れの画像は CSV に書き出さず、警告ダイアログで通知
