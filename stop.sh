#!/bin/bash

# ChatBot Sage 停止スクリプト (macOS/Linux)
# 起動したサーバーを安全に停止します

echo "⏹️  ChatBot Sage 停止中..."
echo "========================="

# 色付きテキスト用の定数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルートに移動
cd "$(dirname "$0")"

# PIDファイルが存在する場合
if [ -f ".pids" ]; then
    echo -e "${YELLOW}📋 PIDファイルからプロセスを停止中...${NC}"
    
    while IFS= read -r pid; do
        if [ ! -z "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${BLUE}🔄 プロセス $pid を停止中...${NC}"
            kill "$pid" 2>/dev/null
            
            # プロセスが終了するまで待機
            for i in {1..10}; do
                if ! ps -p "$pid" > /dev/null 2>&1; then
                    break
                fi
                sleep 1
            done
            
            # 強制停止が必要な場合
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  プロセス $pid を強制停止中...${NC}"
                kill -9 "$pid" 2>/dev/null
            fi
        fi
    done < ".pids"
    
    # PIDファイルを削除
    rm ".pids"
    echo -e "${GREEN}✅ PIDファイルから停止完了${NC}"
fi

# ポート別に停止
echo -e "${YELLOW}🔍 ポート使用中のプロセスをチェック中...${NC}"

# ポート3001 (バックエンド)
PORT_3001=$(lsof -ti:3001)
if [ ! -z "$PORT_3001" ]; then
    echo -e "${BLUE}🔧 ポート3001のプロセスを停止中...${NC}"
    kill $PORT_3001 2>/dev/null
    sleep 2
    
    # 強制停止が必要な場合
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  ポート3001のプロセスを強制停止中...${NC}"
        kill -9 $(lsof -ti:3001) 2>/dev/null
    fi
fi

# ポート8080 (フロントエンド)
PORT_8080=$(lsof -ti:8080)
if [ ! -z "$PORT_8080" ]; then
    echo -e "${BLUE}🎨 ポート8080のプロセスを停止中...${NC}"
    kill $PORT_8080 2>/dev/null
    sleep 2
    
    # 強制停止が必要な場合
    if lsof -ti:8080 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  ポート8080のプロセスを強制停止中...${NC}"
        kill -9 $(lsof -ti:8080) 2>/dev/null
    fi
fi

# ポート8081 (管理画面)
PORT_8081=$(lsof -ti:8081)
if [ ! -z "$PORT_8081" ]; then
    echo -e "${BLUE}⚙️  ポート8081のプロセスを停止中...${NC}"
    kill $PORT_8081 2>/dev/null
    sleep 2
    
    # 強制停止が必要な場合
    if lsof -ti:8081 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  ポート8081のプロセスを強制停止中...${NC}"
        kill -9 $(lsof -ti:8081) 2>/dev/null
    fi
fi

# ログファイルをクリーンアップ
if [ -f "backend.log" ] || [ -f "frontend.log" ] || [ -f "admin.log" ]; then
    echo -e "${YELLOW}🧹 ログファイルをクリーンアップ中...${NC}"
    rm -f backend.log frontend.log admin.log
fi

# 最終確認
echo -e "${YELLOW}🔍 最終確認中...${NC}"
sleep 1

STILL_RUNNING=""
if lsof -ti:3001 > /dev/null 2>&1; then
    STILL_RUNNING="$STILL_RUNNING ポート3001"
fi
if lsof -ti:8080 > /dev/null 2>&1; then
    STILL_RUNNING="$STILL_RUNNING ポート8080"
fi
if lsof -ti:8081 > /dev/null 2>&1; then
    STILL_RUNNING="$STILL_RUNNING ポート8081"
fi

if [ -z "$STILL_RUNNING" ]; then
    echo ""
    echo -e "${GREEN}🎉 ChatBot Sage の停止が完了しました！${NC}"
    echo "========================="
    echo -e "${GREEN}✅ 全てのサーバーが正常に停止されました${NC}"
else
    echo ""
    echo -e "${RED}⚠️  一部のプロセスが停止できませんでした:${NC}"
    echo -e "${YELLOW}$STILL_RUNNING${NC}"
    echo ""
    echo -e "${YELLOW}手動で停止する場合:${NC}"
    echo "sudo lsof -ti:3001,8080,8081 | xargs kill -9"
fi

echo ""
echo -e "${BLUE}再起動する場合: ./start.sh を実行してください${NC}"
