#!/bin/bash

# Chatbot Sage - 起動スクリプト
# 3つのサーバーを同時に起動します

echo "🚀 Chatbot Sage 起動中..."
echo ""

# カレントディレクトリをスクリプトの場所に設定
cd "$(dirname "$0")"

# バックエンドサーバー起動
echo "📡 バックエンドAPI起動中... (port 3001)"
cd server
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
cd ..

# 少し待機
sleep 3

# フロントエンド起動
echo "🎭 フロントエンド起動中... (port 8080)"
cd public
python3 -m http.server 8080 > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

# 管理画面起動
echo "⚙️ 管理画面起動中... (port 8081)"
cd admin
python3 -m http.server 8081 > /dev/null 2>&1 &
ADMIN_PID=$!
cd ..

echo ""
echo "✅ 起動完了！"
echo ""
echo "📱 アクセスURL:"
echo "   フロントエンド: http://localhost:8080"
echo "   管理画面:       http://localhost:8081/admin.html"
echo "   バックエンドAPI: http://localhost:3001"
echo ""
echo "🔑 管理画面ログイン情報:"
echo "   ユーザー名: admin"
echo "   パスワード: chloe2025"
echo ""
echo "⏹️ 停止する場合は Ctrl+C を押してください"

# プロセス終了時の処理
cleanup() {
    echo ""
    echo "🛑 サーバーを停止中..."
    kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null
    echo "✅ 全サーバーが停止されました"
    exit 0
}

# シグナルハンドラー設定
trap cleanup SIGINT SIGTERM

# サーバーが動作中は待機
wait
