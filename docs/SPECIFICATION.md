# Gemini Chatbot with Live2D - 技術仕様書

## 概要

本アプリケーションは、Google Cloud Run上にデプロイされたサーバーを経由してGemini APIと連携し、Live2Dキャラクター（Natori）が応答するWebチャットボットです。

### バージョン情報
- **アプリケーション名**: Gemini Chatbot with Live2D (Natori Edition)
- **バージョン**: 2.3.0
- **作成日**: 2025年6月2日
- **最終更新**: 2025年6月10日（YouTubeライブチャット連携機能追加）
- **動作確認済み**: 2025年6月10日（YouTubeライブチャット機能の実動作テスト成功）

---

## システム構成

### アーキテクチャ概要
```
[フロントエンド] ←→ [Cloud Run Proxy] ←→ [Google Gemini API]
       ↓                                    ↑
[Live2D Character (Natori)]                 │
       ↓                                    │
[Voice Synthesis Engine]                    │
       ↑                                    │
[YouTube Live Chat API] ────────────────────┘
```

### 技術スタック
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **バックエンド**: Google Cloud Run (Proxy Server)
- **AI API**: Google Gemini API
- **外部API連携**: YouTube Data API v3 (Live Chat)
- **Live2D**: 
  - PIXI.js v7.2.4 (WebGL Renderer)
  - pixi-live2d-display (Cubism 4 Support)
  - Live2D Cubism Web SDK v5-r.4
- **音声合成**: 
  - Web Speech API (SpeechSynthesis) - ブラウザ内蔵
  - Google Cloud Text-to-Speech API - クラウドベース高品質音声
  - AivisSpeech Engine - ローカル高品質日本語音声合成
- **通信**: Fetch API, JSON

---

## ファイル構成

```
chatbot_sage/
├── emotion-analyzer-v2.js     # 感情分析エンジン（v2 - 音声終了連動対応）
├── index.html              # メインHTMLファイル
├── style.css               # アプリケーションスタイル
├── script.js               # メインアプリケーションロジック
├── live2d-pixi.js          # Live2D PIXI統合コントローラー（本番実装）
├── youtube-chat-integration.js # YouTubeライブチャット統合モジュール（NEW）
├── models/                 # Live2Dモデル格納フォルダ
│   └── natori/             # Natoriキャラクターモデル
│       ├── natori_pro_exp_t03.can3         # 表情アニメーション
│       ├── natori_pro_motions_t03.can3     # モーションアニメーション
│       ├── natori_pro_t06.cmo3             # モデルファイル
│       ├── ReadMe.txt                      # モデル情報
│       └── runtime/                        # Live2Dランタイムファイル
│           ├── natori_pro_t06.model3.json  # モデル定義
│           ├── natori_pro_t06.moc3         # モデルデータ
│           ├── natori_pro_t06.physics3.json # 物理演算
│           ├── natori_pro_t06.cdi3.json    # キューイングデータ
│           ├── natori.pose3.json           # ポーズデータ
│           ├── exp/                        # 表情データ
│           │   ├── Normal.exp3.json        # 通常表情
│           │   ├── Smile.exp3.json         # 笑顔表情
│           │   ├── Surprised.exp3.json     # 驚き表情
│           │   ├── Sad.exp3.json           # 悲しい表情
│           │   ├── Angry.exp3.json         # 怒り表情
│           │   └── Blushing.exp3.json      # 照れ表情
│           ├── motions/                    # モーションデータ
│           │   ├── mtn_00.motion3.json     # 基本モーション
│           │   ├── mtn_01.motion3.json     # アイドルモーション
│           │   └── mtn_0[2-7].motion3.json # その他モーション
│           └── natori_pro_t06.4096/        # テクスチャフォルダ
│               └── texture_00.png          # キャラクターテクスチャ
├── libs/                   # ライブラリファイル
│   └── cubism4.min.js      # PIXI Live2D Display ライブラリ
├── SDK/                    # Live2D Cubism SDK
│   └── CubismSdkForWeb-5-r.4/             # Cubism SDK v5
├── docs/                   # ドキュメント
│   ├── SPECIFICATION.md    # 本仕様書
│   └── GOOGLE_TTS_SETUP.md # Google TTS セットアップガイド
├── .git/                   # Gitリポジトリ
└── .github/                # GitHub設定
```

---

## 機能仕様

### 1. チャット機能

#### 1.1 基本チャット
- **入力方式**: テキスト入力フィールド（1行）
- **送信方法**: 
  - 送信ボタンクリック
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

### Cloud Run エンドポイント

#### URL
```
https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app
```

#### POST リクエスト
チャットメッセージの送信と応答取得

**リクエストヘッダー**
```
Content-Type: application/json
```

**リクエストボディ**
```json
{
  "userMessage": "ユーザーの入力メッセージ",
  "chatHistory": [
    {"role": "user", "text": "過去のユーザーメッセージ"},
    {"role": "model", "text": "過去のボット応答"}
  ]
}
```

**レスポンス（成功）**
```json
{
  "reply": "AIからの応答メッセージ"
}
```

**レスポンス（エラー）**
```json
{
  "error": {
    "details": "詳細なエラーメッセージ"
  }
}
```

### Google Cloud Text-to-Speech API

#### URL
```
https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app/tts
```

#### POST リクエスト
テキストの音声合成

**リクエストボディ**
```json
{
  "text": "合成するテキスト",
  "languageCode": "ja-JP",
  "voiceName": "ja-JP-Neural2-B",
  "audioEncoding": "MP3"
}
```

### YouTube Data API v3（NEW）

#### 動画情報取得エンドポイント
```
https://www.googleapis.com/youtube/v3/videos
```

**パラメータ**
- `part`: liveStreamingDetails
- `id`: 動画ID
- `key`: YouTube Data API v3 キー

**レスポンス例**
```json
{
  "items": [
    {
      "liveStreamingDetails": {
        "activeLiveChatId": "Live_Chat_ID_Here"
      }
    }
  ]
}
```

#### ライブチャット取得エンドポイント
```
https://www.googleapis.com/youtube/v3/liveChat/messages
```

**パラメータ**
- `part`: snippet
- `liveChatId`: ライブチャットID
- `key`: YouTube Data API v3 キー

**レスポンス例**
```json
{
  "items": [
    {
      "id": "message_id",
      "snippet": {
        "displayMessage": "チャットメッセージ内容",
        "authorDisplayName": "ユーザー名"
      }
    }
  ]
}
```

**レスポンス**
```json
{
  "audioContent": "base64エンコードされた音声データ"
}
```

### AivisSpeech Engine API

#### ベースURL
```
http://127.0.0.1:10101
```

#### GET /version
エンジンのバージョン情報とヘルスチェック

**レスポンス**
```json
{
  "version": "1.1.0-dev"
}
```

#### POST /audio_query
音声合成用クエリの作成

**パラメータ**
- `text`: 合成するテキスト（URLエンコード済み）
- `speaker`: スピーカーID（例: 1310138976）

**リクエスト例**
```
POST /audio_query?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&speaker=1310138976
```

**レスポンス**
```json
{
  "accent_phrases": [...],
  "speedScale": 1.0,
  "intonationScale": 1.0,
  "outputSamplingRate": 44100,
  ...
}
```

#### POST /synthesis
音声ファイルの生成

**パラメータ**
- `speaker`: スピーカーID

**リクエストボディ**
```json
{
  "accent_phrases": [...],
  "speedScale": 1.0,
  ...
}
```

**レスポンス**: WAVファイル（audio/wav）

---

## 状態管理

### グローバル変数

#### DOM要素参照
```javascript
const chatHistoryDiv = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceToggle = document.getElementById('voice-toggle');
const stopSpeechButton = document.getElementById('stop-speech');
const voiceEngineToggle = document.getElementById('voice-engine-toggle');
```

#### アプリケーション状態
```javascript
const CLOUD_FUNCTION_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app";
const TTS_API_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app/tts";
const AIVIS_API_URL = "http://127.0.0.1:10101";

let chatMessages = [];              // チャット履歴配列
let isSpeechEnabled = true;         // 音声合成有効フラグ
let voiceEngine = 'aivis';          // 音声エンジン: 'webspeech' | 'google-tts' | 'aivis' (デフォルト: Aivis Speech)
let currentSpeechSynthesis = null;  // 現在のWeb Speech APIオブジェクト
let currentAudio = null;            // 現在のAudioオブジェクト（GCP TTS/AivisSpeech用）
```

### データ構造

#### チャットメッセージ
```javascript
{
  role: "user" | "model",  // メッセージの送信者
  text: string             // メッセージ内容
}
```

---

## 関数仕様

### appendMessage(sender, text)
チャット履歴にメッセージを表示

**パラメータ**
- `sender`: "user" | "bot" - メッセージ送信者
- `text`: string - 表示するメッセージ

**動作**
1. div要素を作成
2. 適切なCSSクラスを付与
3. チャット履歴エリアに追加
4. 自動スクロール

### sendMessageToCloudFunction(message)
Cloud Run経由でGemini APIにリクエスト送信

**パラメータ**
- `message`: string - ユーザーの入力メッセージ

**動作フロー**
1. ユーザーメッセージを即座に表示
2. "思考中..." ローディング表示
3. 送信ボタンを無効化
4. 履歴配列に追加
5. fetch APIでリクエスト送信
6. 応答受信後、ローディング削除
7. ボット応答を表示・履歴追加
8. **選択した音声エンジンで音声読み上げ実行**
9. 送信ボタン有効化・入力欄クリア

### speakText(text)
選択された音声エンジンでテキストを音声合成

**パラメータ**
- `text`: string - 読み上げるテキスト

**動作**
1. 音声が無効の場合は早期リターン
2. 絵文字を除去（removeEmojis関数使用）
3. 選択されたvoiceEngineに応じて適切な関数を呼び出し
   - 'webspeech': speakTextWithWebSpeech()
   - 'google-tts': speakTextWithGoogleTTS()
   - 'aivis': speakTextWithAivisSpeech()

### speakTextWithWebSpeech(text)
Web Speech APIを使用した音声合成

**パラメータ**
- `text`: string - 読み上げるテキスト

**動作**
1. Web Speech API対応チェック
2. 現在の音声を停止
3. SpeechSynthesisUtteranceオブジェクト作成
4. 日本語音声設定（言語、速度、音程、音量）
5. 音声読み上げ開始
6. イベントリスナー設定（start、end、error）

### speakTextWithGoogleTTS(text)
Google Cloud Text-to-Speech APIを使用した音声合成

### YouTubeLiveChatIntegration Class（NEW）
YouTubeライブチャット統合を管理するクラス

#### constructor()
**初期化処理**
- 各種設定変数の初期化
- DOM要素の取得
- イベントリスナーの設定
- 保存済み設定の読み込み

#### startMonitoring()
ライブチャット監視を開始

**動作フロー**
1. 入力値の検証（API Key、動画ID）
2. 動画IDの正規化（URL解析）
3. ライブチャットIDの取得
4. 監視ループの開始
5. UI状態の更新

#### stopMonitoring()
ライブチャット監視を停止

**動作**
1. 監視フラグをfalseに設定
2. タイムアウトをクリア
3. UI状態をリセット

#### fetchLiveChatMessages()
YouTube APIからライブチャットメッセージを取得

**戻り値**: Promise&lt;Array&gt; - チャットメッセージ配列

**動作**
1. ライブチャットAPI呼び出し
2. エラーハンドリング
3. メッセージ配列の返却

#### pickBestChatMessage(messages)
取得したメッセージから最適なものを選択

**パラメータ**
- `messages`: Array - 取得したメッセージ配列

**戻り値**: Promise&lt;string|null&gt; - 選択されたメッセージ

**動作フロー**
1. 期限切れメッセージのクリーンアップ
2. 未処理メッセージのフィルタリング
3. OpenAI APIでの最適選択（フォールバック: ランダム選択）
4. 選択結果の返却

#### addMessageToChat(message, className)
YouTubeメッセージをチャット履歴に追加

**パラメータ**
- `message`: string - 表示するメッセージ
- `className`: string - CSSクラス名

**動作**
1. メッセージ要素の作成
2. YouTube専用スタイルの適用
3. チャット履歴への追加
4. 自動スクロール

### sendMessageToChatbot(message, addToHistory)（NEW）
YouTube統合用のチャットボット連携関数

**パラメータ**
- `message`: string - 送信するメッセージ
- `addToHistory`: boolean - 履歴に追加するかどうか

**動作**
1. sendMessageToCloudFunction()の呼び出し
2. 重複防止制御

**パラメータ**
- `text`: string - 読み上げるテキスト

**動作**
1. TTS_API_URLにPOSTリクエスト送信
2. 日本語女性音声（ja-JP-Neural2-B）でMP3生成
3. Base64音声データをBlobに変換
4. Audioオブジェクトで再生
5. エラー時はWeb Speech APIにフォールバック

### speakTextWithAivisSpeech(text)
AivisSpeech Engineを使用した音声合成

**パラメータ**
- `text`: string - 読み上げるテキスト

**動作**
1. `/audio_query` APIで音声クエリ作成
   - スピーカーID: 1310138976 (阿井田 茂 ノーマル)
   - クエリパラメータ形式でリクエスト
2. `/synthesis` APIでWAVファイル生成
   - 音声クエリをJSONボディで送信
3. 生成されたWAVデータをBlobに変換
4. Audioオブジェクトで再生
5. 自動再生ポリシー対応（ユーザーアクション後の再試行）
6. エラー時はWeb Speech APIにフォールバック

### checkAivisSpeechEngine()
AivisSpeech Engineの起動状況確認

**戻り値**
- `boolean`: エンジンが起動していればtrue

**動作**
1. `/version` エンドポイントにGETリクエスト
2. 3秒タイムアウト設定
3. 正常応答でtrue、エラーでfalseを返す

### updateVoiceEngineDisplay()
音声エンジン表示の更新

**動作**
1. voiceEngine変数の値を確認
2. 対応するアイコンテキストと説明を設定
3. ボタンの表示テキストとツールチップを更新

### initializeVoiceEngine()
起動時の音声エンジン自動選択と初期化

**動作**
1. デフォルトのAivisSpeech Engineの起動状況を確認
2. 利用可能な場合: voiceEngineを'aivis'に設定
3. 利用不可の場合: Web Speech API対応チェック後'webspeech'に自動フォールバック
4. Web Speech API非対応の場合: 'google-tts'に設定
5. 最終設定を表示に反映

### stopSpeech()
全音声エンジンの再生停止

**動作**
1. Web Speech API: speechSynthesis.cancel()
2. Audio要素: pause()とnull代入
3. 現在再生中の音声をすべて停止

### removeEmojis(text)
テキストから絵文字を除去

**パラメータ**
- `text`: string - 処理対象テキスト

**戻り値**
- `string`: 絵文字を除去したテキスト

**動作**
1. Unicode絵文字ブロックの正規表現で除去
2. トリム処理を実行

---

## Live2D関数仕様

### initializeLive2D()
Live2Dシステムの初期化

**動作**
1. PIXI.jsアプリケーションの作成（360x540px、WebGL）
2. Live2Dコンテナエリアにキャンバス追加
3. Natoriモデル（`models/natori/runtime/natori_pro_t06.model3.json`）の読み込み
4. モデルスケール（0.15）と位置調整
5. 表情制御ボタンのイベントリスナー設定
6. エラー時のフォールバック表示

### setExpression(expressionName)
Live2Dキャラクターの表情変更

**パラメータ**
- `expressionName`: string - 表情名（'Normal'|'Smile'|'Surprised'|'Sad'|'Angry'）

**動作**
1. Live2Dモデルの表情パラメータ変更
2. 現在の表情状態の更新
3. 表情ボタンのハイライト更新
4. エラーハンドリングとログ出力

### setupExpressionButtons()
表情制御ボタンの初期化

**動作**
1. 5つの表情ボタンにクリックイベント設定
   - 😊 → 'Smile'
   - 😮 → 'Surprised' 
   - 😢 → 'Sad'
   - 😠 → 'Angry'
   - 😐 → 'Normal'
2. 初期ハイライト表示

### updateExpressionButtons()
表情ボタンの視覚的状態更新

**動作**
1. 全ボタンのスタイルリセット
2. 現在アクティブな表情ボタンのハイライト表示
3. ボタンスケール変更（1.1倍）とカラー変更

### startLipSync()
リップシンクアニメーション開始

**動作**
1. 口パラメータの動的制御開始
2. アニメーションループの開始
3. リップシンク状態フラグの更新

### stopLipSync()
リップシンクアニメーション停止

**動作**
1. 口パラメータをデフォルト値に復帰
2. アニメーションループの停止
3. リップシンク状態フラグのリセット

### onSpeechStart()
音声再生開始時のLive2D連携処理

**動作**
1. 現在が'Normal'表情の場合、'Smile'に変更
2. リップシンクアニメーション開始
3. ログ出力

### onSpeechEnd()
音声再生終了時のLive2D連携処理

**動作**
1. リップシンクアニメーション停止
2. 1.5秒後に'Normal'表情に復帰
3. ログ出力

### Live2DController (グローバルオブジェクト)
Live2D機能のグローバルインターフェース

**メソッド**
- `setExpression(name)`: 表情変更
- `startLipSync()`: リップシンク開始
- `stopLipSync()`: リップシンク停止
- `onSpeechStart()`: 音声開始イベント
- `onSpeechEnd()`: 音声終了イベント
- `isAvailable()`: Live2D利用可能状況取得

---

## エラーハンドリング

### エラー分類

#### 1. ネットワークエラー
- **原因**: インターネット接続不良、サーバーダウン
- **表示**: "エラーが発生しました。もう一度お試しください。"
- **ログ**: コンソールに詳細エラー出力

#### 2. HTTPエラー
- **原因**: Cloud Run サーバーエラー、認証エラー
- **表示**: "エラーが発生しました。もう一度お試しください。"
- **ログ**: ステータスコード、エラー詳細

#### 3. API エラー
- **原因**: Gemini API エラー、レート制限
- **表示**: "エラーが発生しました。もう一度お試しください。"
- **ログ**: API エラー詳細

#### 4. 音声合成エラー
- **Web Speech API エラー**:
  - 原因: ブラウザ非対応、音声データの問題
  - 表示: コンソール警告
  - ログ: 音声エラー詳細
- **Google Cloud TTS エラー**:
  - 原因: API認証エラー、ネットワーク問題、クォータ超過
  - 表示: コンソールエラー
  - フォールバック: Web Speech APIに自動切り替え
- **AivisSpeech Engine エラー**:
  - 原因: エンジン未起動、ポート接続問題、APIリクエスト形式エラー
  - 表示: 詳細なデバッグログとエラーメッセージ
  - フォールバック: Web Speech APIに自動切り替え
- **自動再生ポリシーエラー**:
  - 原因: ブラウザの自動再生制限
  - 対処: ユーザーアクション後の再生試行、アラート表示

#### 5. Live2Dエラー
- **モデル読み込みエラー**:
  - 原因: モデルファイル不足、パス誤り、ネットワーク問題
  - 表示: フォールバックキャラクター表示
  - ログ: 詳細なファイルパスとエラー情報
- **WebGLエラー**:
  - 原因: ブラウザWebGL非対応、GPU問題、メモリ不足
  - 表示: "Live2D表示には対応ブラウザが必要です"
  - フォールバック: 静的キャラクター画像表示
- **PIXI.jsエラー**:
  - 原因: ライブラリ読み込み失敗、初期化問題
  - 表示: エラーメッセージとフォールバック表示
  - ログ: PIXI関連エラーの詳細
- **表情変更エラー**:
  - 原因: 表情ファイル不足、パラメータ設定問題
  - 表示: コンソール警告
  - フォールバック: 通常表情に復帰

### エラー処理の流れ
1. try-catch でエラーキャッチ
2. ローディング表示の削除
3. エラーメッセージの表示
4. コンソールログ出力
5. UI状態の復元（ボタン有効化等）

---

## UI/UX仕様

### レスポンス時間
- **メッセージ表示**: 即座（<50ms）
- **API応答**: Cloud Run + Gemini API に依存（通常1-5秒）
- **UI操作**: 即座（<100ms）

### ユーザビリティ
- **入力**: Enter キーでメッセージ送信
- **視覚的フィードバック**: 
  - ローディング中のメッセージ表示
  - 送信ボタンの無効化
  - ホバー効果
- **自動スクロール**: 新メッセージ表示時

### アクセシビリティ
- **フォーカス管理**: 入力フィールドのフォーカススタイル
- **キーボード操作**: Enter キー送信対応
- **カラーコントラスト**: 十分なコントラスト比

---

## パフォーマンス仕様

### クライアント側
- **初期読み込み**: <3秒（Live2Dモデル含む）
- **メモリ使用量**: <50MB（Live2Dモデル+テクスチャ含む）
- **DOM操作**: 効率的な要素追加のみ

### Live2D パフォーマンス
- **レンダリング**: WebGL、60fps、ハードウェアアクセラレーション
- **モデルサイズ**: 1600x2800px（元サイズ）→ 360x540px（表示サイズ）
- **スケール**: 0.15倍でメモリ効率化
- **フレームレート**: 安定60fps（PIXI.js Application）
- **GPU使用**: WebGL 1.0以上対応ブラウザで自動GPU使用

### 通信
- **リクエストサイズ**: メッセージ長に依存（通常<1KB）
- **レスポンスサイズ**: 応答長に依存（通常<5KB）
- **同時リクエスト**: 1つのみ（送信ボタン無効化で制御）

### 対応ブラウザ
- **Chrome**: 60+ (Web Speech API フルサポート、WebGL対応)
- **Firefox**: 60+ (Web Speech API 限定サポート、WebGL対応)
- **Safari**: 12+ (Web Speech API サポート、WebGL対応)
- **Edge**: 79+ (Web Speech API フルサポート、WebGL対応)
- **モバイル**: iOS Safari 12+, Chrome Mobile 60+
- **音声合成**: Web Speech API対応ブラウザのみ
- **Live2D**: WebGL 1.0以上対応ブラウザ（大部分のモダンブラウザ）

---

## セキュリティ仕様

### データ保護
- **API キー**: Cloud Run側で管理、フロントエンドに露出なし
- **通信**: HTTPS必須
- **入力サニタイズ**: textContent使用でXSS対策

### プライバシー
- **会話データ**: ローカル保存のみ（ページリロードで消去）
- **個人情報**: 収集なし
- **Cookie**: 使用なし

### セキュリティ対策
- **CORS**: Cloud Run側で適切に設定
- **CSP**: 基本的なContent Security Policy
- **HTTPSのみ**: HTTP通信の禁止

---

## 開発・デプロイメント

### 開発環境
- **要件**: モダンWebブラウザ、テキストエディタ
- **サーバー**: 静的ファイルサーバー（開発時）
- **デバッグ**: ブラウザ開発者ツール

### 本番環境
- **ホスティング**: 静的Webサイトホスティング
- **要件**: HTTPS対応
- **設定**: Cloud Run URLの設定が必要

### 設定項目
```javascript
const CLOUD_FUNCTION_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app";
```

---

## 制限事項・既知の問題

### 現在の制限
1. **チャット履歴**: ページリロードで消去
2. **マルチユーザー**: 非対応
3. **ファイルアップロード**: 非対応
4. **音声入力**: 非対応（音声出力のみ実装済み）
5. **AivisSpeech Engine**: ローカル起動が必要（ポート10101）
6. **Google Cloud TTS**: API利用料金発生、ネットワーク必須
7. **音声エンジン設定**: UIでの詳細設定変更不可（コード内固定）
8. **Live2D高度機能**: マウストラッキング、自動まばたき、アイドルモーション未実装
9. **YouTube Data API**: 利用制限あり（1日10,000リクエスト）
10. **YouTubeライブ配信**: アクティブなライブ配信のみ対応
11. **チャット選択**: 簡易ランダム選択（高度なAI選択は要OpenAI API）

### 既知の問題
1. **長時間使用**: メモリリーク可能性（履歴蓄積）
2. **大量履歴**: パフォーマンス低下可能性
3. **ネットワーク**: オフライン対応なし（AivisSpeech除く）
4. **音声重複**: 同時複数読み上げの制御（対策済み）
5. **音声品質**: ブラウザ・エンジンによる音声の違い
6. **AivisSpeech依存**: ローカルエンジンの起動状態に依存
7. **自動再生制限**: ブラウザポリシーによる初回再生制限
8. **YouTube API制限**: レート制限によるアクセス制限（403エラー）
9. **ライブチャット遅延**: YouTube側の配信遅延（通常10-30秒）
10. **重複メッセージ**: 同一メッセージの再処理防止機能の限界

---

## 今後の拡張計画

### Phase 1: UI改善
- [ ] チャット履歴の永続化（LocalStorage）
- [ ] タイムスタンプ表示
- [ ] メッセージの削除機能
- [ ] テーマ切り替え機能

### Phase 2: 機能拡張
- [x] Live2Dキャラクター表示（完了）
- [x] Live2D表情制御（完了）
- [x] Live2D音声連携アニメーション（完了）
- [x] YouTubeライブチャット連携（完了）
- [ ] Live2D高度機能（マウストラッキング、自動まばたき、アイドルモーション）
- [ ] 音声入力対応（音声認識）
- [ ] 音声設定カスタマイズUI（速度、音程、音量、スピーカー選択）
- [ ] AivisSpeech複数スピーカー対応（ずんだもん等）
- [ ] ファイルアップロード機能
- [x] マルチ音声エンジン対応（完了）
- [ ] 音声品質設定（サンプリングレート等）
- [ ] マークダウン対応
- [ ] YouTube Superチャット対応
- [ ] YouTube メンバーシップ限定チャット対応
- [ ] OpenAI統合によるスマートチャット選択

### Phase 3: 高度な機能
- [ ] マルチキャラクター対応（複数Live2Dモデル）
- [ ] AIペルソナ切り替え
- [ ] プラグインシステム
- [ ] 分析・統計機能
- [ ] Live2D物理演算拡張
- [ ] カスタムモーション対応

---

## トラブルシューティング

### よくある問題

#### Q1: メッセージが送信されない
**症状**: 送信ボタンが効かない、エラーメッセージ
**原因**: 
- Cloud Run URLの設定ミス
- ネットワーク接続問題
- Cloud Run サーバーの問題

**対処法**:
1. ブラウザのコンソールでエラー確認
2. Cloud Run URLの確認
3. ネットワーク接続の確認

#### Q2: 応答が遅い・返ってこない
**症状**: "思考中..."が長時間表示
**原因**:
- Gemini API の高負荷
- Cloud Run インスタンスのコールドスタート
- 入力メッセージが長すぎる

**対処法**:
1. しばらく待機
2. ページリロード
3. 短いメッセージで再試行

#### Q4: 音声が再生されない
**症状**: ボットの応答に音声がない、音声ボタンが表示されない
**原因と対処法**:

**共通**:
1. 🔊ボタンで音声ON確認
2. システム音量・ミュート確認
3. ブラウザの音量設定確認

**Web Speech API (🎵Web)**:
1. ブラウザの対応状況確認（Chrome推奨）
2. 日本語音声の利用可能性確認
3. マイクロソフトエッジの場合、日本語音声パックのインストール

**Google Cloud TTS (🎵GCP)**:
1. ネットワーク接続確認
2. Cloud Run サーバーの動作確認
3. API認証・クォータ確認
4. 開発者ツールのNetworkタブでHTTPエラー確認

**AivisSpeech Engine (🎵Aivis)**:
1. AivisSpeech Engineの起動確認 (http://127.0.0.1:10101)
2. ポート10101の使用可能性確認
3. 開発者ツールのConsoleでデバッグログ確認
4. CORSエラーの確認

#### Q5: AivisSpeech Engineが動作しない
**症状**: 🎵Aivis選択時に音声が再生されない、エラーログが出力される
**原因と対処法**:
1. **エンジン未起動**: AivisSpeech Engineを起動してください
2. **ポート競合**: 他のアプリケーションがポート10101を使用していないか確認
3. **URLエンコーディング**: 日本語テキストの正しいエンコーディング（自動処理済み）
4. **APIリクエスト形式**: audio_queryとsynthesisの2段階リクエスト（実装済み）
5. **スピーカーID**: 正しいスピーカーID (1310138976) の使用（設定済み）

#### Q6: 音声エンジンが切り替わらない
**症状**: 🎵ボタンをクリックしても音声エンジンが変わらない
**原因と対処法**:
1. **AivisSpeech Engine接続確認**: エンジンが起動していない場合は選択できません
2. **ブラウザ再読み込み**: ページを再読み込みして初期化
3. **JavaScript エラー**: 開発者ツールのConsoleでエラー確認

#### Q7: 音声が2回再生される
**症状**: 同じメッセージが重複して読み上げられる
**原因**: speakText()関数の重複呼び出し
**対処法**: コードの重複チェック、修正済み

#### Q8: 文字化けが発生
**症状**: 日本語が正しく表示されない
**原因**: 文字エンコーディング設定
**対処法**: HTMLのmeta charset="UTF-8"確認

#### Q9: 自動再生がブロックされる
**症状**: 「音声再生にはクリックが必要です」のアラートが表示される
**原因**: ブラウザの自動再生ポリシー
**対処法**: 
1. アラートの「OK」をクリック
2. ページ内で一度クリックしてからメッセージ送信
3. ブラウザの自動再生設定を許可に変更

#### Q10: YouTubeライブチャットが取得できない（NEW）
**症状**: 「API Keyが無効」「動画が見つかりません」エラーが発生
**原因と対処法**:
1. **API Key確認**: YouTube Data API v3の有効なキーが設定されているか確認
2. **配信状態確認**: 指定した動画が現在ライブ配信中かつチャットが有効か確認
3. **動画ID確認**: 正しい動画IDまたはYouTube URLが入力されているか確認
4. **APIクォータ**: YouTube Data APIの日次制限（10,000リクエスト）を超えていないか確認

#### Q11: YouTubeチャットに応答しない（NEW）
**症状**: チャットは取得できるが、Natoriが応答しない
**原因と対処法**:
1. **重複メッセージ確認**: 同一メッセージは5分間処理されません
2. **Gemini API確認**: Cloud Runサーバーとの接続を確認
3. **JavaScript エラー**: 開発者ツールでコンソールエラーを確認
4. **チャット間隔調整**: 短すぎる間隔（5秒未満）は避けてください

#### Q12: YouTube監視が自動停止する（NEW）
**症状**: しばらくすると監視が停止してしまう
**原因と対処法**:
1. **配信終了**: ライブ配信が終了した場合は自動停止します
2. **ネットワークエラー**: インターネット接続を確認してください
3. **API制限**: YouTube APIの制限に達している可能性があります
4. **ブラウザタブ**: タブを切り替えても監視は継続しますが、ブラウザを閉じると停止します

---

## 更新履歴

### Version 2.1.0 (2025-06-07)
- **📂 ワークスペース整理**: 開発時の一時ファイルとテスト実装の削除
  - 未使用Live2D実装ファイル削除（live2d-app.js, live2d-cubism.js, live2d-simple.js, live2d.js）
  - 参考実装フォルダ削除（reference/）
  - システムファイル削除（.DS_Store）
  - 不要なnpmファイル削除（SDK/package-lock.json）
- **🎯 コード最適化**: 本番実装（live2d-pixi.js）のみに集約
- **📋 ドキュメント更新**: SPECIFICATION.mdのファイル構成を実際の構造に完全同期

### Version 2.0.0 (2025-06-07)
- **🎉 Live2Dキャラクター統合**: Natoriキャラクターモデルの完全実装
  - PIXI.js v7.2.4 + pixi-live2d-display による高性能レンダリング
  - Live2D Cubism 4.0 モデル対応
  - WebGL ハードウェアアクセラレーション
- **キャラクター表示最適化**: 
  - 顔と上半身の完璧な配置（360x540px エリア内）
  - スケール最適化（0.15倍）で大型モデル（1600x2800）に対応
  - アンカーポイント調整（顔基準配置）
  - Y軸オフセット調整でキャラクター中央配置
- **表情制御システム**: 5つの表情をリアルタイム切り替え
  - 😊 笑顔、😮 驚き、😢 悲しみ、😠 怒り、😐 通常
  - Live2Dパラメータによるスムーズな表情変化
  - アクティブ表情のビジュアル表示
- **音声連携アニメーション**: 
  - 音声再生時の自動リップシンク（口の開閉）
  - 話し始めの自動笑顔、話し終わり後の表情復帰
  - 全音声エンジン（Web Speech API、Google TTS、AivisSpeech）対応
- **レスポンシブUIレイアウト**: 
  - Live2Dエリア + チャットエリアのフレックスレイアウト
  - 1024px以下での自動縦並び切り替え
  - ダークテーマ統一デザイン
- **パフォーマンス最適化**: 
  - WebGL最適化設定（autoDensity無効、resolution固定）
  - メモリ効率的なモデル読み込み
  - エラーハンドリングとフォールバック表示

### Version 1.2.0 (2025-06-06)
- **マルチ音声エンジン対応**: Web Speech API、Google Cloud TTS、AivisSpeech Engine の3つの音声エンジンをサポート
- **AivisSpeech Engine統合**: 高品質日本語音声合成エンジンの完全統合
  - スピーカー: 阿井田 茂 (ID: 1310138976) ノーマル音声
  - 2段階API (audio_query → synthesis) による音声生成
  - WAVフォーマット、44.1kHz高品質音声
- **音声エンジン循環切り替え**: 🎵ボタンで3つのエンジンを順次切り替え
- **自動フォールバック機能**: エラー時にWeb Speech APIへの自動切り替え
- **自動再生ポリシー対応**: ブラウザの自動再生制限への対応とユーザーアクション後の再試行
- **詳細デバッグログ**: 音声エンジンの状態とAPIコールの詳細ログ
- **エラーハンドリング強化**: 各音声エンジン固有のエラー処理と詳細メッセージ
- **CORS対応**: AivisSpeech Engine のCROSヘッダー確認済み
- **絵文字除去機能**: 音声合成前の自動絵文字フィルタリング

### Version 1.1.0 (2025-06-03)
- **音声合成機能追加**: Web Speech API による自動読み上げ
- **音声制御UI追加**: 音声ON/OFF、音声停止ボタン
- **日本語音声対応**: 自動的に日本語音声を選択・設定
- **音声設定最適化**: 読み上げ速度、音程、音量の調整
- **エラーハンドリング強化**: 音声機能のエラー対応
- **ブラウザ対応情報更新**: Web Speech API 対応状況追記

### Version 1.0.0 (2025-06-02)
- 初回リリース
- 基本的なチャット機能実装
- Cloud Run 連携実装
- レスポンシブUI実装

---

## ライセンス・注意事項

### 使用API・サービス
- **Google Gemini API**: Google Cloud Platform利用規約に準拠
- **Google Cloud Run**: Google Cloud Platform利用規約に準拠

### 注意事項
- **API使用料**: 
  - Gemini API の利用料金に注意
  - Google Cloud TTS API の利用料金に注意
- **利用規約**: Google Cloud Platform 利用規約の遵守
- **レート制限**: API使用量制限の管理が必要
- **AivisSpeech Engine**: 
  - ローカルでの起動が必要
  - ポート10101の使用
  - 高品質音声のためのリソース消費

### ライセンス
- **本アプリケーション**: MIT License
- **依存関係**: 各ライブラリのライセンスに準拠

---

## 更新履歴

### Version 2.3.0 (2025-06-10) - YouTubeライブチャット連携
- **📺 YouTubeライブチャット統合**: YouTube Data API v3を使用したライブチャット自動監視機能
  - 自動チャット取得: 指定間隔でのライブチャットメッセージ取得
  - リアルタイム応答: 取得したコメントに対するNatoriの自動応答
  - 重複防止システム: 処理済みメッセージ管理とタイムアウト処理
- **YouTube設定パネル**: 折りたたみ式UI設計による直感的な設定管理
  - YouTube API Key入力（パスワード形式で安全管理）
  - 配信ID入力（YouTube URL自動解析対応）
  - チェック間隔設定（5-60秒の範囲）
  - 設定値のLocalStorage自動保存・復元
- **視覚的統合**: YouTubeメッセージ専用スタイリング
  - 🎥アイコン付きメッセージ表示
  - 赤グラデーション背景デザイン
  - YouTubeタグによる明確な視覚的区別
- **エラーハンドリング**: 包括的なエラー処理システム
  - API制限・認証エラーの適切な処理
  - 接続失敗時のフォールバック機能
  - ユーザーフレンドリーなエラーメッセージ
- **ファイル構成更新**: `youtube-chat-integration.js`モジュール追加
- **Live2D統合**: YouTubeコメントに対する感情表現とリップシンク対応

### Version 2.1.2 (2025-06-08)
- **デフォルト音声エンジン変更**: AivisSpeech Engineを標準設定に変更
  - 起動時デフォルト: WebSpeech → AivisSpeech Engine
  - 自動初期化機能: `initializeVoiceEngine()` 関数追加
  - 起動時フォールバック: Aivis未起動時は自動でWebSpeech APIに切り替え
- **音声エンジン初期化の自動化**: ユーザー操作不要でベスト音声エンジンを選択
- **エラーハンドリング強化**: 起動時の音声エンジン可用性チェック機能

### Version 2.1.1 (2025-06-07)
- **AivisSpeech Engine スピーカー修正**: 利用可能なスピーカーに変更
  - スピーカー変更: Anneli (ID: 888753760) → 阿井田 茂 (ID: 1310138976)
  - 音声品質テスト完了: WAVファイル生成・再生確認済み
  - ドキュメント更新: 全ての関連箇所のスピーカーID統一
- **音声エンジン安定性向上**: 実在スピーカーによる確実な音声合成
- **API仕様更新**: 正しいスピーカーID使用例の記載

### Version 2.1.0 (2025-06-07)

*このドキュメントは Gemini Chatbot with Live2D (Natori Edition) v2.3.0 の技術仕様を記載しています。*
*Live2D統合とYouTubeライブチャット連携により、リアルタイムキャラクターアニメーションと自動配信応答機能を提供します。*