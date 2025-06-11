# Google Cloud Text-to-Speech API セットアップガイド

## 概要

このガイドでは、チャットボットにGoogle Cloud Text-to-Speech APIを統合する方法を説明します。

## 必要な準備

### 1. Google Cloud Platform設定

1. **Google Cloud Consoleでプロジェクトを選択**
2. **Text-to-Speech APIを有効化**
   ```bash
   gcloud services enable texttospeech.googleapis.com
   ```
3. **サービスアカウントキーを作成**（既存のものを使用可能）

### 2. Cloud Functionの拡張

既存のCloud Functionに以下のエンドポイントを追加：

```javascript
// package.json に追加が必要
{
  "dependencies": {
    "@google-cloud/text-to-speech": "^5.0.0",
    // ... 既存の依存関係
  }
}
```

```javascript
// index.js に追加
const textToSpeech = require('@google-cloud/text-to-speech');

// Text-to-Speech クライアントを初期化
const ttsClient = new textToSpeech.TextToSpeechClient();

// TTSエンドポイント
app.post('/tts', async (req, res) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { text, languageCode = 'ja-JP', voiceName = 'ja-JP-Neural2-B', audioEncoding = 'MP3' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Text-to-Speech リクエスト
    const request = {
      input: { text: text },
      voice: {
        languageCode: languageCode,
        name: voiceName
      },
      audioConfig: {
        audioEncoding: audioEncoding,
        speakingRate: 0.9,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    console.log('TTS Request:', { text: text.substring(0, 50) + '...', languageCode, voiceName });

    const [response] = await ttsClient.synthesizeSpeech(request);

    // Base64エンコードして返す
    const audioContent = response.audioContent.toString('base64');

    res.json({
      audioContent: audioContent,
      contentType: `audio/${audioEncoding.toLowerCase()}`
    });

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ 
      error: 'Text-to-Speech synthesis failed',
      details: error.message 
    });
  }
});
```

### 3. 利用可能な日本語音声

| 音声名 | 性別 | 音質 |
|--------|------|------|
| ja-JP-Neural2-B | 女性 | Neural |
| ja-JP-Neural2-C | 男性 | Neural |
| ja-JP-Neural2-D | 男性 | Neural |
| ja-JP-Standard-A | 女性 | Standard |
| ja-JP-Standard-B | 女性 | Standard |
| ja-JP-Standard-C | 男性 | Standard |
| ja-JP-Standard-D | 男性 | Standard |
| ja-JP-Wavenet-A | 女性 | WaveNet |
| ja-JP-Wavenet-B | 女性 | WaveNet |
| ja-JP-Wavenet-C | 男性 | WaveNet |
| ja-JP-Wavenet-D | 男性 | WaveNet |

### 4. 料金について

- **Neural2音声**: 100万文字あたり $16.00
- **WaveNet音声**: 100万文字あたり $16.00
- **Standard音声**: 100万文字あたり $4.00

詳細: [Google Cloud TTS 料金](https://cloud.google.com/text-to-speech/pricing)

## デプロイ手順

1. **Cloud Functionを更新**
   ```bash
   gcloud functions deploy your-function-name \
     --runtime nodejs18 \
     --trigger-http \
     --allow-unauthenticated \
     --set-env-vars="PROJECT_ID=your-project-id"
   ```

2. **フロントエンドのURLを更新**
   ```javascript
   const TTS_API_URL = "https://your-cloud-function-url/tts";
   ```

## アプリケーション起動と設定

### 統合起動システム（v3.2.0以降）

#### アプリケーション起動
```bash
# 全サーバー統合起動
npm start

# 開発モード
npm run dev

# 停止
npm stop
```

#### アクセス先
- **フロントエンド**: http://localhost:8080
- **管理画面**: http://localhost:8081 (admin / chloe2025)
- **バックエンドAPI**: http://localhost:3001

#### Google TTS設定
1. 管理画面にアクセス: http://localhost:8081
2. 「システム設定」でGoogle TTSの設定を管理
3. フロントエンドで🎵ボタンによる音声エンジン切り替え

## 統合起動システム対応のトラブルシューティング

1. **認証エラー**
   - サービスアカウントキーの確認
   - Text-to-Speech APIが有効化されているか確認

2. **音声が再生されない**
   - ブラウザの自動再生ポリシーの確認
   - HTTPS接続の確認

3. **文字数制限**
   - 1回のリクエストで5000文字まで
   - 長いテキストは分割が必要

4. **統合起動システム関連**
   - `npm stop`で完全停止後、`npm start`で再起動
   - ログファイル確認: `logs/backend.log`
   - プロセス確認: `.pids`ファイルの状態

5. **音声エンジン切り替え問題**
   - フロントエンドで🎵ボタンを使用して切り替え
   - 自動フォールバック機能により他のエンジンに切り替わる

## セキュリティ考慮事項

1. **API使用量制限**
   - レート制限の実装を推奨
   - 異常な使用量の監視

2. **入力サニタイズ**
   - XSS攻撃の防止
   - 不適切な内容のフィルタリング

3. **統合システムセキュリティ**
   - プロセス分離による安全な実行
   - ログファイルの自動クリーンアップ
   - localhost制限による外部アクセス防止
   - PIDファイルによる確実なプロセス管理

---

**最終更新**: 2025年6月11日  
**対応バージョン**: 3.2.0 (Unified Startup System)  
**統合起動システム**: 完全対応
