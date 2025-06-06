# Gemini Chatbot - 技術仕様書

## 概要

本アプリケーションは、Google Cloud Run上にデプロイされたサーバーを経由してGemini APIと連携するシンプルなWebチャットボットです。

### バージョン情報
- **アプリケーション名**: Gemini Chatbot (Cloud Run Edition)
- **バージョン**: 1.2.0
- **作成日**: 2025年6月2日
- **最終更新**: 2025年6月6日

---

## システム構成

### アーキテクチャ概要
```
[フロントエンド] ←→ [Cloud Run Proxy] ←→ [Google Gemini API]
```

### 技術スタック
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **バックエンド**: Google Cloud Run (Proxy Server)
- **AI API**: Google Gemini API
- **音声合成**: 
  - Web Speech API (SpeechSynthesis) - ブラウザ内蔵
  - Google Cloud Text-to-Speech API - クラウドベース高品質音声
  - AivisSpeech Engine - ローカル高品質日本語音声合成
- **通信**: Fetch API, JSON

---

## ファイル構成

```
chatbot_sage/
├── index.html              # メインHTMLファイル
├── style.css               # アプリケーションスタイル
├── script.js               # メインアプリケーションロジック
├── models/                 # Live2Dモデル格納フォルダ（未実装）
│   └── natori/            # Live2Dモデルファイル
├── docs/                   # ドキュメント
│   └── SPECIFICATION.md    # 本仕様書
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
- **初期メッセージ**: "こんにちは！何か質問がありますか？"

#### 1.2 メッセージ処理
- **文字数制限**: フロントエンド側制限なし
- **テキスト表示**: プレーンテキスト
- **自動改行**: CSS word-wrap: break-word
- **履歴管理**: 配列でクライアント側保持

#### 1.3 応答機能
- **応答時間**: Cloud Run + Gemini API処理時間
- **ローディング表示**: "思考中..." メッセージ
- **音声読み上げ**: Web Speech API による自動音声合成
- **エラーハンドリング**: 
  - 接続エラー時の適切なエラーメッセージ
  - 送信ボタンの無効化/有効化

### 2. ユーザーインターフェース

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
    - スピーカー: 888753760 (Anneli ノーマル)
    - サンプリングレート: 44.1kHz
    - エンコーディング: WAV
    - 音量: 80%
- **自動フォールバック**: 選択したエンジンでエラーが発生した場合、自動的にWeb Speech APIにフォールバック
- **自動再生ポリシー対応**: ブラウザの自動再生制限に対応、ユーザーアクション後の再生試行

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
- `speaker`: スピーカーID（例: 888753760）

**リクエスト例**
```
POST /audio_query?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&speaker=888753760
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
let voiceEngine = 'webspeech';      // 音声エンジン: 'webspeech' | 'google-tts' | 'aivis'
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
   - スピーカーID: 888753760 (Anneli ノーマル)
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

**パラメータ**
- `text`: string - 読み上げるテキスト

**動作**
1. 音声有効フラグとAPI対応チェック
2. 現在の音声合成を停止
3. SpeechSynthesisUtterance作成
4. 日本語音声設定適用
5. 読み上げ開始

### stopSpeech()
現在の音声読み上げを停止

**動作**
1. speechSynthesis.cancel()実行
2. currentSpeechSynthesis変数クリア
3. コンソールログ出力

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
- **初期読み込み**: <1秒
- **メモリ使用量**: <10MB
- **DOM操作**: 効率的な要素追加のみ

### 通信
- **リクエストサイズ**: メッセージ長に依存（通常<1KB）
- **レスポンスサイズ**: 応答長に依存（通常<5KB）
- **同時リクエスト**: 1つのみ（送信ボタン無効化で制御）

### 対応ブラウザ
- **Chrome**: 60+ (Web Speech API フルサポート)
- **Firefox**: 60+ (Web Speech API 限定サポート)
- **Safari**: 12+ (Web Speech API サポート)
- **Edge**: 79+ (Web Speech API フルサポート)
- **モバイル**: iOS Safari 12+, Chrome Mobile 60+
- **音声合成**: Web Speech API対応ブラウザのみ

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
2. **Live2D機能**: 未実装（modelsフォルダ存在のみ）
3. **マルチユーザー**: 非対応
4. **ファイルアップロード**: 非対応
5. **音声入力**: 非対応（音声出力のみ実装済み）
6. **AivisSpeech Engine**: ローカル起動が必要（ポート10101）
7. **Google Cloud TTS**: API利用料金発生、ネットワーク必須
8. **音声エンジン設定**: UIでの詳細設定変更不可（コード内固定）

### 既知の問題
1. **長時間使用**: メモリリーク可能性（履歴蓄積）
2. **大量履歴**: パフォーマンス低下可能性
3. **ネットワーク**: オフライン対応なし（AivisSpeech除く）
4. **音声重複**: 同時複数読み上げの制御（対策済み）
5. **音声品質**: ブラウザ・エンジンによる音声の違い
6. **AivisSpeech依存**: ローカルエンジンの起動状態に依存
7. **自動再生制限**: ブラウザポリシーによる初回再生制限

---

## 今後の拡張計画

### Phase 1: UI改善
- [ ] チャット履歴の永続化（LocalStorage）
- [ ] タイムスタンプ表示
- [ ] メッセージの削除機能
- [ ] テーマ切り替え機能

### Phase 2: 機能拡張
- [ ] Live2Dキャラクター表示
- [ ] 音声入力対応（音声認識）
- [ ] 音声設定カスタマイズUI（速度、音程、音量、スピーカー選択）
- [ ] AivisSpeech複数スピーカー対応（ずんだもん等）
- [ ] ファイルアップロード機能
- [x] マルチ音声エンジン対応（完了）
- [ ] 音声品質設定（サンプリングレート等）
- [ ] マークダウン対応

### Phase 3: 高度な機能
- [ ] マルチキャラクター対応
- [ ] AIペルソナ切り替え
- [ ] プラグインシステム
- [ ] 分析・統計機能

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
5. **スピーカーID**: 正しいスピーカーID (888753760) の使用（設定済み）

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

---

## 更新履歴

### Version 1.2.0 (2025-06-06)
- **マルチ音声エンジン対応**: Web Speech API、Google Cloud TTS、AivisSpeech Engine の3つの音声エンジンをサポート
- **AivisSpeech Engine統合**: 高品質日本語音声合成エンジンの完全統合
  - スピーカー: Anneli (ID: 888753760) ノーマル音声
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

*このドキュメントは Gemini Chatbot (Cloud Run Edition) v1.2.0 の技術仕様を記載しています。*
*AivisSpeech Engine統合により、高品質な日本語音声合成機能を提供します。*