/**
 * WebSocket接続状況の総合確認スクリプト
 * Chloe作成 - 全クライアントの接続状況とイベント流れを監視
 */

const io = require('socket.io-client');

console.log('🔍 WebSocket接続状況の詳細診断開始\n');

// サーバー監視用のクライアント
const monitorSocket = io('http://localhost:3001');

monitorSocket.on('connect', () => {
    console.log('✅ 監視クライアント接続成功');
    
    // 管理者として登録
    monitorSocket.emit('client_type', {
        type: 'admin',
        origin: 'monitor'
    });
    
    monitorSocket.emit('admin_auth', {
        token: 'admin-debug-token-2024'
    });
});

monitorSocket.on('auth_success', () => {
    console.log('✅ 監視クライアント認証完了\n');
    
    // 接続されているクライアント一覧を取得（カスタムイベント）
    monitorSocket.emit('get_client_list');
    
    // 簡単なテストコマンドを送信
    setTimeout(() => {
        console.log('📤 簡単なテストコマンド送信...');
        monitorSocket.emit('execute_frontend_command', {
            command: 'window.location.hostname + ":" + window.location.port',
            requestId: 'hostname-test-' + Date.now(),
            targetClient: 'all'
        });
    }, 2000);
    
    // DOM存在確認
    setTimeout(() => {
        console.log('📤 DOM要素確認コマンド送信...');
        monitorSocket.emit('execute_frontend_command', {
            command: '!!document.querySelector("#chat-history") ? "chat-history要素が存在" : "chat-history要素が見つからない"',
            requestId: 'dom-test-' + Date.now(),
            targetClient: 'all'
        });
    }, 3000);
    
    // WebSocketクライアント確認
    setTimeout(() => {
        console.log('📤 WebSocketクライアント状態確認...');
        monitorSocket.emit('execute_frontend_command', {
            command: 'window.debugWsClient ? "デバッグWebSocketクライアント接続済み" : "デバッグWebSocketクライアント未接続"',
            requestId: 'ws-client-test-' + Date.now(),
            targetClient: 'all'
        });
    }, 4000);
});

// 全てのイベントをログ
monitorSocket.onAny((eventName, ...args) => {
    if (eventName !== 'connect' && eventName !== 'auth_success') {
        console.log(`📨 受信イベント: ${eventName}`, args);
    }
});

monitorSocket.on('frontend_result', (data) => {
    console.log(`✅ フロントエンド応答: "${data.result}" (リクエストID: ${data.requestId})`);
});

monitorSocket.on('command_error', (data) => {
    console.log(`❌ コマンドエラー: ${data.error}`);
});

monitorSocket.on('frontend_connected', (data) => {
    console.log(`🔗 フロントエンドクライアント接続: ${data.clientId} (${data.origin})`);
});

monitorSocket.on('auth_failed', () => {
    console.log('❌ 認証失敗');
    process.exit(1);
});

monitorSocket.on('connect_error', (error) => {
    console.log(`❌ 接続エラー: ${error.message}`);
    process.exit(1);
});

// 7秒後に終了
setTimeout(() => {
    console.log('\n📊 診断完了');
    monitorSocket.disconnect();
    process.exit(0);
}, 7000);
