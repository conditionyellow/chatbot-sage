#!/bin/bash
# フロントエンドサーバー再起動スクリプト
# Chloe作成 - ポート競合解決用

echo "🔄 フロントエンドサーバー再起動中..."

# 既存のフロントエンドサーバー（8080）を停止
echo "⏹️ 既存のフロントエンドサーバーを停止中..."
FRONTEND_PID=$(lsof -t -i :8080 2>/dev/null)
if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo "✅ フロントエンドサーバー (PID: $FRONTEND_PID) を停止しました"
    sleep 2
else
    echo "ℹ️ フロントエンドサーバーは動作していませんでした"
fi

# 新しいフロントエンドサーバーを起動
echo "🚀 新しいフロントエンドサーバーを起動中..."
python3 -m http.server 8080 --directory public &
FRONTEND_PID=$!

# 起動確認
sleep 2
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ フロントエンドサーバーが正常に起動しました (PID: $FRONTEND_PID)"
    echo "🌐 アクセス: http://localhost:8080"
else
    echo "❌ フロントエンドサーバーの起動に失敗しました"
fi
