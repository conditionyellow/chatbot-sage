# Chatbot Sage - Public Frontend

## 概要
Live2Dキャラクター（Natori）を使用したGemini チャットボットのフロントエンド

## 起動方法
```bash
cd public
python3 -m http.server 8080
```

または、任意のHTTPサーバーで起動

## 主要ファイル
- `index.html`: メインHTMLファイル
- `script.js`: アプリケーションロジック
- `style.css`: スタイルシート
- `backend-client.js`: バックエンド通信クライアント
- `live2d-pixi.js`: Live2D統合コントローラー
- `emotion-analyzer-v2.js`: 感情分析エンジン
- `natori-personality.js`: Natori性格システム

## Live2Dモデル
- `models/natori/`: Natoriキャラクターモデルファイル
- `SDK/`: Live2D Cubism SDK
- `libs/`: 必要なライブラリファイル

## 機能
- Gemini AIとのチャット
- Live2Dキャラクターアニメーション
- 音声合成（3エンジン対応）
- YouTubeライブチャット統合表示
- 感情分析による表情制御

## バックエンド連携
- Backend API: http://localhost:3001
- YouTube監視状況のリアルタイム表示
- ライブチャットメッセージの自動受信
