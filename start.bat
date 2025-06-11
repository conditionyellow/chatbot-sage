@echo off
title Chatbot Sage Launcher

echo 🚀 Chatbot Sage 起動中...
echo.

cd /d "%~dp0"

echo 📡 バックエンドAPI起動中... (port 3001)
cd server
start "Backend API" cmd /k "npm install >nul 2>&1 && npm start"
cd ..

timeout /t 3 /nobreak >nul

echo 🎭 フロントエンド起動中... (port 8080)
cd public
start "Frontend" cmd /k "python -m http.server 8080 >nul 2>&1"
cd ..

echo ⚙️ 管理画面起動中... (port 8081)
cd admin
start "Admin Panel" cmd /k "python -m http.server 8081 >nul 2>&1"
cd ..

echo.
echo ✅ 起動完了！
echo.
echo 📱 アクセスURL:
echo    フロントエンド: http://localhost:8080
echo    管理画面:       http://localhost:8081/admin.html
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
