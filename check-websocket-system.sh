#!/bin/bash
# ChatBot Sage WebSocketシステム 最終動作確認スクリプト
# Chloe作成 - システム全体の動作確認

echo "🚀 ChatBot Sage WebSocketシステム 最終動作確認"
echo "================================================"

# サーバー起動状況確認
echo ""
echo "📊 1. サーバー起動状況確認"
echo "----------------------------"

# プロセス確認
SERVER_COUNT=$(ps aux | grep "node server/app.js" | grep -v grep | wc -l | tr -d ' ')
if [ "$SERVER_COUNT" -gt 0 ]; then
    echo "✅ バックエンドサーバー: 動作中"
else
    echo "❌ バックエンドサーバー: 停止中"
fi

# ポート確認
if lsof -i :3001 >/dev/null 2>&1; then
    echo "✅ ポート 3001: リスニング中"
else
    echo "❌ ポート 3001: 使用されていません"
fi

if lsof -i :8080 >/dev/null 2>&1; then
    echo "✅ ポート 8080: リスニング中"
else
    echo "❌ ポート 8080: 使用されていません"
fi

if lsof -i :8081 >/dev/null 2>&1; then
    echo "✅ ポート 8081: リスニング中"
else
    echo "❌ ポート 8081: 使用されていません"
fi

# HTTP接続テスト
echo ""
echo "🌐 2. HTTP接続テスト"
echo "----------------------------"

# バックエンドテスト
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ バックエンド (3001): 応答あり"
else
    echo "❌ バックエンド (3001): 応答なし"
fi

# フロントエンドテスト
if curl -s http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ フロントエンド (8080): 応答あり"
else
    echo "❌ フロントエンド (8080): 応答なし"
fi

# アドミンパネルテスト
if curl -s http://localhost:8081 >/dev/null 2>&1; then
    echo "✅ アドミンパネル (8081): 応答あり"
else
    echo "❌ アドミンパネル (8081): 応答なし"
fi

# ファイル存在確認
echo ""
echo "📁 3. 重要ファイル存在確認"
echo "----------------------------"

FILES=(
    "server/app.js"
    "server/websocket.js"
    "admin/admin-script.js"
    "admin/admin-websocket.js"
    "public/debug-websocket.js"
    "public/script.js"
    "docs/SPECIFICATION.md"
    "WEBSOCKET_TEST_REPORT.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file: 存在"
    else
        echo "❌ $file: 見つかりません"
    fi
done

# WebSocket依存関係確認
echo ""
echo "📦 4. WebSocket依存関係確認"
echo "----------------------------"

if [ -d "node_modules/socket.io" ]; then
    echo "✅ Socket.IO サーバー: インストール済み"
else
    echo "❌ Socket.IO サーバー: 見つかりません"
fi

if [ -d "node_modules/socket.io-client" ]; then
    echo "✅ Socket.IO クライアント: インストール済み"
else
    echo "❌ Socket.IO クライアント: 見つかりません"
fi

# ログファイル確認
echo ""
echo "📋 5. ログファイル状況"
echo "----------------------------"

if [ -f "backend.log" ]; then
    LINES=$(wc -l < backend.log)
    echo "✅ backend.log: $LINES 行"
    echo "   最新: $(tail -1 backend.log)"
else
    echo "❌ backend.log: 見つかりません"
fi

if [ -f "frontend.log" ]; then
    LINES=$(wc -l < frontend.log)
    echo "✅ frontend.log: $LINES 行"
else
    echo "❌ frontend.log: 見つかりません"
fi

if [ -f "admin.log" ]; then
    LINES=$(wc -l < admin.log)
    echo "✅ admin.log: $LINES 行"
else
    echo "❌ admin.log: 見つかりません"
fi

echo ""
echo "🎯 動作確認完了"
echo "================================================"
echo ""
echo "✨ 次の手順でWebSocket機能をテストしてください:"
echo "1. http://localhost:8080 でフロントエンドを開く"
echo "2. http://localhost:8081 でアドミンパネルを開く"  
echo "3. ブラウザのコンソールで WebSocket接続を確認"
echo "4. アドミンパネルでデバッグコマンドを実行"
echo ""
echo "🔧 テストファイル:"
echo "- websocket-debug-console.html (ブラウザでテスト)"
echo "- test-websocket-live.js (Node.jsでテスト)"
echo ""
