// 管理画面JavaScript
class AdminApp {
    constructor() {
        this.apiBase = 'http://localhost:3001/api';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
        
        if (this.isAuthenticated) {
            this.showAdminScreen();
            this.loadDashboard();
        } else {
            this.showLoginScreen();
        }
    }

    setupEventListeners() {
        // ログインフォーム
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // ログアウトボタン
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // ナビゲーションタブ
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // YouTube設定フォーム
        document.getElementById('youtube-config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveYouTubeConfig();
        });

        // YouTube接続テスト
        document.getElementById('check-api-availability').addEventListener('click', () => {
            this.checkApiAvailability();
        });
        
        document.getElementById('test-connection').addEventListener('click', () => {
            this.testYouTubeConnection();
        });
        
        // APIキー表示切り替え
        document.getElementById('toggle-api-key-visibility').addEventListener('click', () => {
            this.toggleApiKeyVisibility();
        });

        // 監視制御
        document.getElementById('start-monitoring').addEventListener('click', () => {
            this.startMonitoring();
        });
        
        document.getElementById('stop-monitoring').addEventListener('click', () => {
            this.stopMonitoring();
        });

        // システム設定フォーム
        document.getElementById('system-config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystemConfig();
        });

        // ログ制御
        document.getElementById('refresh-logs').addEventListener('click', () => {
            this.loadLogs();
        });
        
        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('log-filter-level').addEventListener('change', () => {
            this.loadLogs();
        });

        // デバッグツールのイベントリスナー
        this.setupDebugEventListeners();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBase}/auth/status`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isAuthenticated = data.authenticated;
                this.currentUser = data.user;
            }
        } catch (error) {
            console.error('認証状態確認エラー:', error);
            this.isAuthenticated = false;
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-screen').style.display = 'none';
    }

    showAdminScreen() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-screen').style.display = 'flex';
        
        if (this.currentUser) {
            document.getElementById('user-info').textContent = 
                `ログイン中: ${this.currentUser.username}`;
        }

        // 自動更新開始
        this.startAutoRefresh();
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminScreen();
                this.loadDashboard();
                errorDiv.style.display = 'none';
            } else {
                errorDiv.textContent = data.error || 'ログインに失敗しました';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('ログインエラー:', error);
            errorDiv.textContent = 'サーバーとの通信に失敗しました';
            errorDiv.style.display = 'block';
        }
    }

    async handleLogout() {
        try {
            await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }

        this.isAuthenticated = false;
        this.currentUser = null;
        this.stopAutoRefresh();
        this.showLoginScreen();
        
        // フォームリセット
        document.getElementById('login-form').reset();
    }

    switchTab(tabName) {
        // ナビゲーションボタンの状態更新
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // タブコンテンツの表示切り替え
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // タブ固有の初期化処理
        switch (tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'youtube':
                this.loadYouTubeConfig();
                break;
            case 'system':
                this.loadSystemConfig();
                break;
            case 'logs':
                this.loadLogs();
                break;
            case 'debug':
                this.initDebugTools();
                break;
        }
    }

    async loadDashboard() {
        try {
            // YouTube監視状況の取得
            const youtubeStatus = await this.fetchYouTubeStatus();
            this.updateYouTubeStatus(youtubeStatus);

            // 最新ログの取得
            await this.loadRecentLogs();

            // 最終更新時刻の設定
            document.getElementById('last-update').textContent = 
                new Date().toLocaleString('ja-JP');

        } catch (error) {
            console.error('ダッシュボード読み込みエラー:', error);
        }
    }

    async fetchYouTubeStatus() {
        try {
            const response = await fetch(`${this.apiBase}/youtube/status`, {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('YouTube状況取得エラー:', error);
            return { isMonitoring: false };
        }
    }

    updateYouTubeStatus(status) {
        const statusIndicator = document.getElementById('youtube-monitoring-status');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        const liveChatId = document.getElementById('live-chat-id');
        const processedMessages = document.getElementById('processed-messages');

        if (status.isMonitoring) {
            statusDot.className = 'status-dot monitoring';
            statusText.textContent = '監視中';
            liveChatId.textContent = status.liveChatId || '取得中...';
            processedMessages.textContent = status.processedMessagesCount || 0;
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = '停止中';
            liveChatId.textContent = '未設定';
            processedMessages.textContent = '0';
        }
    }

    async loadRecentLogs() {
        try {
            const response = await fetch(`${this.apiBase}/logs?limit=5`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayRecentLogs(data.logs);
            }
        } catch (error) {
            console.error('最新ログ取得エラー:', error);
        }
    }

    displayRecentLogs(logs) {
        const container = document.getElementById('recent-logs');
        
        if (logs.length === 0) {
            container.innerHTML = '<p>ログがありません</p>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="log-entry ${log.level}">
                <div class="log-entry-time">${new Date(log.timestamp).toLocaleString('ja-JP')}</div>
                <div class="log-entry-message">${log.message}</div>
            </div>
        `).join('');
    }

    async loadYouTubeConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                const config = data.config;
                
                // フォームに設定値を反映（API Keyは除く）
                document.getElementById('video-id').value = config.videoId || '';
                document.getElementById('check-interval').value = config.checkInterval || 10;
            }

            // 監視状況の更新
            const youtubeStatus = await this.fetchYouTubeStatus();
            this.updateMonitoringControls(youtubeStatus.isMonitoring);
            
        } catch (error) {
            console.error('YouTube設定読み込みエラー:', error);
        }
    }

    async saveYouTubeConfig() {
        const config = {
            youtubeApiKey: document.getElementById('youtube-api-key').value,
            videoId: document.getElementById('video-id').value,
            checkInterval: parseInt(document.getElementById('check-interval').value)
        };

        try {
            const response = await fetch(`${this.apiBase}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('設定を保存しました', 'success');
                // API Keyフィールドをクリア（セキュリティのため）
                document.getElementById('youtube-api-key').value = '';
            } else {
                this.showMessage(data.error || '設定の保存に失敗しました', 'error');
            }
        } catch (error) {
            console.error('設定保存エラー:', error);
            this.showMessage('サーバーとの通信に失敗しました', 'error');
        }
    }

    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('youtube-api-key');
        const toggleButton = document.getElementById('toggle-api-key-visibility');
        
        if (apiKeyInput.type === 'password') {
            // パスワードを表示
            apiKeyInput.type = 'text';
            toggleButton.textContent = '🙈';
            toggleButton.classList.add('visible');
            toggleButton.title = 'APIキーを隠す';
        } else {
            // パスワードを隠す
            apiKeyInput.type = 'password';
            toggleButton.textContent = '👁️';
            toggleButton.classList.remove('visible');
            toggleButton.title = 'APIキーを表示';
        }
    }

    async checkApiAvailability() {
        const apiKey = document.getElementById('youtube-api-key').value;

        if (!apiKey) {
            this.showTestResult('YouTube API Keyを入力してください', 'error');
            return;
        }

        try {
            this.showTestResult('API可用性をチェック中...', 'info');

            const response = await fetch(`${this.apiBase}/youtube/check-api-availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ apiKey: apiKey })
            });

            const data = await response.json();

            if (response.ok) {
                this.showTestResult(
                    `✅ ${data.message}\n${data.details.recommendation}\nクォータ消費: ${data.details.quotaUsed}`, 
                    'success'
                );
            } else {
                let message = `❌ ${data.error}`;
                if (data.details.solution) {
                    message += `\n\n💡 解決策: ${data.details.solution}`;
                }
                if (data.details.reason) {
                    message += `\n🔍 詳細: ${data.details.reason}`;
                }
                if (data.details.message) {
                    message += `\n📝 メッセージ: ${data.details.message}`;
                }
                if (data.details.fullError) {
                    message += `\n\n🐞 完全なエラー情報:\n${JSON.stringify(data.details.fullError, null, 2)}`;
                }
                this.showTestResult(message, 'error');
            }
        } catch (error) {
            console.error('API可用性チェックエラー:', error);
            this.showTestResult('❌ API可用性チェックに失敗しました', 'error');
        }
    }

    async testYouTubeConnection() {
        const apiKey = document.getElementById('youtube-api-key').value;
        const videoId = document.getElementById('video-id').value;
        const resultDiv = document.getElementById('youtube-test-result');

        if (!apiKey) {
            this.showTestResult('YouTube API Keyを入力してください', 'error');
            return;
        }

        try {
            this.showTestResult('接続テスト中...', 'info');

            // まずAPIキーの有効性をテスト
            const apiTestResponse = await fetch(`${this.apiBase}/youtube/test-api-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ apiKey: apiKey })
            });

            const apiTestData = await apiTestResponse.json();

            if (!apiTestResponse.ok) {
                this.showTestResult(`❌ API接続失敗\n${apiTestData.error}`, 'error');
                return;
            }

            // APIキーが有効な場合、ビデオIDもテストする（提供されている場合）
            if (videoId) {
                const videoTestResponse = await fetch(`${this.apiBase}/youtube/test-video`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ youtubeApiKey: apiKey, videoId: videoId })
                });

                const videoTestData = await videoTestResponse.json();

                if (videoTestResponse.ok) {
                    this.showTestResult(
                        `✅ 完全接続成功\nAPIキー: 有効\n動画: ${videoTestData.videoInfo.title || videoTestData.videoInfo.videoId}\nライブチャットID: ${videoTestData.videoInfo.liveChatId}\nクォータ使用: ${videoTestData.quotaUsed}`, 
                        'success'
                    );
                } else {
                    let errorMsg = `⚠️ 部分的成功\nAPIキー: 有効\n動画接続: 失敗 - ${videoTestData.error}`;
                    
                    if (videoTestData.details) {
                        if (videoTestData.details.provided && videoTestData.details.extracted) {
                            errorMsg += `\n\n🔍 入力値分析:\n• 入力: ${videoTestData.details.provided}\n• 抽出されたID: ${videoTestData.details.extracted}\n• 文字数: ${videoTestData.details.length}`;
                        }
                        
                        if (videoTestData.details.suggestion) {
                            errorMsg += `\n\n💡 解決策: ${videoTestData.details.suggestion}`;
                        }
                        
                        if (videoTestData.details.supportedUrls) {
                            errorMsg += `\n\n📝 対応形式:\n• ${videoTestData.details.supportedUrls.join('\n• ')}`;
                        }
                        
                        if (videoTestData.details.possibleCauses) {
                            errorMsg += `\n\n❓ 考えられる原因:\n• ${videoTestData.details.possibleCauses.join('\n• ')}`;
                        }
                    }
                    
                    this.showTestResult(errorMsg, 'warning');
                }
            } else {
                this.showTestResult(
                    `✅ APIキー接続成功\nクォータ使用: ${apiTestData.details.quotaUsed}\n\n⚠️ ライブ配信IDを入力すると完全テストが実行されます\n\n📝 使用方法:\n• YouTubeライブ配信のURL全体\n• または11文字の動画ID`, 
                    'success'
                );
            }
        } catch (error) {
            console.error('接続テストエラー:', error);
            this.showTestResult('❌ 接続テストに失敗しました', 'error');
        }
    }

    showTestResult(message, type) {
        const resultDiv = document.getElementById('youtube-test-result');
        resultDiv.textContent = message;
        resultDiv.className = `test-result ${type}`;
        resultDiv.style.display = 'block';
    }

    async startMonitoring() {
        try {
            const response = await fetch(`${this.apiBase}/youtube/start`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('YouTube監視を開始しました', 'success');
                this.updateMonitoringControls(true);
                this.loadDashboard(); // ダッシュボード更新
            } else {
                this.showMessage(data.error || '監視の開始に失敗しました', 'error');
            }
        } catch (error) {
            console.error('監視開始エラー:', error);
            this.showMessage('サーバーとの通信に失敗しました', 'error');
        }
    }

    async stopMonitoring() {
        try {
            const response = await fetch(`${this.apiBase}/youtube/stop`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('YouTube監視を停止しました', 'success');
                this.updateMonitoringControls(false);
                this.loadDashboard(); // ダッシュボード更新
            } else {
                this.showMessage(data.error || '監視の停止に失敗しました', 'error');
            }
        } catch (error) {
            console.error('監視停止エラー:', error);
            this.showMessage('サーバーとの通信に失敗しました', 'error');
        }
    }

    updateMonitoringControls(isMonitoring) {
        const startBtn = document.getElementById('start-monitoring');
        const stopBtn = document.getElementById('stop-monitoring');
        const statusDiv = document.getElementById('monitoring-status');

        if (isMonitoring) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusDiv.innerHTML = '<span class="status-dot monitoring"></span><span>監視中</span>';
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusDiv.innerHTML = '<span class="status-dot offline"></span><span>監視停止中</span>';
        }
    }

    async loadSystemConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                const systemSettings = data.config.systemSettings || {};
                
                document.getElementById('enable-logging').checked = 
                    systemSettings.enableLogging !== false;
                document.getElementById('log-level').value = 
                    systemSettings.logLevel || 'info';
                document.getElementById('max-log-entries').value = 
                    systemSettings.maxLogEntries || 1000;
            }
        } catch (error) {
            console.error('システム設定読み込みエラー:', error);
        }
    }

    async saveSystemConfig() {
        const systemSettings = {
            enableLogging: document.getElementById('enable-logging').checked,
            logLevel: document.getElementById('log-level').value,
            maxLogEntries: parseInt(document.getElementById('max-log-entries').value)
        };

        try {
            // 現在の設定を取得してマージ
            const currentResponse = await fetch(`${this.apiBase}/config`, {
                credentials: 'include'
            });
            
            let currentConfig = {};
            if (currentResponse.ok) {
                const data = await currentResponse.json();
                currentConfig = data.config;
            }

            const updatedConfig = {
                ...currentConfig,
                systemSettings: systemSettings
            };

            const response = await fetch(`${this.apiBase}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(updatedConfig)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('システム設定を保存しました', 'success');
            } else {
                this.showMessage(data.error || '設定の保存に失敗しました', 'error');
            }
        } catch (error) {
            console.error('システム設定保存エラー:', error);
            this.showMessage('サーバーとの通信に失敗しました', 'error');
        }
    }

    async loadLogs() {
        const level = document.getElementById('log-filter-level').value;
        const container = document.getElementById('logs-container');

        try {
            const params = new URLSearchParams({
                limit: '50'
            });
            
            if (level) {
                params.append('level', level);
            }

            const response = await fetch(`${this.apiBase}/logs?${params}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayLogs(data.logs);
            } else {
                container.innerHTML = '<p>ログの読み込みに失敗しました</p>';
            }
        } catch (error) {
            console.error('ログ読み込みエラー:', error);
            container.innerHTML = '<p>ログの読み込みに失敗しました</p>';
        }
    }

    displayLogs(logs) {
        const container = document.getElementById('logs-container');
        
        if (logs.length === 0) {
            container.innerHTML = '<p>表示するログがありません</p>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="log-entry-full ${log.level}">
                <div class="log-header">
                    <span class="log-level ${log.level}">${log.level}</span>
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleString('ja-JP')}</span>
                </div>
                <div class="log-message">${log.message}</div>
                ${log.data && Object.keys(log.data).length > 0 ? 
                    `<div class="log-data">${JSON.stringify(log.data, null, 2)}</div>` : ''}
            </div>
        `).join('');
    }

    async clearLogs() {
        if (!confirm('すべてのログを削除しますか？この操作は取り消せません。')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/logs`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showMessage('ログをクリアしました', 'success');
                this.loadLogs();
            } else {
                this.showMessage('ログのクリアに失敗しました', 'error');
            }
        } catch (error) {
            console.error('ログクリアエラー:', error);
            this.showMessage('サーバーとの通信に失敗しました', 'error');
        }
    }

    showMessage(message, type) {
        // 簡易的なメッセージ表示（将来的にはトースト通知などに変更可能）
        alert(message);
    }

    startAutoRefresh() {
        // 30秒ごとにダッシュボードを自動更新
        this.refreshInterval = setInterval(() => {
            if (document.querySelector('[data-tab="dashboard"]').classList.contains('active')) {
                this.loadDashboard();
            }
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // ===== デバッグツール機能 =====

    setupDebugEventListeners() {
        // フロントエンド接続テスト
        document.getElementById('test-frontend-connection')?.addEventListener('click', () => {
            this.testFrontendConnection();
        });

        document.getElementById('get-frontend-status')?.addEventListener('click', () => {
            this.getFrontendStatus();
        });

        // 感情分析デバッグ
        document.getElementById('analyze-emotion')?.addEventListener('click', () => {
            this.analyzeEmotion();
        });

        document.getElementById('run-emotion-tests')?.addEventListener('click', () => {
            this.runEmotionTests();
        });

        document.getElementById('check-emotion-keywords')?.addEventListener('click', () => {
            this.checkEmotionKeywords();
        });

        // Live2Dデバッグ
        document.getElementById('check-live2d-status')?.addEventListener('click', () => {
            this.checkLive2DStatus();
        });

        document.getElementById('test-live2d-expressions')?.addEventListener('click', () => {
            this.testLive2DExpressions();
        });

        document.getElementById('test-live2d-motions')?.addEventListener('click', () => {
            this.testLive2DMotions();
        });

        // システム統合テスト
        document.getElementById('run-quick-test')?.addEventListener('click', () => {
            this.runQuickTest();
        });

        document.getElementById('run-full-system-test')?.addEventListener('click', () => {
            this.runFullSystemTest();
        });

        document.getElementById('clear-debug-output')?.addEventListener('click', () => {
            this.clearDebugOutput();
        });

        // WebSocket再接続
        document.getElementById('reconnect-websocket')?.addEventListener('click', () => {
            this.reconnectWebSocket();
        });
    }

    initDebugTools() {
        this.debugLog('🔧 デバッグツール初期化中...');
        this.debugLog('💻 管理画面からフロントエンドの機能をテストできます。');
        this.debugLog('⚠️  これらの機能は開発・デバッグ専用です。');
    }

    debugLog(message, type = 'info') {
        const output = document.getElementById('debug-output');
        if (!output) return;

        const timestamp = new Date().toLocaleString('ja-JP');
        const logEntry = `[${timestamp}] ${message}\n`;
        
        output.textContent += logEntry;
        output.scrollTop = output.scrollHeight;

        // システムログにも記録
        console.log(`[Admin Debug] ${message}`);
    }

    clearDebugOutput() {
        const output = document.getElementById('debug-output');
        if (output) {
            output.textContent = '';
        }
    }

    showDebugResult(elementId, message, type = 'info') {
        const resultDiv = document.getElementById(elementId);
        if (!resultDiv) return;

        resultDiv.textContent = message;
        resultDiv.className = `test-result ${type}`;
        resultDiv.style.display = 'block';

        // デバッグ出力にも追加
        this.debugLog(`[${elementId}] ${message}`, type);
    }

    // フロントエンド接続テスト
    async testFrontendConnection() {
        this.debugLog('🌐 フロントエンド接続テスト開始...');
        
        try {
            const response = await fetch('http://localhost:8080/', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            
            this.debugLog('✅ フロントエンドサーバーへの接続成功');
            this.showDebugResult('frontend-test-result', 
                '✅ フロントエンドサーバー接続成功\nURL: http://localhost:8080/', 'success');
            
        } catch (error) {
            this.debugLog(`❌ フロントエンド接続失敗: ${error.message}`);
            this.showDebugResult('frontend-test-result', 
                `❌ フロントエンド接続失敗\nエラー: ${error.message}\n\n確認事項:\n- フロントエンドサーバーが起動しているか\n- ポート8080が使用可能か`, 'error');
        }
    }

    async getFrontendStatus() {
        this.debugLog('📊 フロントエンド状態取得中...');
        
        try {
            // バックエンド経由でフロントエンドの状態を確認
            const response = await fetch(`${this.apiBase}/system/frontend-status`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.debugLog('✅ フロントエンド状態取得成功');
                this.showDebugResult('frontend-test-result', 
                    `📊 フロントエンド状態:\n${JSON.stringify(data, null, 2)}`, 'success');
            } else {
                throw new Error('フロントエンド状態取得失敗');
            }
            
        } catch (error) {
            this.debugLog(`❌ フロントエンド状態取得失敗: ${error.message}`);
            this.showDebugResult('frontend-test-result', 
                `❌ フロントエンド状態取得失敗\nエラー: ${error.message}`, 'error');
        }
    }

    // 感情分析デバッグ
    analyzeEmotion() {
        const text = document.getElementById('debug-emotion-text').value.trim();
        
        if (!text) {
            this.showDebugResult('emotion-debug-result', 
                '❌ テスト用テキストを入力してください', 'error');
            return;
        }

        this.debugLog(`🧠 感情分析テスト: "${text}"`);
        
        // フロントエンドの感情分析を実行するコマンドを送信
        this.executeOnFrontend(`
            if (window.EmotionAnalyzer) {
                const result = window.EmotionAnalyzer.directAnalyze('${text}');
                console.log('感情分析結果:', result);
                return result;
            } else {
                return { error: '感情分析エンジンが見つかりません' };
            }
        `).then(result => {
            if (result.error) {
                this.showDebugResult('emotion-debug-result', 
                    `❌ ${result.error}`, 'error');
            } else {
                this.showDebugResult('emotion-debug-result', 
                    `✅ 感情分析結果:\n感情: ${result.emotion}\n信頼度: ${result.confidence}\n詳細: ${JSON.stringify(result, null, 2)}`, 'success');
            }
        });
    }

    runEmotionTests() {
        this.debugLog('🧪 感情分析テストスイート実行中...');
        
        const testCases = [
            { text: '嬉しいです！とても幸せな気分です！', expected: 'happy' },
            { text: 'えー！びっくりしました！', expected: 'surprised' },
            { text: 'う～ん、考えてみましょう', expected: 'thinking' },
            { text: '残念ですが、うまくいきませんでした', expected: 'sad' },
            { text: 'それは許せません！怒ります！', expected: 'angry' }
        ];

        this.executeOnFrontend(`
            if (window.EmotionAnalyzer) {
                const testCases = ${JSON.stringify(testCases)};
                const results = [];
                
                testCases.forEach(test => {
                    const result = window.EmotionAnalyzer.directAnalyze(test.text);
                    results.push({
                        text: test.text,
                        expected: test.expected,
                        actual: result.emotion,
                        confidence: result.confidence,
                        success: result.emotion === test.expected
                    });
                });
                
                return results;
            } else {
                return { error: '感情分析エンジンが見つかりません' };
            }
        `).then(results => {
            if (results.error) {
                this.showDebugResult('emotion-debug-result', 
                    `❌ ${results.error}`, 'error');
            } else {
                const successCount = results.filter(r => r.success).length;
                const report = results.map(r => 
                    `${r.success ? '✅' : '❌'} "${r.text}"\n   期待: ${r.expected}, 実際: ${r.actual} (信頼度: ${r.confidence})`
                ).join('\n\n');
                
                this.showDebugResult('emotion-debug-result', 
                    `🧪 感情分析テスト結果 (${successCount}/${results.length} 成功)\n\n${report}`, 
                    successCount === results.length ? 'success' : 'warning');
            }
        });
    }

    checkEmotionKeywords() {
        this.debugLog('📝 感情キーワード確認中...');
        
        this.executeOnFrontend(`
            if (window.EmotionAnalyzer && window.EmotionAnalyzer.emotionKeywords) {
                const keywords = window.EmotionAnalyzer.emotionKeywords;
                const summary = {};
                
                for (const [emotion, data] of Object.entries(keywords)) {
                    summary[emotion] = {
                        count: data.keywords.length,
                        samples: data.keywords.slice(0, 5)
                    };
                }
                
                return summary;
            } else {
                return { error: '感情キーワード辞書が見つかりません' };
            }
        `).then(result => {
            if (result.error) {
                this.showDebugResult('emotion-debug-result', 
                    `❌ ${result.error}`, 'error');
            } else {
                const report = Object.entries(result).map(([emotion, data]) => 
                    `${emotion}: ${data.count}個 (例: ${data.samples.join(', ')})`
                ).join('\n');
                
                this.showDebugResult('emotion-debug-result', 
                    `📝 感情キーワード辞書:\n\n${report}`, 'success');
            }
        });
    }

    // Live2Dデバッグ
    checkLive2DStatus() {
        this.debugLog('🎭 Live2D状態確認中...');
        
        this.executeOnFrontend(`
            const status = {
                Live2DController: !!window.Live2DController,
                isAvailable: window.Live2DController ? window.Live2DController.isAvailable() : false,
                currentModel: !!window.currentModel,
                PIXI: !!window.PIXI,
                app: !!window.app
            };
            
            if (window.Live2DController && window.Live2DController.isAvailable()) {
                status.currentExpression = window.Live2DController.getCurrentExpressionState();
            }
            
            return status;
        `).then(status => {
            const report = Object.entries(status).map(([key, value]) => 
                `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
            ).join('\n');
            
            const isHealthy = status.Live2DController && status.isAvailable && status.currentModel;
            
            this.showDebugResult('live2d-debug-result', 
                `🎭 Live2D システム状態:\n\n${report}`, 
                isHealthy ? 'success' : 'warning');
        });
    }

    testLive2DExpressions() {
        this.debugLog('😊 Live2D表情テスト実行中...');
        
        const expressions = ['smile', 'surprised', 'sad', 'angry', 'normal'];
        
        this.executeOnFrontend(`
            if (window.Live2DController && window.Live2DController.isAvailable()) {
                const expressions = ${JSON.stringify(expressions)};
                const results = [];
                
                expressions.forEach(expr => {
                    try {
                        window.Live2DController.setExpression(expr);
                        results.push({ expression: expr, success: true });
                    } catch (error) {
                        results.push({ expression: expr, success: false, error: error.message });
                    }
                });
                
                return results;
            } else {
                return { error: 'Live2D Controller が利用できません' };
            }
        `).then(results => {
            if (results.error) {
                this.showDebugResult('live2d-debug-result', 
                    `❌ ${results.error}`, 'error');
            } else {
                const report = results.map(r => 
                    `${r.success ? '✅' : '❌'} ${r.expression}${r.error ? ` (${r.error})` : ''}`
                ).join('\n');
                
                this.showDebugResult('live2d-debug-result', 
                    `😊 Live2D表情テスト結果:\n\n${report}`, 'success');
            }
        });
    }

    testLive2DMotions() {
        this.debugLog('💃 Live2Dモーションテスト実行中...');
        
        const motions = ['idle', 'tap', 'flick'];
        
        this.executeOnFrontend(`
            if (window.Live2DController && window.Live2DController.isAvailable()) {
                const motions = ${JSON.stringify(motions)};
                const results = [];
                
                motions.forEach(motion => {
                    try {
                        window.Live2DController.startRandomMotion(motion);
                        results.push({ motion: motion, success: true });
                    } catch (error) {
                        results.push({ motion: motion, success: false, error: error.message });
                    }
                });
                
                return results;
            } else {
                return { error: 'Live2D Controller が利用できません' };
            }
        `).then(results => {
            if (results.error) {
                this.showDebugResult('live2d-debug-result', 
                    `❌ ${results.error}`, 'error');
            } else {
                const report = results.map(r => 
                    `${r.success ? '✅' : '❌'} ${r.motion}${r.error ? ` (${r.error})` : ''}`
                ).join('\n');
                
                this.showDebugResult('live2d-debug-result', 
                    `💃 Live2Dモーションテスト結果:\n\n${report}`, 'success');
            }
        });
    }

    // システム統合テスト
    runQuickTest() {
        this.debugLog('⚡ クイックシステムテスト実行中...');
        
        // 簡単なシステムチェックを実行
        Promise.all([
            this.testBackendHealth(),
            this.testFrontendConnection(),
            this.checkSystemComponents()
        ]).then(() => {
            this.debugLog('✅ クイックテスト完了');
        }).catch(error => {
            this.debugLog(`❌ クイックテストエラー: ${error.message}`);
        });
    }

    async runFullSystemTest() {
        this.debugLog('🏁 完全システムテスト開始...');
        
        try {
            // 1. バックエンド接続確認
            await this.testBackendHealth();
            
            // 2. フロントエンド接続確認
            await this.testFrontendConnection();
            
            // 3. システムコンポーネント確認
            await this.checkSystemComponents();
            
            // 4. 感情分析テスト
            this.runEmotionTests();
            
            // 5. Live2D状態確認
            this.checkLive2DStatus();
            
            this.debugLog('🎉 完全システムテスト完了');
            this.showDebugResult('system-test-result', 
                '🎉 完全システムテスト完了\n全てのコンポーネントをチェックしました。', 'success');
                
        } catch (error) {
            this.debugLog(`❌ システムテストエラー: ${error.message}`);
            this.showDebugResult('system-test-result', 
                `❌ システムテストエラー: ${error.message}`, 'error');
        }
    }

    async testBackendHealth() {
        const response = await fetch(`${this.apiBase}/health`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('バックエンドヘルスチェック失敗');
        }
        
        this.debugLog('✅ バックエンド接続正常');
        return true;
    }

    async checkSystemComponents() {
        this.debugLog('🔍 システムコンポーネント確認中...');
        
        const components = {
            frontend: 'http://localhost:8080',
            backend: 'http://localhost:3001',
            admin: 'http://localhost:8081'
        };
        
        const results = {};
        
        for (const [name, url] of Object.entries(components)) {
            try {
                const response = await fetch(url, { 
                    method: 'HEAD', 
                    mode: 'no-cors',
                    cache: 'no-cache'
                });
                results[name] = 'OK';
            } catch (error) {
                results[name] = 'ERROR';
            }
        }
        
        const report = Object.entries(results).map(([name, status]) => 
            `${status === 'OK' ? '✅' : '❌'} ${name}: ${status}`
        ).join('\n');
        
        this.showDebugResult('system-test-result', 
            `🔍 システムコンポーネント状態:\n\n${report}`, 'info');
        
        this.debugLog('✅ システムコンポーネント確認完了');
    }

    // フロントエンドでコードを実行するヘルパー関数
    async executeOnFrontend(code) {
        try {
            // WebSocket接続が利用可能な場合は使用
            if (window.adminWsClient && window.adminWsClient.isConnected()) {
                this.debugLog('🔌 WebSocket経由でフロントエンドにコマンド送信中...');
                return await window.adminWsClient.executeOnFrontend(code);
            } else {
                // WebSocketが利用できない場合はHTTP APIを使用（レガシー）
                this.debugLog('📡 HTTP API経由でフロントエンドコマンド送信中...');
                
                const response = await fetch(`${this.apiBase}/system/execute-frontend`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ command: code })
                });

                if (!response.ok) {
                    throw new Error('HTTP API経由のコマンド送信に失敗しました');
                }

                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'コマンド実行に失敗しました');
                }

                // HTTP API経由の場合は制限された結果を返す
                return { 
                    note: 'HTTP API経由で送信されました。リアルタイム実行結果はWebSocket接続時に利用可能です。',
                    requestId: data.requestId,
                    command: code
                };
            }
        } catch (error) {
            this.debugLog(`❌ フロントエンド実行エラー: ${error.message}`);
            return { error: error.message };
        }
    }

    // WebSocket再接続
    reconnectWebSocket() {
        this.debugLog('🔄 WebSocket再接続を開始中...');
        
        if (window.adminWsClient) {
            try {
                // WebSocketクライアントの再接続メソッドを呼び出し
                window.adminWsClient.reconnect();
                this.debugLog('✅ WebSocket再接続コマンド送信完了');
                
                // 接続状況の更新タイマーを設定
                setTimeout(() => {
                    if (window.adminWsClient.isConnected()) {
                        this.debugLog('🎉 WebSocket再接続成功！');
                        this.showDebugResult('websocket-reconnect-result', 
                            '✅ WebSocket再接続成功\n管理画面とフロントエンド間のリアルタイム通信が復旧しました。', 'success');
                    } else {
                        this.debugLog('⚠️ WebSocket再接続は処理中です...');
                        this.showDebugResult('websocket-reconnect-result', 
                            '⚠️ WebSocket再接続中...\n接続完了まで少々お待ちください。', 'warning');
                    }
                }, 2000);
                
            } catch (error) {
                this.debugLog(`❌ WebSocket再接続エラー: ${error.message}`);
                this.showDebugResult('websocket-reconnect-result', 
                    `❌ WebSocket再接続失敗\nエラー: ${error.message}`, 'error');
            }
        } else {
            this.debugLog('❌ WebSocketクライアントが見つかりません');
            this.showDebugResult('websocket-reconnect-result', 
                '❌ WebSocketクライアントが初期化されていません\nページをリロードしてください。', 'error');
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});
