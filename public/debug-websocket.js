// WebSocket デバッグクライアント for フロントエンド
class DebugWebSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.debugMode = false;
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
            console.log('🔌 デバッグWebSocketクライアント初期化完了');
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
                console.log('🔗 デバッグWebSocket接続成功');
                this.connected = true;
                
                // クライアント種別を通知
                this.socket.emit('client_type', {
                    type: 'frontend',
                    origin: window.location.origin,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 デバッグWebSocket切断');
                this.connected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket接続エラー:', error);
            });

        } catch (error) {
            console.error('❌ WebSocket接続初期化エラー:', error);
        }
    }

    setupEventHandlers() {
        if (!this.socket) return;

        // 管理画面からのデバッグコマンド受信
        this.socket.on('debug_command', async (data) => {
            const { command, requestId, from } = data;
            
            console.log(`🧪 デバッグコマンド受信 [${requestId}]:`, command);
            
            try {
                // コマンドを実行
                const result = await this.executeCommand(command);
                
                // 結果を管理画面に送信
                this.socket.emit('command_result', {
                    result: result,
                    requestId: requestId,
                    adminClientId: from,
                    success: true
                });
                
                console.log(`✅ コマンド実行完了 [${requestId}]`);
                
            } catch (error) {
                console.error(`❌ コマンド実行エラー [${requestId}]:`, error);
                
                // エラーを管理画面に送信
                this.socket.emit('command_result', {
                    result: { error: error.message },
                    requestId: requestId,
                    adminClientId: from,
                    success: false
                });
            }
        });

        // システム状態の通知要求
        this.socket.on('request_status', () => {
            const status = this.getSystemStatus();
            this.socket.emit('frontend_status_update', status);
        });
    }

    // コマンドを実行（eval使用 - 開発環境のみ）
    async executeCommand(command) {
        // セキュリティ警告
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            throw new Error('デバッグコマンドはローカル環境でのみ実行可能です');
        }

        try {
            // コマンドの前処理（async/await対応）
            let wrappedCommand = command;
            if (command.includes('await') && !command.includes('async')) {
                wrappedCommand = `(async () => { ${command} })()`;
            }

            // コマンド実行
            const result = eval(wrappedCommand);
            
            // Promise の場合は待機
            if (result instanceof Promise) {
                return await result;
            }
            
            return result;
            
        } catch (error) {
            throw new Error(`コマンド実行エラー: ${error.message}`);
        }
    }

    // システム状態を取得
    getSystemStatus() {
        return {
            components: {
                Live2DController: {
                    exists: !!window.Live2DController,
                    available: window.Live2DController ? window.Live2DController.isAvailable() : false
                },
                EmotionAnalyzer: {
                    exists: !!window.EmotionAnalyzer,
                    keywordCount: window.EmotionAnalyzer ? Object.keys(window.EmotionAnalyzer.emotionKeywords || {}).length : 0
                },
                currentModel: !!window.currentModel,
                PIXI: !!window.PIXI,
                app: !!window.app,
                backendClient: !!window.backendClient
            },
            performance: {
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null,
                timing: performance.timing ? {
                    load: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                } : null
            },
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }

    // 手動でステータス更新を送信
    sendStatusUpdate() {
        if (this.connected && this.socket) {
            const status = this.getSystemStatus();
            this.socket.emit('frontend_status_update', status);
            console.log('📊 フロントエンド状態を送信:', status);
        }
    }

    // デバッグモードの切り替え
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🔧 デバッグモード: ${enabled ? 'ON' : 'OFF'}`);
        
        if (enabled) {
            // デバッグ情報をコンソールに表示
            this.sendStatusUpdate();
        }
    }

    // 接続状態確認
    isConnected() {
        return this.connected;
    }

    // 手動でコマンドをテスト実行
    async testCommand(command) {
        if (!this.debugMode) {
            console.warn('⚠️ デバッグモードが無効です。setDebugMode(true)で有効にしてください。');
            return;
        }

        try {
            const result = await this.executeCommand(command);
            console.log('✅ テストコマンド実行結果:', result);
            return result;
        } catch (error) {
            console.error('❌ テストコマンド実行エラー:', error);
            throw error;
        }
    }
}

// グローバルインスタンス作成
let debugWsClient = null;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // 開発環境でのみ有効化
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        debugWsClient = new DebugWebSocketClient();
        
        // グローバルアクセス用
        window.debugWsClient = debugWsClient;
        
        console.log('🎯 デバッグWebSocketクライアント利用可能:');
        console.log('  - window.debugWsClient.setDebugMode(true) : デバッグモード有効化');
        console.log('  - window.debugWsClient.sendStatusUpdate() : 状態更新送信');
        console.log('  - window.debugWsClient.testCommand("code") : コマンドテスト実行');
    } else {
        console.log('⚙️ 本番環境のためデバッグWebSocketは無効です');
    }
});

console.log('📡 デバッグWebSocketクライアント読み込み完了');
