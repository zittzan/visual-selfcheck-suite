# Visual SelfCheck Suite

参照画像（Good / Bad 例）を見比べながらセルフチェックを行うためのビューワーとエディターのセットです。

| ツール | 役割 | ディレクトリ |
|---|---|---|
| Visual SelfCheck | 設問を表示して OK / Skip / BAD を判定するビューワー | [tools/check-tool](tools/check-tool) |
| 設問編集ツール | 設問データ（CSV + 画像）を作成・書き出すエディター | [tools/question-editor](tools/question-editor) |

エディターが書き出した CSV + 画像フォルダを、ビューワーが読み込みます。
CSV の仕様は [docs/question-editor-requirements.md](docs/question-editor-requirements.md) を参照してください。

## 開発

各ツールは独立した Electron アプリです。ツールのディレクトリで `npm install` してから `npm start` で起動、`npm run dist` でビルドします。詳細は各ツールの README を参照してください。
