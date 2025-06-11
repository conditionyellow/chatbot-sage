#!/bin/bash

# ChatBot Sage 起動スクリプト (macOS/Linux)
# このスクリプトは3つのサーバーを自動的に起動します

echo "🚀 ChatBot Sage 起動中..."
echo "=============================="

# 色付きテキスト用の定数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルートに移動
cd "$(dirname "$0")"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 依存関係をインストール中...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ npm install に失敗しました${NC}"
        exit 1
    fi
fi

# 既存のプロセスをチェック・停止
echo -e "${YELLOW}🔍 既存のプロセスをチェック中...${NC}"

# ポート3001をチェック
PORT_3001=$(lsof -ti:3001)
if [ ! -z "$PORT_3001" ]; then
    echo -e "${YELLOW}⚠️  ポート3001が使用中です。プロセスを停止します...${NC}"
    kill $PORT_3001 2>/dev/null
    sleep 2
fi

# ポート8080をチェック
PORT_8080=$(lsof -ti:8080)
if [ ! -z "$PORT_8080" ]; then
    echo -e "${YELLOW}⚠️  ポート8080が使用中です。プロセスを停止します...${NC}"
    kill $PORT_8080 2>/dev/null
    sleep 2
fi

# ポート8081をチェック
PORT_8081=$(lsof -ti:8081)
if [ ! -z "$PORT_8081" ]; then
    echo -e "${YELLOW}⚠️  ポート8081が使用中です。プロセスを停止します...${NC}"
    kill $PORT_8081 2>/dev/null
    sleep 2
fi

# バックエンドサーバー起動
echo -e "${BLUE}🔧 バックエンドサーバーを起動中...${NC}"
npm start > backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# バックエンドの起動確認
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ バックエンドサーバー起動完了 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ バックエンドサーバーの起動に失敗しました${NC}"
    echo "ログを確認してください: cat backend.log"
    exit 1
fi

# フロントエンドサーバー起動
echo -e "${BLUE}🎨 フロントエンドサーバーを起動中...${NC}"
python3 -m http.server 8080 --directory public > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# フロントエンドの起動確認
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ フロントエンドサーバー起動完了 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ フロントエンドサーバーの起動に失敗しました${NC}"
    echo "ログを確認してください: cat frontend.log"
    exit 1
fi

# 管理画面サーバー起動
echo -e "${BLUE}⚙️  管理画面サーバーを起動中...${NC}"
python3 -m http.server 8081 --directory admin > admin.log 2>&1 &
ADMIN_PID=$!
sleep 2

# 管理画面の起動確認
if ps -p $ADMIN_PID > /dev/null; then
    echo -e "${GREEN}✅ 管理画面サーバー起動完了 (PID: $ADMIN_PID)${NC}"
else
    echo -e "${RED}❌ 管理画面サーバーの起動に失敗しました${NC}"
    echo "ログを確認してください: cat admin.log"
    exit 1
fi

# PIDファイルを保存（停止用）
echo "$BACKEND_PID" > .pids
echo "$FRONTEND_PID" >> .pids
echo "$ADMIN_PID" >> .pids

echo ""
echo -e "${GREEN}🎉 ChatBot Sage の起動が完了しました！${NC}"
echo "=============================="
echo -e "${BLUE}📱 フロントエンド:${NC} http://localhost:8080"
echo -e "${BLUE}⚙️  管理画面:${NC}     http://localhost:8081"
echo -e "${BLUE}🔧 バックエンドAPI:${NC} http://localhost:3001"
echo ""
echo -e "${YELLOW}管理画面ログイン情報:${NC}"
echo "ユーザー名: admin"
echo "パスワード: chloe2025"
echo ""
echo -e "${YELLOW}💡 停止するには:${NC} ./stop.sh を実行してください"
echo ""
echo -e "${GREEN}ブラウザでアクセスして楽しんでください！${NC}"

