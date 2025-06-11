# Chatbot Sage Backend Server

## 概要
YouTube ライブチャット統合と管理機能を提供するExpress.jsベースのバックエンドサーバー

## 起動方法
```bash
cd server
npm install
npm start
```

## 環境設定
`.env` ファイルに以下を設定：
```
ADMIN_PASSWORD_HASH=管理者パスワードのbcryptハッシュ
SESSION_SECRET=セッション暗号化キー
```

## エンドポイント
- **認証**: `/api/auth/*`
- **YouTube監視**: `/api/youtube/*`
- **設定管理**: `/api/config/*`
- **ログ管理**: `/api/logs/*`

## データファイル
- `data/config.json`: システム設定
- `data/logs.json`: システムログ

## 依存関係
- express: Webサーバーフレームワーク
- bcrypt: パスワードハッシュ
- cors: CORS設定
- express-rate-limit: レート制限
