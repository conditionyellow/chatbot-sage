// バックエンド通信クライアント
class BackendClient {
    constructor() {
        this.apiBase = 'http://localhost:3001/api';
        this.youtubeStatus = {
            isMonitoring: false,
            liveChatId: null,
            processedMessagesCount: 0
        };
        
        this.init();
    }

    async init() {
        this.setupElements();
        await this.checkYouTubeStatus();
        this.startStatusPolling();
    }

    setupElements() {
        // YouTube関連のUI要素は削除されたため、参照のみ保持（エラー防止）
        this.statusIndicator = null;
        this.statusDetails = null;
        this.videoInfo = null;
        this.messageCount = null;
    }

    async checkYouTubeStatus() {
        try {
            const response = await fetch(`${this.apiBase}/youtube/status`);
            
            if (response.ok) {
                const status = await response.json();
                this.updateYouTubeStatus(status);
            } else {
                this.updateYouTubeStatus({ isMonitoring: false });
            }
        } catch (error) {
            console.log('バックエンド接続不可 - スタンドアローンモードで動作中');
            this.updateYouTubeStatus({ isMonitoring: false });
        }
    }

    updateYouTubeStatus(status) {
        this.youtubeStatus = status;
        
        // UI要素が削除されているため、ステータス表示は管理画面でのみ行う
        // ステータス情報は内部で保持し続ける
        if (!this.statusIndicator) {
            console.log('📺 YouTube監視ステータス:', status.isMonitoring ? '監視中' : '未接続');
            return;
        }

        const statusDot = this.statusIndicator.querySelector('.status-dot');
        const statusText = this.statusIndicator.querySelector('.status-text');

        if (status.isMonitoring) {
            this.statusIndicator.className = 'status-indicator monitoring';
            statusText.textContent = '監視中';
            
            if (this.statusDetails) {
                this.statusDetails.style.display = 'block';
                if (this.videoInfo) {
                    this.videoInfo.textContent = status.liveChatId ? '接続済み' : '取得中...';
                }
                if (this.messageCount) {
                    this.messageCount.textContent = status.processedMessagesCount || 0;
                }
            }
        } else {
            this.statusIndicator.className = 'status-indicator offline';
            statusText.textContent = '未接続';
            
            if (this.statusDetails) {
                this.statusDetails.style.display = 'none';
            }
        }
    }

    startStatusPolling() {
        // 30秒ごとにステータスをチェック
        setInterval(() => {
            this.checkYouTubeStatus();
        }, 30000);
        
        // 5秒ごとにYouTubeメッセージをチェック
        setInterval(() => {
            this.checkForYouTubeMessages();
        }, 5000);
    }

    // YouTube からのメッセージ受信
    async checkForYouTubeMessages() {
        if (!this.youtubeStatus.isMonitoring) return;

        try {
            const response = await fetch(`${this.apiBase}/youtube/frontend/messages`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.messages && data.messages.length > 0) {
                    console.log('📺 YouTubeメッセージ受信:', data.messages);
                    
                    // 各メッセージをチャットに追加
                    data.messages.forEach(message => {
                        this.addYouTubeMessageToChat(message);
                    });
                }
                
                // 監視状況を更新
                this.updateYouTubeStatus({
                    ...this.youtubeStatus,
                    isMonitoring: data.isMonitoring,
                    liveChatId: data.liveChatId
                });
            }
        } catch (error) {
            console.error('YouTubeメッセージ取得エラー:', error);
        }
    }

    // YouTubeメッセージをチャットに追加する関数
    addYouTubeMessageToChat(message) {
        console.log('📺 YouTube メッセージをチャットに追加:', message);
        
        if (typeof appendMessage === 'function') {
            // YouTube専用のメッセージスタイルで追加
            const displayText = `🎥 ${message.author}: ${message.text}`;
            appendMessage('youtube', displayText);
            
            // ボットに自動応答させる
            if (typeof sendMessageToCloudFunction === 'function') {
                console.log('🤖 ボットに応答リクエスト送信:', message.text);
                // 少し遅延を入れてから応答
                setTimeout(() => {
                    sendMessageToCloudFunction(message.text, false); // 履歴に追加しない
                }, 1000);
            } else {
                console.warn('sendMessageToCloudFunction が見つかりません');
            }
        } else {
            console.warn('appendMessage 関数が見つかりません');
        }
    }

    // ヘルスチェック
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// グローバルインスタンス
let backendClient = null;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    backendClient = new BackendClient();
    
    // グローバル関数として公開（他のスクリプトから利用可能）
    window.backendClient = backendClient;
});
