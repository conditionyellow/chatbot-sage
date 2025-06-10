// YouTube Live Chat Integration
// Based on aituber.html implementation

class YouTubeLiveChatIntegration {
    constructor() {
        this.apiKey = '';
        this.videoId = '';
        this.checkInterval = 10; // seconds
        this.isMonitoring = false;
        this.processedMessageIds = new Map();
        this.liveChatId = null;
        this.timeoutId = null;
        this.messageLifetime = 300; // 5 minutes in seconds
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.apiKeyInput = document.getElementById('youtube-api-key');
        this.videoIdInput = document.getElementById('video-id');
        this.intervalInput = document.getElementById('chat-check-interval');
        this.connectBtn = document.getElementById('youtube-connect-btn');
        this.disconnectBtn = document.getElementById('youtube-disconnect-btn');
        this.statusSpan = document.getElementById('youtube-status');
    }

    setupEventListeners() {
        this.connectBtn.addEventListener('click', () => this.startMonitoring());
        this.disconnectBtn.addEventListener('click', () => this.stopMonitoring());
        
        // Load saved settings
        this.loadSettings();
        
        // Save settings on change
        this.apiKeyInput.addEventListener('change', () => this.saveSettings());
        this.videoIdInput.addEventListener('change', () => this.saveSettings());
        this.intervalInput.addEventListener('change', () => this.saveSettings());
    }

    loadSettings() {
        this.apiKeyInput.value = localStorage.getItem('youtube-api-key') || '';
        this.videoIdInput.value = localStorage.getItem('youtube-video-id') || '';
        this.intervalInput.value = localStorage.getItem('youtube-check-interval') || '10';
        
        // プレースホルダーを設定してガイダンスを提供
        this.apiKeyInput.placeholder = 'AIzaSy... (39文字のAPIキー)';
        this.videoIdInput.placeholder = '動画ID または https://www.youtube.com/watch?v=...';
    }

    saveSettings() {
        localStorage.setItem('youtube-api-key', this.apiKeyInput.value);
        localStorage.setItem('youtube-video-id', this.videoIdInput.value);
        localStorage.setItem('youtube-check-interval', this.intervalInput.value);
    }

    updateStatus(status, className = '') {
        this.statusSpan.textContent = status;
        this.statusSpan.className = `status-indicator ${className}`;
    }

    extractVideoId(input) {
        // Extract video ID from various YouTube URL formats
        if (!input) return '';
        
        // Direct video ID
        if (input.length === 11 && !input.includes('/')) {
            return input;
        }
        
        // YouTube URL patterns
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        
        return input; // Return as-is if no pattern matches
    }

    async startMonitoring() {
        this.apiKey = this.apiKeyInput.value.trim();
        this.videoId = this.extractVideoId(this.videoIdInput.value.trim());
        this.checkInterval = parseInt(this.intervalInput.value) || 10;

        // 入力値検証
        if (!this.apiKey) {
            this.updateStatus('API Keyが必要です', 'error');
            alert('YouTube API Keyを入力してください。\n\n設定手順:\n1. Google Cloud Console にアクセス\n2. YouTube Data API v3 を有効化\n3. APIキーを作成\n4. 課金設定を有効化');
            return;
        }

        if (this.apiKey.length < 30) {
            this.updateStatus('API Keyが短すぎます', 'error');
            alert('正しいYouTube Data API v3キーを入力してください。\nAPIキーは通常39文字です。');
            return;
        }

        if (!this.videoId) {
            this.updateStatus('動画IDが必要です', 'error');
            alert('ライブ配信のIDまたはURLを入力してください。\n\n例:\n- 動画ID: dQw4w9WgXcQ\n- URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            return;
        }

        this.saveSettings();
        
        try {
            this.updateStatus('接続中...', 'monitoring');
            this.connectBtn.style.display = 'none';
            this.disconnectBtn.style.display = 'inline-block';
            
            // Get live chat ID
            await this.getLiveChatId();
            
            if (this.liveChatId) {
                this.isMonitoring = true;
                this.updateStatus('監視中', 'monitoring');
                this.processedMessageIds.clear();
                this.startChatMonitoring();
                console.log('✅ YouTube Live Chat monitoring started successfully');
                
                // 成功メッセージを表示
                setTimeout(() => {
                    alert('✅ YouTubeライブチャット監視開始\n\nNatoriが自動的にチャットに応答します。');
                }, 500);
            }
        } catch (error) {
            console.error('❌ Failed to start monitoring:', error);
            this.updateStatus('接続失敗', 'error');
            this.resetButtons();
            
            // 詳細なエラーメッセージを表示
            let alertMessage = '❌ YouTubeライブチャット接続失敗\n\n';
            alertMessage += `エラー: ${error.message}\n\n`;
            
            if (error.message.includes('API キー')) {
                alertMessage += '解決方法:\n';
                alertMessage += '1. Google Cloud Console でプロジェクトを作成\n';
                alertMessage += '2. YouTube Data API v3 を有効化\n';
                alertMessage += '3. 課金設定を有効化\n';
                alertMessage += '4. APIキーを作成・設定\n\n';
                alertMessage += '詳細: docs/YOUTUBE_API_SETUP.md を確認';
            } else if (error.message.includes('動画')) {
                alertMessage += '解決方法:\n';
                alertMessage += '1. 正しい動画IDまたはURLを入力\n';
                alertMessage += '2. ライブ配信が進行中か確認\n';
                alertMessage += '3. チャット機能が有効か確認';
            }
            
            alert(alertMessage);
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.updateStatus('停止済み', '');
        this.resetButtons();
        console.log('YouTube Live Chat monitoring stopped');
    }

    resetButtons() {
        this.connectBtn.style.display = 'inline-block';
        this.disconnectBtn.style.display = 'none';
    }

    async getLiveChatId() {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${this.videoId}&key=${this.apiKey}`;
        
        // デバッグ情報を出力
        console.log('🔍 YouTube API デバッグ情報:');
        console.log('  動画ID:', this.videoId);
        console.log('  APIキー（最初の8文字）:', this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'なし');
        console.log('  リクエストURL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('🚫 YouTube API エラー詳細:');
                console.error('  ステータス:', response.status);
                console.error('  ステータステキスト:', response.statusText);
                console.error('  レスポンス:', errorText);
                
                let errorMessage = `YouTube API エラー (${response.status})`;
                
                if (response.status === 403) {
                    const errorData = JSON.parse(errorText);
                    console.error('  エラー詳細:', errorData);
                    
                    if (errorData.error?.message?.includes('quotaExceeded')) {
                        errorMessage = 'YouTube API の利用制限に達しました（1日10,000リクエスト）';
                    } else if (errorData.error?.message?.includes('keyInvalid')) {
                        errorMessage = 'YouTube API キーが無効です。正しいキーを設定してください';
                    } else if (errorData.error?.message?.includes('dailyLimitExceeded')) {
                        errorMessage = 'YouTube API の日次制限を超過しました';
                    } else {
                        errorMessage = 'YouTube API キーが無効か、APIが有効化されていません';
                    }
                } else if (response.status === 404) {
                    errorMessage = '指定された動画が見つかりません。動画IDを確認してください';
                } else if (response.status === 400) {
                    errorMessage = 'リクエストパラメータが不正です。動画IDとAPIキーを確認してください';
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ YouTube API レスポンス成功:', data);
            
            if (!data.items || data.items.length === 0) {
                throw new Error('動画が見つかりません。動画IDが正しいか確認してください');
            }

            if (!data.items[0].liveStreamingDetails?.activeLiveChatId) {
                console.warn('⚠️ ライブ配信詳細:', data.items[0]);
                throw new Error('この動画はライブ配信ではないか、ライブチャットが無効です');
            }

            this.liveChatId = data.items[0].liveStreamingDetails.activeLiveChatId;
            console.log('✅ Live Chat ID取得成功:', this.liveChatId);
            
        } catch (error) {
            console.error('❌ getLiveChatId エラー:', error);
            throw error;
        }
    }

    async fetchLiveChatMessages() {
        if (!this.liveChatId || !this.apiKey) return [];

        const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet&liveChatId=${this.liveChatId}&key=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Live chat fetch error:', errorText);
                return [];
            }

            const data = await response.json();
            return data.items || [];
            
        } catch (error) {
            console.error('Error fetching live chat messages:', error);
            return [];
        }
    }

    cleanupProcessedMessages() {
        const now = Date.now();
        const expiryTime = this.messageLifetime * 1000;
        
        for (const [id, timestamp] of this.processedMessageIds) {
            if (now - timestamp > expiryTime) {
                this.processedMessageIds.delete(id);
            }
        }
    }

    async selectBestComment(messages) {
        if (!messages || messages.length === 0) return null;
        
        // For now, use simple random selection
        // This can be enhanced with OpenAI integration later
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    }

    async pickBestChatMessage(messages) {
        if (!messages || messages.length === 0) return null;
        
        this.cleanupProcessedMessages();
        
        // Filter unprocessed messages
        const unprocessedMessages = messages.filter(msg => 
            !this.processedMessageIds.has(msg.id)
        );
        
        if (unprocessedMessages.length === 0) return null;
        
        // Mark all messages as processed
        messages.forEach(msg => {
            this.processedMessageIds.set(msg.id, Date.now());
        });
        
        // Select the best comment
        const selectedMessage = await this.selectBestComment(unprocessedMessages);
        
        return selectedMessage ? selectedMessage.snippet.displayMessage : null;
    }

    async startChatMonitoring() {
        if (!this.isMonitoring) return;
        
        try {
            const messages = await this.fetchLiveChatMessages();
            const selectedMessage = await this.pickBestChatMessage(messages);
            
            if (selectedMessage && this.isMonitoring) {
                console.log('Selected YouTube comment:', selectedMessage);
                
                // Add message to chat history with YouTube indicator
                this.addMessageToChat(selectedMessage, 'user-message youtube-message');
                
                // Send to chatbot for processing (without adding to history again)
                if (window.sendMessageToChatbot) {
                    window.sendMessageToChatbot(selectedMessage, false);
                }
            }
            
        } catch (error) {
            console.error('Error in chat monitoring:', error);
            this.updateStatus('エラーが発生しました', 'error');
        }
        
        // Schedule next check
        if (this.isMonitoring) {
            this.timeoutId = setTimeout(() => {
                this.startChatMonitoring();
            }, this.checkInterval * 1000);
        }
    }

    addMessageToChat(message, className = 'user-message') {
        const chatHistory = document.getElementById('chat-history');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        
        // Remove the "📺 " prefix if it exists since it's added by CSS
        const cleanMessage = message.replace(/^📺\s*/, '');
        messageDiv.textContent = cleanMessage;
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

// Toggle YouTube settings visibility
function toggleYouTubeSettings() {
    const content = document.getElementById('youtube-settings-content');
    const toggle = document.querySelector('#youtube-settings .settings-toggle');
    
    content.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
}

// YouTube設定ヘルプを表示
function showYouTubeHelp() {
    const helpMessage = `
📺 YouTube ライブチャット設定ヘルプ

🔑 1. YouTube Data API v3 キーの取得
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
① Google Cloud Console (https://console.cloud.google.com/) にアクセス
② プロジェクトを作成または選択
③ 「APIとサービス」→「ライブラリ」→「YouTube Data API v3」を有効化
④ 「APIとサービス」→「認証情報」→「APIキーを作成」
⑤ 課金設定を有効化（⚠️重要: API使用には課金が必要）

💰 料金情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 無料枠: 1日10,000リクエスト
• 超過分: 1,000リクエストあたり$1
• チャット監視: 1回につき1リクエスト消費

🎥 2. ライブ配信の準備
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• YouTube Liveで配信を開始
• チャット機能を有効にする
• 公開または限定公開に設定

🔧 3. 設定方法
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• YouTube API Key: 39文字のAPIキーを入力
• 配信ID: 動画IDまたはフルURLを入力
• チェック間隔: 5-60秒（推奨: 10-15秒）

❌ よくあるエラーと解決法
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 403エラー → 課金設定未完了、またはAPIキー無効
• 404エラー → 動画IDが間違い、またはライブ配信ではない
• 429エラー → API制限超過（翌日リセット）

詳細: docs/YOUTUBE_API_SETUP.md を参照
    `;
    
    alert(helpMessage);
}

// Initialize YouTube integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.youtubeChatIntegration = new YouTubeLiveChatIntegration();
});
