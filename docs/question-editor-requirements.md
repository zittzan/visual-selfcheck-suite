# 設問編集ツール 要件定義・引き継ぎ資料

> **背景**  
> `tools/check-tool` の設問データは当初 Notion データベースで管理し、CSV + 画像をエクスポートして利用する想定だった。  
> しかし Notion の権限制限によりチームメンバー全員がエクスポートできないことが判明したため、  
> チームで共同編集・エクスポートできる **専用の設問編集ツール** を新規開発することになった。

---

## 1. check-tool が要求する CSV・フォルダ構造

### 1-1. フォルダ構造

チェックツールは `<input webkitdirectory>` でフォルダごと受け取る。
フォルダ内に以下の構造が必要。

```
<任意のフォルダ名>/
  checklist.csv         ← CSVは必ずルート直下（サブフォルダ不可）
  images/               ← 画像フォルダ（名前は任意）
    good-01.png
    bad-01.png
    category-A/         ← ネストも可
      sample.jpg
  ...
```

- CSV ファイルは **ルート直下に 1 つだけ** 置くこと（`.csv` 拡張子で判定）
- 画像パスは **ルートからの相対パス** で記述する（例: `images/good-01.png`）

### 1-2. CSV スキーマ

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `Title` | string | ✅ | 設問タイトル（空行はスキップされる） |
| `Category` | string | ✅ | カテゴリ名（空行はスキップされる） |
| `Description` | string | | 説明文（複数行可） |
| `Note` | string | | 補足メモ |
| `Good_Image` | string | | OK 例の画像パス（カンマ区切りで複数可） |
| `Bad_Image` | string | | NG 例の画像パス（カンマ区切りで複数可） |
| `URL` | string | | 参考リンク URL |

**ヘッダー行の仕様:**
- 1 行目はヘッダー（カラム名）、2 行目以降がデータ
- ヘッダー名は **小文字に変換して比較**される（`good_image` でも `Good_Image` でも可）
- カラム順は任意（位置ではなく名前で紐づく）

**画像パスの仕様:**
- `Good_Image` / `Bad_Image` は **カンマ区切りの相対パス列**
  - 例: `images/good-01.png,images/good-02.png`
- パスは `decodeURIComponent` で処理される（URL エンコードされていても可）
- 存在しないパスは **静かに無視**される（エラーにならない）

**エンコード・改行:**
- **UTF-8（BOM あり推奨）**：パーサーは BOM（U+FEFF）を自動除去する
- 改行は `\r\n`（CRLF）または `\n`（LF）どちらも可
- フィールドのクォートは RFC 4180 準拠（`"` でクォート、`""` でエスケープ）

### 1-3. パーサーが生成するデータ構造（check-tool 内部）

```js
{
  id: "カテゴリ名-01",      // category + 連番（カテゴリ内の出現順で採番）
  category: string,
  title: string,
  description: string,
  note: string,
  goodImages: [objectURL], // 解決済み Blob URL の配列
  badImages:  [objectURL],
  url: string
}
```

`id` はインポート時に自動生成されるため、CSV には不要。

---

## 2. 新規開発：設問編集ツール 機能要件

### 2-1. 必須機能

#### データ入力
- [ ] 設問の新規作成（全フィールド入力）
- [ ] 設問の編集（全フィールド）
- [ ] 設問の削除
- [ ] カテゴリの追加・リネーム・削除
- [ ] カテゴリ内の設問並び替え（ドラッグ or 上下ボタン）
- [ ] カテゴリ間の設問移動

#### 画像管理
- [ ] `Good_Image` / `Bad_Image` へのファイル追加（複数選択可）
- [ ] 画像のプレビュー表示
- [ ] 画像の削除（CSV のパス参照を除去）
- [ ] 画像ファイルは **エクスポート時に指定フォルダへコピー**される

#### ファイル I/O
- [ ] **新規作成**：空の設問リストから開始
- [ ] **読み込み**：既存の CSV + 画像フォルダを開いて編集継続
- [ ] **保存（エクスポート）**：check-tool が読めるフォルダ構造で出力
  - CSV（UTF-8 BOM あり）
  - 参照画像ファイルを `images/` 以下にコピー

### 2-2. あると便利な機能（優先度：中）

- [ ] カテゴリ一覧サイドバー（クリックでスクロール / フィルタ）
- [ ] 設問の一括インポート（既存 CSV をマージ）
- [ ] 画像ファイルのリネーム・整理（エクスポート時に `images/<category>/<番号>.ext` に正規化）
- [ ] 設問プレビュー（check-tool の Check 画面に近いレイアウトで確認）
- [ ] 未設定フィールドの一覧表示（Title なし・画像なし等の警告）

### 2-3. 対象ユーザー・想定環境

- **ユーザー**: チームメンバー（複数人）
- **OS**: Windows 11（Mac も考慮できると望ましい）
- **前提スキル**: 非エンジニア想定（インストール不要か最小限）
- **同時編集**: 現時点では不要（1 人が編集してエクスポートしたものをチームで使う）

---

## 3. 技術スタック候補

| 案 | 技術 | メリット | デメリット |
|---|---|---|---|
| **A: Electron** | Electron + React（check-tool と同構成） | check-tool と統一、ファイルシステム操作が容易 | バイナリ配布が必要 |
| **B: Web アプリ（ローカル）** | Vite + React（`file://` or `localhost`） | 配布が軽量、開発が速い | ファイル保存に制限あり（File System Access API） |
| **C: Python GUI** | Python + tkinter / PySimpleGUI | 軽量・インストール簡単 | UI の作り込みがつらい |

**推奨: A（Electron）**  
check-tool と同じプロジェクト内（`tools/question-editor/`）に置け、  
ファイル保存・画像コピーが容易。Electron ガイドライン（`~/.claude/references/electron-desktop-tool.md`）も活用できる。

---

## 4. check-tool 側の現状メモ

| 項目 | 状況 |
|---|---|
| バージョン | v1.0.0 |
| Electron | 42.2.0 |
| electron-builder | 26.8.1 |
| CSVパーサー | `index.html` 内インライン（`parseCSV` / `buildFileMap` / `findCSVFile` / `buildQuestions`） |
| React コンポーネント | `app.js`（プリコンパイル済み、961 行） |
| メインプロセス | `main.js`（URL バリデーション適用済み） |

**check-tool 側で将来対応が必要な点:**
- `vendor/babel.min.js` が `vendor/` に残っているが、`index.html` からは参照されていない（削除可）
- README.md の「技術スタック」欄が古い（Babel Standalone / Electron 33 のまま）→ 更新推奨

---

## 5. 参考：CSV サンプル

```csv
Title,Category,Description,Note,Good_Image,Bad_Image,URL
足のウェイト確認,リグ,足のウェイトが正しく設定されているかを確認する,IK・FKどちらの状態でもテストすること,"images/good-01.png,images/good-02.png",images/bad-01.png,
肘の曲がり方,リグ,肘が自然に曲がるかを確認する,,images/good-03.png,images/bad-02.png,https://example.com/rig-guide
ポリゴン数,ポリゴン,規定ポリゴン数の範囲内かを確認する,LOD0 は 5000 以下,,images/bad-poly.png,
```

---

*作成日: 2026-05-28 / 対象: tools/check-tool*
