@echo off
setlocal enabledelayedexpansion
title ChatBot Sage Launcher

echo 🚀 ChatBot Sage 起動中...
echo ==============================

cd /d "%~dp0"

REM 依存関係の確認
if not exist node_modules (
    echo 📦 依存関係をインストール中...
    npm install
    if errorlevel 1 (
        echo ❌ npm install に失敗しました
        pause
        exit /b 1
    )
)

REM 既存のプロセスをチェック・停止
echo 🔍 既存のプロセスをチェック中...

REM ポートをチェックして既存プロセスを停止
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    if "%%a" neq "0" (
        echo ⚠️  ポート3001が使用中です。プロセスを停止します...
        taskkill /PID %%a /F >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    if "%%a" neq "0" (
        echo ⚠️  ポート8080が使用中です。プロセスを停止します...
        taskkill /PID %%a /F >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do (
    if "%%a" neq "0" (
        echo ⚠️  ポート8081が使用中です。プロセスを停止します...
        taskkill /PID %%a /F >nul 2>&1
    )
)

timeout /t 2 /nobreak >nul

REM バックエンドサーバー起動
echo 🔧 バックエンドサーバーを起動中...
start "ChatBot Sage - Backend API" cmd /k "npm start"
timeout /t 3 /nobreak >nul

REM フロントエンドサーバー起動
echo 🎨 フロントエンドサーバーを起動中...
start "ChatBot Sage - Frontend" cmd /k "cd public && python -m http.server 8080"
timeout /t 2 /nobreak >nul

REM 管理画面サーバー起動
echo ⚙️  管理画面サーバーを起動中...
start "ChatBot Sage - Admin Panel" cmd /k "cd admin && python -m http.server 8081"
timeout /t 2 /nobreak >nul

echo.
echo 🎉 ChatBot Sage の起動が完了しました！
echo ==============================
echo 📱 フロントエンド: http://localhost:8080
echo ⚙️  管理画面:     http://localhost:8081
echo 🔧 バックエンドAPI: http://localhost:3001
echo.
echo 管理画面ログイン情報:
echo ユーザー名: admin
echo パスワード: chloe2025
echo.
echo 💡 停止するには各ターミナルでCtrl+Cを押してください
echo.
echo ブラウザでアクセスして楽しんでください！
echo    バックエンドAPI: http://localhost:3001
echo.
echo 🔑 管理画面ログイン情報:
echo    ユーザー名: admin
echo    パスワード: chloe2025
echo.
echo 💡 各サーバーは別ウィンドウで起動されました
echo    サーバーを停止する場合は、各ウィンドウでCtrl+Cを押してください
echo.
pause
