/**
 * Chloe's Quick Test Messages for Emotion Analysis
 * 感情分析のクイックテスト用メッセージ
 */

window.ChloeQuickTest = {
    // テスト用メッセージ
    testMessages: [
        {
            message: "今日はとても嬉しいです！素晴らしい一日でした！",
            expected: "happy",
            description: "幸せな感情テスト"
        },
        {
            message: "本当に腹が立ちます！許せません！",
            expected: "angry", 
            description: "怒りの感情テスト（感嘆符付き）"
        },
        {
            message: "とても悲しくて涙が出てきます...",
            expected: "sad",
            description: "悲しみの感情テスト"
        },
        {
            message: "えっ！本当ですか？驚きました！",
            expected: "surprised",
            description: "驚きの感情テスト"
        },
        {
            message: "怖くて震えています...助けてください",
            expected: "scared",
            description: "恐怖の感情テスト"
        },
        {
            message: "やったー！最高に楽しい！頑張るぞ！",
            expected: "excited",
            description: "興奮の感情テスト（感嘆符付き）"
        }
    ],

    // 自動メッセージ送信
    async sendTestMessage(index) {
        const testMessage = this.testMessages[index];
        if (!testMessage) {
            console.error('❌ 指定されたインデックスのテストメッセージが見つかりません:', index);
            return;
        }

        console.group(`🧪 ${testMessage.description}`);
        console.log(`📝 送信するメッセージ: "${testMessage.message}"`);
        console.log(`🎯 期待される感情: ${testMessage.expected}`);

        // ユーザー入力フィールドにメッセージを設定
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.value = testMessage.message;
            
            // 送信ボタンをクリック
            const sendButton = document.getElementById('send-button');
            if (sendButton) {
                sendButton.click();
                console.log('✅ メッセージ送信完了');
            } else {
                console.error('❌ 送信ボタンが見つかりません');
            }
        } else {
            console.error('❌ ユーザー入力フィールドが見つかりません');
        }

        console.groupEnd();
    },

    // 全テストメッセージを順番に送信
    async runAllTests(intervalMs = 5000) {
        console.log('🚀 全テストメッセージの自動送信を開始します');
        console.log(`⏱️ 送信間隔: ${intervalMs}ms`);

        for (let i = 0; i < this.testMessages.length; i++) {
            await this.sendTestMessage(i);
            
            if (i < this.testMessages.length - 1) {
                console.log(`⏳ ${intervalMs/1000}秒待機中...`);
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
        }

        console.log('🎉 全テストメッセージ送信完了！');
    },

    // テスト結果の分析
    analyzeTestResults() {
        console.group('📊 テスト結果分析');
        
        if (window.EmotionAnalyzer && window.EmotionAnalyzer.getEmotionStats) {
            const stats = window.EmotionAnalyzer.getEmotionStats();
            console.log('感情分析統計:', stats);
        }
        
        if (window.currentEmotionState) {
            console.log('現在の感情状態:', window.currentEmotionState);
        }
        
        console.groupEnd();
    },

    // UI にテストボタンを追加
    addTestButtonsToUI() {
        const debugPanel = document.getElementById('emotion-debug');
        if (!debugPanel) {
            console.warn('⚠️ デバッグパネルが見つかりません');
            return;
        }

        // 既存のテストボタンエリアを確認
        let quickTestArea = document.getElementById('quick-test-area');
        if (!quickTestArea) {
            quickTestArea = document.createElement('div');
            quickTestArea.id = 'quick-test-area';
            quickTestArea.innerHTML = `
                <h5 style="color: #ffeb3b; margin: 10px 0 8px 0; text-align: center;">🧪 クイックテスト</h5>
                <div class="quick-test-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 10px;">
                    <button onclick="window.ChloeQuickTest.sendTestMessage(0)" class="emotion-btn">😊 幸せ</button>
                    <button onclick="window.ChloeQuickTest.sendTestMessage(1)" class="emotion-btn">😠 怒り</button>
                    <button onclick="window.ChloeQuickTest.sendTestMessage(2)" class="emotion-btn">😢 悲しみ</button>
                    <button onclick="window.ChloeQuickTest.sendTestMessage(3)" class="emotion-btn">😮 驚き</button>
                    <button onclick="window.ChloeQuickTest.sendTestMessage(4)" class="emotion-btn">😰 恐怖</button>
                    <button onclick="window.ChloeQuickTest.sendTestMessage(5)" class="emotion-btn">⚡ 興奮</button>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button onclick="window.ChloeQuickTest.runAllTests()" class="stats-btn" style="font-size: 0.65rem;">🚀 全テスト</button>
                    <button onclick="window.ChloeQuickTest.analyzeTestResults()" class="stats-btn" style="font-size: 0.65rem;">📊 結果分析</button>
                </div>
            `;
            
            // 感情テストボタンエリアの後に追加
            const emotionTestButtons = debugPanel.querySelector('.emotion-test-buttons');
            if (emotionTestButtons) {
                emotionTestButtons.insertAdjacentElement('afterend', quickTestArea);
            }
        }

        console.log('✅ クイックテストボタンをUIに追加しました');
    },

    // 初期化
    init() {
        console.log('🎭 Chloe\'s Quick Test Ready!');
        
        // ページ読み込み完了後にUIボタンを追加
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.addTestButtonsToUI(), 1000);
            });
        } else {
            setTimeout(() => this.addTestButtonsToUI(), 1000);
        }
    }
};

// グローバル関数として公開
window.sendTestMessage = (index) => window.ChloeQuickTest.sendTestMessage(index);
window.runAllEmotionTests = () => window.ChloeQuickTest.runAllTests();
window.analyzeTestResults = () => window.ChloeQuickTest.analyzeTestResults();

// 自動初期化
window.ChloeQuickTest.init();

console.log('🧪 Chloe\'s Quick Test Messages Ready!');
console.log('利用可能な関数:');
console.log('- sendTestMessage(index) : 指定テストメッセージ送信');
console.log('- runAllEmotionTests() : 全テストメッセージ送信');
console.log('- analyzeTestResults() : テスト結果分析');
