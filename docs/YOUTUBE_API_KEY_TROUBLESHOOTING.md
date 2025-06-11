# YouTube Data API キー確認チェックリスト

## Google Cloud Console での確認事項

### 1. APIキーの状態
- [ ] APIキーが削除されていない
- [ ] APIキーが無効化されていない
- [ ] APIキーに使用制限が設定されていない

### 2. プロジェクト設定
- [ ] 正しいプロジェクトを選択している
- [ ] YouTube Data API v3が有効化されている
- [ ] 請求アカウントが設定されている（必要な場合）

### 3. APIキーの制限設定
- [ ] アプリケーションの制限：なし または 適切に設定
- [ ] API制限：YouTube Data API v3が含まれている
- [ ] クォータ制限：超過していない

### 4. 一般的な解決策

#### 新しいAPIキーを作成する場合：
1. Google Cloud Console → APIとサービス → 認証情報
2. 「認証情報を作成」→「APIキー」
3. 新しく作成されたAPIキーをコピー
4. API制限で「YouTube Data API v3」を選択
5. 保存

#### 既存のAPIキーを確認する場合：
1. Google Cloud Console → APIとサービス → 認証情報
2. 該当のAPIキーをクリック
3. 「キーの制限」で以下を確認：
   - アプリケーションの制限：なし
   - API制限：YouTube Data API v3が選択されている

### 5. テスト用コマンド
ターミナルでAPIキーをテスト：
```bash
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=YOUR_API_KEY"
```

有効なAPIキーの場合、JSON形式のレスポンスが返されます。
無効なAPIキーの場合、"API key not valid"エラーが返されます。
