# Chatbot Sage - Development Tools

## 概要
開発・テスト用のユーティリティファイル集

## ファイル一覧

### テストスイート
- `chloe-test-suite.js`: 包括的なシステムテスト
- `chloe-quick-test.js`: 高速テスト
- `test-emotion-responses.js`: 感情応答テスト
- `test-fixes.js`: バグ修正テスト

### デバッグツール
- `emotion-debugger.js`: 感情分析デバッガー
- `emotion-test-mock.js`: 感情テストモック
- `lip-sync-test.js`: リップシンクテスト

## 使用方法
これらのファイルは開発時のみ使用し、本番環境には含めません。

```bash
# テストファイルをpublicに一時コピーして実行
cp dev-tools/chloe-test-suite.js public/
# ブラウザでテスト実行
```

## 注意事項
- 本番環境では使用しない
- テスト後はpublicフォルダから削除する
- 新機能追加時はテストファイルも更新する
