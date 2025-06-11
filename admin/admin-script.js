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
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});
