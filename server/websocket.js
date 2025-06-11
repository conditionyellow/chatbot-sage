// WebSocket サーバー管理
const { Server } = require('socket.io');
const { requireAuth } = require('./middleware/auth');

class WebSocketManager {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: [
                    process.env.FRONTEND_URL || 'http://localhost:8080',
                    process.env.ADMIN_URL || 'http://localhost:8081'
                ],
                credentials: true
            }
        });

        this.frontendClients = new Map(); // フロントエンドクライアント管理
        this.adminClients = new Map();    // 管理画面クライアント管理
        
        this.setupEventHandlers();
        console.log('🔌 WebSocket サーバー初期化完了');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 クライアント接続: ${socket.id}`);

            // クライアント認証と種別判定
            socket.on('client_type', (data) => {
                const { type, origin } = data;
                
                if (type === 'frontend') {
                    this.frontendClients.set(socket.id, {
                        socket,
                        origin,
                        connected: new Date()
                    });
                    console.log(`📱 フロントエンドクライアント登録: ${socket.id}`);
                    
                    // 管理画面に通知
                    this.notifyAdmins('frontend_connected', {
                        clientId: socket.id,
                        origin,
                        timestamp: new Date()
                    });
                    
                } else if (type === 'admin') {
                    // 管理画面は認証が必要
                    this.adminClients.set(socket.id, {
                        socket,
                        origin,
                        connected: new Date(),
                        authenticated: false
                    });
                    console.log(`⚙️ 管理画面クライアント登録: ${socket.id}`);
                }
            });

            // 管理画面認証
            socket.on('admin_auth', (data) => {
                // セッション認証をチェック（実際の実装では session middleware を使用）
                const adminClient = this.adminClients.get(socket.id);
                if (adminClient) {
                    adminClient.authenticated = true;
                    socket.emit('auth_success');
                    console.log(`🔐 管理画面認証完了: ${socket.id}`);
                } else {
                    socket.emit('auth_failed');
                }
            });

            // 管理画面からフロントエンドへのコマンド実行
            socket.on('execute_frontend_command', (data) => {
                const adminClient = this.adminClients.get(socket.id);
                
                if (!adminClient || !adminClient.authenticated) {
                    socket.emit('command_error', { error: '認証が必要です' });
                    return;
                }

                const { command, targetClient } = data;
                
                // フロントエンドクライアントにコマンドを送信
                if (targetClient === 'all') {
                    // 全フロントエンドクライアントに送信
                    this.frontendClients.forEach((client, clientId) => {
                        client.socket.emit('debug_command', {
                            command,
                            requestId: data.requestId,
                            from: socket.id
                        });
                    });
                } else {
                    // 特定のクライアントに送信
                    const targetFrontend = this.frontendClients.get(targetClient);
                    if (targetFrontend) {
                        targetFrontend.socket.emit('debug_command', {
                            command,
                            requestId: data.requestId,
                            from: socket.id
                        });
                    } else {
                        socket.emit('command_error', { 
                            error: 'フロントエンドクライアントが見つかりません',
                            requestId: data.requestId
                        });
                    }
                }
            });

            // フロントエンドからの実行結果
            socket.on('command_result', (data) => {
                const { result, requestId, adminClientId } = data;
                
                // 結果を管理画面に送信
                const adminClient = this.adminClients.get(adminClientId);
                if (adminClient) {
                    adminClient.socket.emit('frontend_result', {
                        result,
                        requestId,
                        fromClient: socket.id
                    });
                }
            });

            // フロントエンドの状態更新
            socket.on('frontend_status_update', (data) => {
                // 管理画面に状態変更を通知
                this.notifyAdmins('frontend_status_update', {
                    clientId: socket.id,
                    status: data,
                    timestamp: new Date()
                });
            });

            // クライアント切断
            socket.on('disconnect', () => {
                console.log(`🔌 クライアント切断: ${socket.id}`);
                
                if (this.frontendClients.has(socket.id)) {
                    this.frontendClients.delete(socket.id);
                    this.notifyAdmins('frontend_disconnected', {
                        clientId: socket.id,
                        timestamp: new Date()
                    });
                } else if (this.adminClients.has(socket.id)) {
                    this.adminClients.delete(socket.id);
                }
            });
        });
    }

    // 管理画面クライアントに通知
    notifyAdmins(event, data) {
        this.adminClients.forEach((client) => {
            if (client.authenticated) {
                client.socket.emit(event, data);
            }
        });
    }

    // フロントエンドクライアントに通知
    notifyFrontends(event, data) {
        this.frontendClients.forEach((client) => {
            client.socket.emit(event, data);
        });
    }

    // 接続状況取得
    getConnectionStatus() {
        return {
            frontendClients: Array.from(this.frontendClients.entries()).map(([id, client]) => ({
                id,
                origin: client.origin,
                connected: client.connected
            })),
            adminClients: Array.from(this.adminClients.entries()).map(([id, client]) => ({
                id,
                origin: client.origin,
                connected: client.connected,
                authenticated: client.authenticated
            }))
        };
    }
}

module.exports = WebSocketManager;
