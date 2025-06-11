// 管理画面用 WebSocket クライアント
class AdminWebSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.frontendClients = [];
        this.pendingCommands = new Map();
        
        this.init();
    }

    async init() {
        try {
            // Socket.IOクライアントを動的に読み込み
            if (!window.io) {
                await this.loadSocketIO();
            }
            
            this.connect();
            this.setupEventHandlers();
            console.log('🔌 管理画面WebSocketクライアント初期化完了');
        } catch (error) {
            console.error('❌ WebSocketクライアント初期化エラー:', error);
        }
    }

    async loadSocketIO() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
            script.onload = () => {
                console.log('📦 Socket.IO クライアントライブラリ読み込み完了');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Socket.IO クライアントライブラリの読み込みに失敗'));
            };
            document.head.appendChild(script);
        });
    }

    connect() {
        try {
            this.socket = io('http://localhost:3001', {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('🔗 管理画面WebSocket接続成功');
                this.connected = true;
                
                // クライアント種別を通知
                this.socket.emit('client_type', {
                    type: 'admin',
                    origin: window.location.origin
                });

                // 認証を試行
                this.authenticate();
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 管理画面WebSocket切断');
                this.connected = false;
                this.authenticated = false;
                this.updateConnectionStatus();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket接続エラー:', error);
                this.updateConnectionStatus();
            });

        } catch (error) {
            console.error('❌ WebSocket接続初期化エラー:', error);
        }
    }

    authenticate() {
        if (this.socket && this.connected) {
            this.socket.emit('admin_auth', {
                // セッション認証は既にHTTPで行われているのでダミーデータ
                timestamp: new Date().toISOString()
            });
        }
    }

    setupEventHandlers() {
        if (!this.socket) return;

        // 認証成功
        this.socket.on('auth_success', () => {
            console.log('🔐 管理画面認証成功');
            this.authenticated = true;
            this.updateConnectionStatus();
        });

        // 認証失敗
        this.socket.on('auth_failed', () => {
            console.error('❌ 管理画面認証失敗');
            this.authenticated = false;
            this.updateConnectionStatus();
        });

        // フロントエンド接続通知
        this.socket.on('frontend_connected', (data) => {
            console.log('📱 フロントエンドクライアント接続:', data);
            this.updateFrontendClientsList();
        });

        // フロントエンド切断通知
        this.socket.on('frontend_disconnected', (data) => {
            console.log('📱 フロントエンドクライアント切断:', data);
            this.updateFrontendClientsList();
        });

        // フロントエンド状態更新
        this.socket.on('frontend_status_update', (data) => {
            console.log('📊 フロントエンド状態更新:', data);
            this.handleFrontendStatusUpdate(data);
        });

        // コマンド実行結果
        this.socket.on('frontend_result', (data) => {
            console.log('📋 フロントエンド実行結果:', data);
            this.handleCommandResult(data);
        });

        // コマンドエラー
        this.socket.on('command_error', (data) => {
            console.error('❌ コマンドエラー:', data);
            this.handleCommandError(data);
        });
    }

    // フロントエンドにコマンドを送信
    async executeOnFrontend(command, targetClient = 'all') {
        if (!this.connected || !this.authenticated) {
            throw new Error('WebSocketが接続されていないか認証されていません');
        }

        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Promise((resolve, reject) => {
            // 結果待機のタイムアウト（30秒）
            const timeout = setTimeout(() => {
                this.pendingCommands.delete(requestId);
                reject(new Error('コマンド実行がタイムアウトしました'));
            }, 30000);

            // 待機中コマンドに追加
            this.pendingCommands.set(requestId, { resolve, reject, timeout });

            // コマンドを送信
            this.socket.emit('execute_frontend_command', {
                command: command,
                targetClient: targetClient,
                requestId: requestId,
                timestamp: new Date().toISOString()
            });

            console.log(`🚀 フロントエンドにコマンド送信 [${requestId}]:`, command);
        });
    }

    // コマンド実行結果の処理
    handleCommandResult(data) {
        const { result, requestId, success } = data;
        
        const pending = this.pendingCommands.get(requestId);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingCommands.delete(requestId);
            
            if (success) {
                pending.resolve(result);
            } else {
                pending.reject(new Error(result.error || 'コマンド実行に失敗しました'));
            }
        }
    }

    // コマンドエラーの処理
    handleCommandError(data) {
        const { error, requestId } = data;
        
        const pending = this.pendingCommands.get(requestId);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingCommands.delete(requestId);
            pending.reject(new Error(error));
        }
    }

    // フロントエンド状態更新の処理
    handleFrontendStatusUpdate(data) {
        // デバッグ出力に状態を表示
        if (window.adminApp && window.adminApp.debugLog) {
            window.adminApp.debugLog(`📊 フロントエンド状態更新: ${data.clientId}`);
            
            // フロントエンドの詳細状態をデバッグ出力に表示
            if (data.status && data.status.components) {
                const components = data.status.components;
                const report = Object.entries(components).map(([name, info]) => {
                    if (typeof info === 'object' && info.exists !== undefined) {
                        return `${name}: ${info.exists ? '✅' : '❌'} ${info.available ? '(利用可能)' : ''}`;
                    }
                    return `${name}: ${info ? '✅' : '❌'}`;
                }).join('\n');
                
                window.adminApp.showDebugResult('frontend-test-result', 
                    `📊 リアルタイムフロントエンド状態:\n\n${report}`, 'info');
            }
        }
    }

    // 接続状況の更新
    updateConnectionStatus() {
        // UI更新ロジック（管理画面のステータス表示を更新）
        const statusElements = document.querySelectorAll('.websocket-status');
        statusElements.forEach(element => {
            element.textContent = this.connected && this.authenticated ? '接続済み' : '未接続';
            element.className = `websocket-status ${this.connected && this.authenticated ? 'connected' : 'disconnected'}`;
        });

        // フロントエンドクライアント数も更新
        this.updateFrontendClientsList();

        // デバッグログにも接続状況を記録
        if (window.adminApp && window.adminApp.debugLog) {
            const status = this.connected && this.authenticated ? '接続済み' : '未接続';
            window.adminApp.debugLog(`🔌 WebSocket接続状況更新: ${status}`);
        }
    }

    // フロントエンドクライアント一覧の更新
    updateFrontendClientsList() {
        // 接続されているクライアント数を取得して表示
        fetch('http://localhost:3001/api/system/frontend-status', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.status.websocket) {
                const clientCount = data.status.websocket.connections?.frontendClients?.length || 0;
                
                // UI要素があれば更新
                const countElement = document.getElementById('frontend-clients-count');
                if (countElement) {
                    countElement.textContent = clientCount;
                }
                
                console.log(`📱 接続中フロントエンドクライアント数: ${clientCount}`);
            }
        })
        .catch(error => {
            console.error('フロントエンドクライアント情報取得エラー:', error);
        });
    }

    // 接続状態の確認
    isConnected() {
        return this.connected && this.authenticated;
    }

    // 手動再接続
    reconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        setTimeout(() => {
            this.connect();
        }, 1000);
    }
}

// グローバルインスタンス
let adminWsClient = null;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    adminWsClient = new AdminWebSocketClient();
    
    // グローバルアクセス用
    window.adminWsClient = adminWsClient;
    
    console.log('🎯 管理画面WebSocketクライアント利用可能: window.adminWsClient');
});

console.log('📡 管理画面WebSocketクライアント読み込み完了');
