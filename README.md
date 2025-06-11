# Gemini Chatbot with Live2D (Natori Edition) - YouTube Live Chat Integration

Live2Dキャラクター「Natori」を使用したGemini APIチャットボットに、YouTubeライブチャット統合機能を追加した完全版システムです。

## 最新の更新 (v3.0.0) - Major Update 🎉

### セキュリティアーキテクチャ分離 🔒
- **3層アーキテクチャ**: フロントエンド、バックエンドAPI、管理画面の完全分離
- **APIキーセキュリティ**: フロントエンドからAPIキー情報を完全削除
- **認証システム**: bcryptハッシュによる安全な管理画面認証
- **セッション管理**: Express.jsベースのセキュアな認証システム

### YouTubeライブチャット完全統合 📺
- **リアルタイム監視**: YouTube Data API v3による継続的チャット監視
- **自動メッセージ取得**: ライブチャットメッセージの自動取得・配信
- **統合UI**: フロントエンドでのYouTubeメッセージ自動表示
- **自動応答**: YouTubeコメントに対するNatoriの自動応答
- **管理機能**: 包括的な管理画面での監視制御

### バックエンドAPI実装 🛠️
- **Express.jsサーバー**: 堅牢なREST API実装
- **設定管理**: 安全な設定ファイル管理システム
- **ログシステム**: 包括的なシステムログ記録・管理
- **レート制限**: API濫用防止機能

### 管理画面実装 ⚙️
- **ダッシュボード**: リアルタイムシステム監視
- **YouTube設定**: APIキー管理、動画設定、接続テスト
- **監視制御**: YouTube監視の開始/停止制御
- **ログ管理**: システムログの表示・管理

## アーキテクチャ構成

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Public Client  │    │   Backend API    │    │  Admin Panel    │
│  (Frontend)     │    │   (Server)       │    │  (Management)   │
│ localhost:8080  │◄──►│ localhost:3001   │◄──►│ localhost:8081  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └───────────► Gemini API ◄────────────────────────┘
                            │
                   YouTube Data API v3
```

## クイックスタート

### 1. バックエンドAPI起動
```bash
cd server
npm install
npm start
# → localhost:3001で起動
```

### 2. フロントエンド起動
```bash
cd public
python3 -m http.server 8080
# → localhost:8080で起動
```

### 3. 管理画面起動
```bash
cd admin
python3 -m http.server 8081
# → localhost:8081で起動
```

### 4. 管理画面設定
1. http://localhost:8081/admin.html にアクセス
2. ログイン（admin / chloe2025）
3. YouTube設定でAPIキーと動画IDを設定
4. 監視開始

## 主要機能

### チャットボット機能
- **Natori性格システム**: 一貫したキャラクター性を持つ対話
- **Live2D表情制御**: 感情分析による自動表情変更
- **マルチ音声エンジン**: AivisSpeech、Web Speech API、Google Cloud TTS
- **リップシンク**: 音声に同期した高精度口パク

### YouTube統合機能
- **ライブチャット監視**: リアルタイムメッセージ取得
- **自動応答**: YouTubeコメントへの自動返答
- **統合表示**: YouTubeメッセージの専用UI表示
- **管理制御**: 包括的な監視制御システム

### セキュリティ機能
- **認証保護**: 管理画面のセッション認証
- **APIキー分離**: フロントエンドでのAPIキー露出防止
- **レート制限**: API濫用防止
- **ログ監視**: 全操作の記録・監視

## ファイル構成

```
chatbot_sage/
├── public/          # フロントエンド（公開クライアント）
├── server/          # バックエンドAPI（セキュアサーバー）
├── admin/           # 管理パネル（認証保護）
├── docs/            # ドキュメント
├── dev-tools/       # 開発・テスト用ツール
├── legacy-files/    # 旧ファイル（後方互換性）
└── models/          # Live2Dモデル
```

## ドキュメント

- **[技術仕様書](docs/SPECIFICATION.md)**: 詳細な技術仕様
- **[YouTube API設定](docs/YOUTUBE_API_SETUP.md)**: YouTube API設定ガイド
- **[アーキテクチャ分離計画](docs/ARCHITECTURE_SEPARATION_PLAN.md)**: システム設計文書

## 変更履歴

- **v3.0.0** (2025/6/11): セキュリティアーキテクチャ分離、YouTubeライブチャット完全統合
- **v2.4.0** (2025/6/8): Natori性格システム完全実装
- **v2.3.0** (2025/6/8): プロジェクト整理・最適化、リップシンク機能強化
- **v2.2.0** (2025/6/7): 感情表現制御システム改善
- **v2.1.0** (2025/6/7): 感情ベースモーション制御システム追加
- **v2.0.0** (2025/6/2): Live2D統合とマルチ音声エンジン対応
