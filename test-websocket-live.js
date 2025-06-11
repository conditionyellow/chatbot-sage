#!/usr/bin/env node
/**
 * WebSocket機能の総合テストスクリプト（改良版）
 * Chloe作成 - リアルタイムWebSocket通信の動作確認
 */

const io = require('socket.io-client');

console.log('🔌 WebSocket機能テスト開始...\n');

// 管理者クライアントとしてテスト
const adminSocket = io('http://localhost:3001');

adminSocket.on('connect', () => {
    console.log('✅ 管理者WebSocket接続成功');
    
    // まず管理者タイプとして登録
    adminSocket.emit('client_type', {
        type: 'admin',
        origin: 'localhost:test'
    });
    
    // 認証
    adminSocket.emit('admin_auth', {
        token: 'admin-debug-token-2024'
    });
});

adminSocket.on('auth_success', () => {
    console.log('✅ 管理者認証完了');
    
    // フロントエンドでのテスト実行
    setTimeout(() => {
        console.log('\n📤 フロントエンドにテストコマンド送信中...');
        
        adminSocket.emit('execute_frontend_command', {
            command: 'console.log("🎉 WebSocketテスト成功! アドミンパネルからの実行です"); "WebSocket通信テスト完了"',
            requestId: 'test-' + Date.now(),
            targetClient: 'all'
        });
    }, 1000);
    
    // 感情テスト
    setTimeout(() => {
        console.log('😊 感情テスト実行中...');
        
        adminSocket.emit('execute_frontend_command', {
            command: `
                if (window.EmotionAnalyzer && window.EmotionAnalyzer.testEmotion) {
                    window.EmotionAnalyzer.testEmotion('happy');
                    'Happy感情テスト実行完了';
                } else {
                    'EmotionAnalyzerが見つかりません';
                }
            `,
            requestId: 'emotion-test-' + Date.now(),
            targetClient: 'all'
        });
    }, 2000);
    
    // Live2Dテスト
    setTimeout(() => {
        console.log('🎭 Live2Dテスト実行中...');
        
        adminSocket.emit('execute_frontend_command', {
            command: `
                if (window.live2dManager && window.live2dManager.setExpression) {
                    window.live2dManager.setExpression('surprised');
                    'Live2D表情変更完了';
                } else {
                    'Live2Dマネージャーが見つかりません（正常: まだロードされていない可能性）';
                }
            `,
            requestId: 'live2d-test-' + Date.now(),
            targetClient: 'all'
        });
    }, 3000);
});

adminSocket.on('frontend_result', (data) => {
    console.log(`✅ フロントエンド実行成功: ${data.result}`);
});

adminSocket.on('command_error', (data) => {
    console.log(`❌ コマンドエラー: ${data.error}`);
});

adminSocket.on('auth_failed', (error) => {
    console.log(`❌ 認証失敗: ${error || '不明なエラー'}`);
    process.exit(1);
});

adminSocket.on('connect_error', (error) => {
    console.log(`❌ 接続エラー: ${error.message}`);
    process.exit(1);
});

// 5秒後に終了
setTimeout(() => {
    console.log('\n🎯 WebSocketテスト完了');
    adminSocket.disconnect();
    process.exit(0);
}, 5000);
