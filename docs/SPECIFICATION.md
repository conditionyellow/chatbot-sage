# Gemini Chatbot with Live2D - 技術仕様書

## 概要

本アプリケーションは、Google Cloud Run上にデプロイされたサーバーを経由してGemini APIと連携し、Live2Dキャラクター（Natori）が応答するWebチャットボットです。

### バージョン情報
- **アプリケーション名**: Gemini Chatbot with Live2D (Natori Edition) - YouTube Live Chat Integration
- **バージョン**: 3.0.0 (Major Update)
- **作成日**: 2025年6月2日
- **最終更新**: 2025年6月11日（セキュリティアーキテクチャ分離とYouTubeライブチャット統合完了）
- **動作確認済み**: 2025年6月11日（完全統合システムの実動作テスト成功）

---

## システム構成

### セキュリティアーキテクチャ概要
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Public Client  │    │   Backend API    │    │  Admin Panel    │
│  (Frontend)     │    │   (Server)       │    │  (Management)   │
│ localhost:8080  │◄──►│ localhost:3001   │◄──►│ localhost:8081  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌──────────────────┐               │
         └─────────────►│  Cloud Run API   │◄──────────────┘
                        │  (Gemini Proxy)  │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │ YouTube Data API │
                        │   (Live Chat)    │
                        └──────────────────┘
```

### セキュリティ分離設計
1. **Public Frontend**: APIキー情報を含まない公開インターface
2. **Backend API**: APIキー管理、YouTube監視、認証処理
3. **Admin Panel**: 管理者専用の設定画面（認証保護）

### 技術スタック
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript, PIXI.js v7.2.4
- **バックエンド**: 
  - Express.js (Node.js)
  - YouTube Data API v3 クライアント
  - bcrypt (パスワードハッシュ)
  - Session認証
- **AI API**: Google Gemini API (Cloud Run Proxy経由)
- **外部API連携**: YouTube Data API v3 (Live Chat Messages)
- **Live2D**: 
  - PIXI.js v7.2.4 (WebGL Renderer)
  - pixi-live2d-display (Cubism 4 Support)
  - Live2D Cubism Web SDK v5-r.4
- **音声合成**: 
  - Web Speech API (SpeechSynthesis) - ブラウザ内蔵
  - Google Cloud Text-to-Speech API - クラウドベース高品質音声
  - AivisSpeech Engine - ローカル高品質日本語音声合成
- **通信**: Fetch API, REST API, WebSocket (将来拡張)

---

## ファイル構成

### 分離後のアーキテクチャ
```
chatbot_sage/
├── public/                         # フロントエンド（公開クライアント）
│   ├── index.html                  # メインHTMLファイル
│   ├── style.css                   # フロントエンドスタイル
│   ├── script.js                   # メインアプリケーションロジック
│   ├── backend-client.js           # バックエンド通信クライアント
│   ├── live2d-pixi.js             # Live2D PIXI統合コントローラー
│   ├── emotion-analyzer-v2.js      # 感情分析エンジン（v2）
│   ├── natori-personality.js       # Natori性格システム
│   ├── libs/                       # フロントエンドライブラリ
│   │   └── cubism4.min.js         # PIXI Live2D Display ライブラリ
│   ├── models/                     # Live2Dモデル
│   │   └── natori/                # Natoriキャラクターモデル
│   └── SDK/                       # Live2D Cubism SDK
│       └── CubismSdkForWeb-5-r.4/ # Cubism SDK v5
├── server/                         # バックエンドAPI（セキュアサーバー）
│   ├── app.js                     # Express.jsメインアプリケーション
│   ├── package.json               # Node.js依存関係
│   ├── .env                       # 環境変数（APIキー等）
│   ├── middleware/                # Express.jsミドルウェア
│   │   └── auth.js               # 認証ミドルウェア
│   ├── routes/                    # APIルート
│   │   ├── auth.js               # 認証API
│   │   ├── config.js             # 設定管理API
│   │   ├── youtube.js            # YouTube監視API
│   │   └── logs.js               # ログ管理API
│   ├── services/                  # ビジネスロジック
│   │   ├── config.js             # 設定サービス
│   │   └── logs.js               # ログサービス
│   └── data/                      # データストレージ
│       ├── config.json           # 設定データ
│       └── logs.json             # システムログ
├── admin/                          # 管理パネル（認証保護）
│   ├── admin.html                 # 管理画面HTML
│   ├── admin-style.css           # 管理画面スタイル
│   └── admin-script.js           # 管理画面ロジック
├── docs/                          # ドキュメント
│   ├── SPECIFICATION.md          # 本仕様書
│   ├── ARCHITECTURE_SEPARATION_PLAN.md # アーキテクチャ分離計画
│   ├── YOUTUBE_API_SETUP.md      # YouTube API セットアップガイド
│   ├── YOUTUBE_API_KEY_TROUBLESHOOTING.md # API Key トラブルシューティング
│   └── GOOGLE_TTS_SETUP.md       # Google TTS セットアップガイド
├── libs/                          # 共有ライブラリ（後方互換性）
├── models/                        # モデルファイル（後方互換性）
├── SDK/                          # SDK（後方互換性）
├── *.js                          # ルートレベルファイル（後方互換性/開発用）
├── .git/                         # Gitリポジトリ
└── .github/                      # GitHub設定
```

### セキュリティ考慮事項
- **APIキー分離**: フロントエンドからAPIキーを完全削除
- **認証保護**: 管理画面はbcryptハッシュ認証で保護
- **最小権限原則**: 各コンポーネントは必要最小限の権限のみ
- **ログ監視**: 全API呼び出しとエラーを記録

---

## 機能仕様

### 1. フロントエンド機能（Public Client）

#### 1.1 基本チャット
- **入力方式**: テキスト入力フィールド（1行）
- **送信方法**: 
  - 送信ボタンクリック
  - Enterキー押下
- **応答表示**: ストリーミング表示対応
- **履歴管理**: 自動スクロール、永続化

#### 1.2 Live2Dキャラクター表示
- **キャラクター**: Natori（女性、VTuber風）
- **表情システム**: 感情分析による自動表情変更
- **アニメーション**: アイドルモーション、感情表現
- **リップシンク**: 音声に同期した口パク
- **物理演算**: 髪揺れ、服揺れ
- **手動制御**: 表情ボタンによる手動操作

#### 1.3 音声合成機能
- **音声ON/OFF**: 🔊/🔇 ボタンで制御
- **音声停止**: ⏸️ ボタンで即座停止
- **エンジン切り替え**: 🎵 ボタンで循環切り替え
- **対応エンジン**:
  1. **AivisSpeech Engine** (🎵Aivis) - デフォルト、最高品質
  2. **Web Speech API** (🎵Web) - ブラウザ内蔵
  3. **Google Cloud TTS** (🎵GCP) - クラウドベース高品質
- **自動フォールバック**: エラー時のエンジン切り替え

#### 1.4 YouTube統合表示
- **YouTube状況表示**: リアルタイム監視状態
- **メッセージ受信**: ライブチャットメッセージの自動表示
- **専用スタイル**: 🎥アイコン付きYouTubeメッセージ
- **自動応答**: YouTubeメッセージへのボット応答

### 2. バックエンドAPI機能（Secure Server）

#### 2.1 認証システム
- **セッション認証**: Express-sessionベース
- **パスワードハッシュ**: bcryptによる安全な保存
- **認証エンドポイント**: 
  - `POST /api/auth/login` - ログイン
  - `POST /api/auth/logout` - ログアウト
  - `GET /api/auth/status` - 認証状態確認

#### 2.2 YouTube監視API
- **設定管理**: APIキー、動画ID、チェック間隔
- **監視制御**: 
  - `POST /api/youtube/start` - 監視開始
  - `POST /api/youtube/stop` - 監視停止
  - `GET /api/youtube/status` - 監視状況
- **メッセージ配信**: 
  - `GET /api/youtube/frontend/messages` - フロントエンド用メッセージ取得
- **API テスト**: 
  - `POST /api/youtube/check-api-availability` - API可用性チェック
  - `POST /api/youtube/test-video` - 動画接続テスト

#### 2.3 設定管理API
- **設定CRUD**: 
  - `GET /api/config` - 設定取得
  - `POST /api/config` - 設定保存
- **バリデーション**: 入力値検証と型変換
- **永続化**: JSON ファイルベース

#### 2.4 ログ管理API
- **ログ記録**: 
  - `POST /api/logs` - ログ追加
  - `GET /api/logs` - ログ取得
- **レベル別管理**: info, warning, error, debug
- **自動ローテーション**: 最大1000件まで保持

### 3. 管理画面機能（Admin Panel）

#### 3.1 認証保護
- **ログイン画面**: ユーザー名/パスワード
- **デフォルト認証**: admin / chloe2025
- **セッション管理**: 自動ログアウト機能

#### 3.2 ダッシュボード
- **システム監視**: リアルタイム状況表示
- **YouTube監視状況**: 接続状態、メッセージ数
- **サーバー情報**: 稼働時間、最終更新時刻
- **最新ログ**: 直近のシステムログ

#### 3.3 YouTube設定
- **APIキー管理**: 表示/非表示切り替え機能
- **動画設定**: 
  - 動画ID/URL入力（複数形式対応）
  - チェック間隔設定（5-60秒）
- **接続テスト**: 
  - API可用性チェック
  - 動画接続テスト
  - 詳細エラー表示
- **監視制御**: 開始/停止ボタン

#### 3.4 システム設定
- **ログ設定**: レベル、保存数、有効/無効
- **設定保存**: 永続化機能

#### 3.5 ログ管理
- **ログ表示**: 時系列表示、フィルタリング
- **リアルタイム更新**: 自動リフレッシュ
- **ログクリア**: 一括削除機能
  - Enterキー押下
- **メッセージ表示**: 
  - ユーザーメッセージ（右寄せ、青背景）
  - ボットメッセージ（左寄せ、グレー背景）
- **初期メッセージ**: "こんにちは！私はNatoriです。何か質問がありますか？"

#### 1.2 メッセージ処理
- **文字数制限**: フロントエンド側制限なし
- **テキスト表示**: プレーンテキスト
- **自動改行**: CSS word-wrap: break-word
- **履歴管理**: 配列でクライアント側保持

#### 1.3 応答機能
- **応答時間**: Cloud Run + Gemini API処理時間
- **ローディング表示**: "思考中..." メッセージ
- **音声読み上げ**: 複数音声エンジンによる自動音声合成
- **Live2D連携**: 音声再生時のキャラクターアニメーション
- **エラーハンドリング**: 
  - 接続エラー時の適切なエラーメッセージ
  - 送信ボタンの無効化/有効化

#### 1.4 YouTubeライブチャット連携（NEW）
- **自動監視**: YouTube Data API v3を使用したライブチャット取得
- **リアルタイム応答**: 取得したコメントに対する自動応答
- **重複防止**: 処理済みメッセージの管理とタイムアウト処理
- **視覚的区別**: YouTubeメッセージ専用スタイル（🎥アイコン、赤背景）
- **設定管理**: API Key、配信ID、チェック間隔の保存・復元
- **エラーハンドリング**: API制限、認証エラー、接続失敗の適切な処理
- **フォールバック**: OpenAI選択失敗時のランダム選択

### 2. Live2Dキャラクター機能

#### 2.1 キャラクター表示
- **キャラクター**: Natori（Live2D Cubism 4.0モデル）
- **表示エリア**: 360x540ピクセル専用エリア
- **レンダリング**: PIXI.js + WebGL
- **配置**: 顔と上半身が表示エリア内に適切に配置
- **スケール**: 0.15倍（元サイズ1600x2800を最適化）
- **位置**: 水平中央、垂直中央から50ピクセル上
- **アンカーポイント**: 上から20%の位置（顔の部分）を基準

#### 2.2 表情制御
- **表情ボタン**: 5つの表情切り替えボタン
  - 😊 笑顔 (Smile)
  - 😮 驚き (Surprised)
  - 😢 悲しみ (Sad)
  - 😠 怒り (Angry)
  - 😐 通常 (Normal)
- **表情変更**: Live2Dパラメータによるリアルタイム表情変更
- **アクティブ表示**: 現在の表情ボタンのハイライト表示

#### 2.3 音声連携アニメーション
- **リップシンク**: 音声再生時の口の開閉アニメーション
- **話し始め表情**: 音声開始時に笑顔表情に変更
- **表情復帰**: 音声終了まで感情表現を維持（従来の1.5秒固定から変更）
- **パラメータ制御**: Live2D Coreによる口の開閉パラメータ操作

#### 2.4 感情ベースモーション制御（UPDATED）
- **感情分析**: ボット応答テキストの自動感情判定
- **リアルタイム制御**: 感情に応じた表情とモーションの自動変更
- **対応感情**: 
  - 😊 喜び (happy) → Smile表情 + Idleモーション
  - 😮 驚き (surprised) → Surprised表情 + Tapモーション
  - 😢 悲しみ (sad) → Sad表情 + FlickDown@Bodyモーション
  - 😠 怒り (angry) → Angry表情 + Flick@Bodyモーション
  - 🤔 思考 (thinking) → Normal表情 + Tap@Headモーション
  - ⚡ 興奮 (excited) → Smile表情 + FlickUp@Headモーション
  - 😐 中立 (neutral) → Normal表情 + Idleモーション
- **中立優先**: neutral感情の検出感度を向上（intensity: 0.7）
- **happy感情の制限**: 強い感情表現のみに限定（一般的な「良い」「nice」は除外）
- **音声終了連動**: 感情表現を音声終了まで維持し、音声終了イベントで復帰
- **信頼度制御**: 感情判定の信頼度が0.3未満では変更なし
- **キーワードベース**: 日本語感情キーワード辞書による高速分析

#### 2.5 技術実装詳細
- **ライブラリ**: PIXI.js v7.2.4 + pixi-live2d-display
- **レンダリング**: WebGL、60fps、ハードウェアアクセラレーション対応
- **モデル読み込み**: `.model3.json`ファイルの自動パース
- **感情分析エンジン**: JavaScript感情キーワード辞書、クライアントサイド処理
- **パフォーマンス最適化**: 
  - autoDensity無効、resolution固定（1倍）
  - キャンバスサイズ360x540px固定
  - スケール最適化（0.15倍）でメモリ効率化
- **エラーハンドリング**: モデル読み込み失敗時のフォールバック表示

### 3. ユーザーインターフェース

#### 3.1 レイアウト
- **フレックスレイアウト**: Live2Dエリア + チャットエリアの横並び配置
- **Live2Dコンテナ**: 400x600px、左側固定配置
- **チャットコンテナ**: 右側可変幅、最小400px
- **レスポンシブ対応**: 1024px以下で縦並び配置に変更

#### 3.2 Live2D表示エリア
- **背景色**: #2a2a2a（ダークグレー）
- **キャンバス**: 360x540px、枠線と角丸スタイル
- **ボタンエリア**: 表情制御ボタンを下部に配置
- **エラー表示**: Live2D読み込み失敗時のフォールバック表示

#### 2.1 レイアウト
- **コンテナ**: 中央配置、固定幅400px
- **ヘッダー**: "Gemini Chatbot" タイトル
- **チャット履歴エリア**: 最大高さ400px、スクロール対応
- **入力エリア**: 下部固定、テキスト入力+送信ボタン+音声制御ボタン

#### 2.2 音声機能
- **音声ON/OFFボタン**: 🔊/🔇 アイコンで音声合成の有効/無効切り替え
- **音声停止ボタン**: ⏸️ アイコンで現在の読み上げを即座に停止
- **音声エンジン切り替えボタン**: 🎵 ボタンで音声エンジンを循環切り替え
- **対応音声エンジン**:
  1. **Web Speech API** (🎵Web): ブラウザ内蔵、無料、即座に利用可能
  2. **Google Cloud TTS** (🎵GCP): 高品質、クラウドベース、API利用料金あり
  3. **AivisSpeech Engine** (🎵Aivis): 最高品質日本語音声、ローカル実行、無料
- **自動読み上げ**: ボットの応答メッセージを選択した音声エンジンで自動読み上げ
- **音声設定**: 
  - **Web Speech API**:
    - 言語: 日本語 (ja-JP)
    - 読み上げ速度: 0.9倍速
    - 音の高さ: 1.2倍
    - 音量: 80%
  - **Google Cloud TTS**:
    - 言語: ja-JP
    - 声質: ja-JP-Neural2-B (女性)
    - エンコーディング: MP3
    - 音量: 80%
  - **AivisSpeech Engine**:
    - スピーカー: 1310138976 (阿井田 茂 ノーマル)
    - サンプリングレート: 44.1kHz
    - エンコーディング: WAV
    - 音量: 80%
- **デフォルト音声エンジン**: AivisSpeech Engine（起動時に自動選択）
- **自動フォールバック**: 
  - 起動時: AivisSpeech Engine未起動の場合、自動でWeb Speech APIに設定
  - 実行時: 選択したエンジンでエラーが発生した場合、自動的にWeb Speech APIにフォールバック
- **自動再生ポリシー対応**: ブラウザの自動再生制限に対応、ユーザーアクション後の再生試行

#### 3.3 YouTubeライブチャット設定パネル（NEW）
- **折りたたみ式UI**: 設定ヘッダークリックで展開/折りたたみ
- **YouTube API Key入力**: パスワード形式での安全な入力
- **配信ID入力**: 動画IDまたはYouTube URL（自動解析対応）
- **チェック間隔設定**: 5-60秒の範囲でスライダー調整
- **接続制御ボタン**: 
  - 🔗 チャット監視開始ボタン
  - ⏹️ 監視停止ボタン
- **状態表示**: リアルタイム接続状況
  - 未接続（グレー）
  - 接続中...（黄色、アニメーション）
  - 監視中（緑色、パルスアニメーション）
  - エラー（赤色）
- **設定保存**: LocalStorageによる設定値の永続化
- **YouTubeメッセージスタイル**: 
  - 🎥アイコン付き
  - 赤グラデーション背景
  - YouTube専用タグ表示

#### 2.2 スタイル
- **背景色**: #1E0E07（ダークブラウン）
- **コンテナ**: 白背景、角丸、シャドウ
- **メッセージ**: 角丸バブル、左右寄せ
- **送信ボタン**: 青色（#007bff）、ホバー効果
- **音声ボタン**: 緑色（#28a745）、黄色（#ffc107）

#### 2.3 レスポンシブ対応
- **最大幅**: 90%（モバイル対応）
- **フォント**: Arial, sans-serif
- **サイズ調整**: viewport meta tag設定済み

---

## API仕様

### 1. バックエンドAPI（localhost:3001）

#### 認証API

##### POST /api/auth/login
管理者認証

**リクエストボディ**
```json
{
  "username": "admin",
  "password": "chloe2025"
}
```

**レスポンス（成功）**
```json
{
  "success": true,
  "message": "ログインに成功しました",
  "user": "admin"
}
```

##### GET /api/auth/status
認証状態確認

**レスポンス**
```json
{
  "isAuthenticated": true,
  "user": "admin"
}
```

#### YouTube監視API

##### GET /api/youtube/status
監視状況取得

**レスポンス**
```json
{
  "isMonitoring": true,
  "liveChatId": "Cg0KC2NIZjNZcnF3eWpv...",
  "configLoaded": true,
  "processedMessagesCount": 42
}
```

##### POST /api/youtube/start
監視開始（認証必須）

**レスポンス**
```json
{
  "success": true,
  "message": "YouTube監視を開始しました",
  "videoId": "dQw4w9WgXcQ",
  "liveChatId": "Cg0KC2NIZjNZcnF3eWpv...",
  "interval": 10
}
```

##### GET /api/youtube/frontend/messages
フロントエンド用メッセージ取得

**レスポンス**
```json
{
  "messages": [
    {
      "id": "msg123",
      "author": "視聴者名",
      "text": "こんにちは！",
      "timestamp": "2025-06-11T12:34:56Z",
      "type": "youtube_chat"
    }
  ],
  "isMonitoring": true,
  "liveChatId": "Cg0KC2NIZjNZcnF3eWpv...",
  "timestamp": "2025-06-11T12:34:56Z"
}
```

##### POST /api/youtube/test-video
動画接続テスト（認証必須）

**リクエストボディ**
```json
{
  "youtubeApiKey": "AIzaSy...",
  "videoId": "dQw4w9WgXcQ"
}
```

**レスポンス（成功）**
```json
{
  "success": true,
  "message": "ライブ配信への接続に成功しました",
  "videoInfo": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Live Stream Title",
    "liveChatId": "Cg0KC2NIZjNZcnF3eWpv...",
    "isLive": true,
    "channelTitle": "チャンネル名"
  },
  "quotaUsed": "videos.list: 1ユニット"
}
```

#### 設定管理API