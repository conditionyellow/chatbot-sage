/**
 * Chloe's Comprehensive Test Suite for Live2D Chatbot
 * 包括的なLive2Dチャットボットテストスイート
 */

window.ChloeTestSuite = {
    testResults: {
        emotionAnalysis: { passed: 0, total: 0, details: [] },
        exclamationFix: { passed: 0, total: 0, details: [] },
        live2dIntegration: { passed: 0, total: 0, details: [] },
        motionPlayback: { passed: 0, total: 0, details: [] },
        speechSync: { passed: 0, total: 0, details: [] }
    },

    log: function(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            'info': '💬',
            'success': '✅',
            'error': '❌',
            'warn': '⚠️',
            'test': '🧪'
        }[type] || '💬';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    },

    // 感情分析基本テスト
    async testEmotionAnalysis() {
        this.log('感情分析基本テスト開始', 'test');
        
        const tests = [
            { text: "今日はとても嬉しいです", expected: 'happy', description: '喜び感情' },
            { text: "悲しくて涙が出ます", expected: 'sad', description: '悲しみ感情' },
            { text: "本当に腹が立ちます", expected: 'angry', description: '怒り感情' },
            { text: "とても驚きました", expected: 'surprised', description: '驚き感情' },
            { text: "怖くて震えています", expected: 'scared', description: '恐怖感情' },
            { text: "最高に楽しい！", expected: 'excited', description: '興奮感情' }
        ];

        let passed = 0;
        const details = [];

        for (const test of tests) {
            try {
                const result = window.EmotionAnalyzer.analyzeEmotion(test.text);
                const success = result.emotion === test.expected;
                
                if (success) passed++;
                
                const detail = {
                    test: test.description,
                    input: test.text,
                    expected: test.expected,
                    actual: result.emotion,
                    confidence: result.confidence,
                    success: success
                };
                
                details.push(detail);
                this.log(`${detail.test}: "${test.text}" → ${result.emotion} (${result.confidence.toFixed(3)}) ${success ? '✅' : '❌'}`, success ? 'success' : 'error');
                
            } catch (error) {
                details.push({
                    test: test.description,
                    input: test.text,
                    error: error.message,
                    success: false
                });
                this.log(`${test.description} エラー: ${error.message}`, 'error');
            }
        }

        this.testResults.emotionAnalysis = { passed, total: tests.length, details };
        this.log(`感情分析テスト完了: ${passed}/${tests.length} パス`, passed === tests.length ? 'success' : 'warn');
        return this.testResults.emotionAnalysis;
    },

    // 感嘆符誤分類修正テスト
    async testExclamationFix() {
        this.log('感嘆符誤分類修正テスト開始', 'test');
        
        const tests = [
            { text: "そんなことされたら怒るのは当然です！", expected: 'angry', description: '怒り+感嘆符' },
            { text: "それは許せない！", expected: 'angry', description: '怒り+感嘆符2' },
            { text: "ふざけるな！", expected: 'angry', description: '怒り+感嘆符3' },
            { text: "やったー！嬉しい！", expected: 'excited', description: '興奮+感嘆符（正常）' },
            { text: "頑張るぞ！", expected: 'excited', description: '興奮+感嘆符（正常）2' }
        ];

        let passed = 0;
        const details = [];

        for (const test of tests) {
            try {
                const result = window.EmotionAnalyzer.analyzeEmotion(test.text);
                const success = result.emotion === test.expected;
                
                if (success) passed++;
                
                const detail = {
                    test: test.description,
                    input: test.text,
                    expected: test.expected,
                    actual: result.emotion,
                    confidence: result.confidence,
                    success: success
                };
                
                details.push(detail);
                this.log(`${detail.test}: "${test.text}" → ${result.emotion} ${success ? '✅' : '❌'}`, success ? 'success' : 'error');
                
            } catch (error) {
                details.push({
                    test: test.description,
                    input: test.text,
                    error: error.message,
                    success: false
                });
                this.log(`${test.description} エラー: ${error.message}`, 'error');
            }
        }

        this.testResults.exclamationFix = { passed, total: tests.length, details };
        this.log(`感嘆符修正テスト完了: ${passed}/${tests.length} パス`, passed === tests.length ? 'success' : 'warn');
        return this.testResults.exclamationFix;
    },

    // Live2D統合テスト
    async testLive2DIntegration() {
        this.log('Live2D統合テスト開始', 'test');
        
        const tests = [
            { name: 'Live2DController存在確認', check: () => !!window.Live2DController },
            { name: 'Live2D初期化状態', check: () => window.Live2DController?.isAvailable() },
            { name: 'モデル読み込み状態', check: () => !!window.currentModel },
            { name: 'PIXI.js利用可能', check: () => !!window.PIXI },
            { name: 'Cubism Core利用可能', check: () => !!window.Live2DCubismCore }
        ];

        let passed = 0;
        const details = [];

        for (const test of tests) {
            try {
                const success = test.check();
                if (success) passed++;
                
                details.push({
                    test: test.name,
                    success: success
                });
                
                this.log(`${test.name}: ${success ? '✅' : '❌'}`, success ? 'success' : 'error');
                
            } catch (error) {
                details.push({
                    test: test.name,
                    error: error.message,
                    success: false
                });
                this.log(`${test.name} エラー: ${error.message}`, 'error');
            }
        }

        this.testResults.live2dIntegration = { passed, total: tests.length, details };
        this.log(`Live2D統合テスト完了: ${passed}/${tests.length} パス`, passed === tests.length ? 'success' : 'warn');
        return this.testResults.live2dIntegration;
    },

    // モーション再生テスト
    async testMotionPlayback() {
        this.log('モーション再生テスト開始', 'test');
        
        if (!window.Live2DController?.isAvailable()) {
            this.log('Live2Dが利用できないため、モーションテストをスキップ', 'warn');
            this.testResults.motionPlayback = { passed: 0, total: 0, details: [{ test: 'Live2D利用不可', success: false }] };
            return this.testResults.motionPlayback;
        }

        const motionTests = [
            { emotion: 'happy', motion: 'Idle', description: '幸せモーション' },
            { emotion: 'angry', motion: 'Flick@Body', description: '怒りモーション' },
            { emotion: 'surprised', motion: 'Tap@Head', description: '驚きモーション' },
            { emotion: 'sad', motion: 'FlickDown@Body', description: '悲しみモーション' }
        ];

        let passed = 0;
        const details = [];

        for (const test of motionTests) {
            try {
                // モーション再生のテスト
                const result = await window.Live2DController.setEmotion(test.emotion);
                const success = result !== false;
                
                if (success) passed++;
                
                details.push({
                    test: test.description,
                    emotion: test.emotion,
                    motion: test.motion,
                    success: success
                });
                
                this.log(`${test.description} (${test.emotion} → ${test.motion}): ${success ? '✅' : '❌'}`, success ? 'success' : 'error');
                
                // 次のテストのために少し待機
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                details.push({
                    test: test.description,
                    emotion: test.emotion,
                    error: error.message,
                    success: false
                });
                this.log(`${test.description} エラー: ${error.message}`, 'error');
            }
        }

        this.testResults.motionPlayback = { passed, total: motionTests.length, details };
        this.log(`モーション再生テスト完了: ${passed}/${motionTests.length} パス`, passed === motionTests.length ? 'success' : 'warn');
        return this.testResults.motionPlayback;
    },

    // 音声同期テスト
    async testSpeechSync() {
        this.log('音声同期テスト開始', 'test');
        
        const tests = [
            { name: '音声開始通知関数存在', check: () => typeof window.notifySpeechStart === 'function' },
            { name: '音声終了通知関数存在', check: () => typeof window.notifySpeechEnd === 'function' },
            { name: '音声合成API利用可能', check: () => 'speechSynthesis' in window },
            { name: '現在の感情状態追跡', check: () => !!window.currentEmotionState }
        ];

        let passed = 0;
        const details = [];

        for (const test of tests) {
            try {
                const success = test.check();
                if (success) passed++;
                
                details.push({
                    test: test.name,
                    success: success
                });
                
                this.log(`${test.name}: ${success ? '✅' : '❌'}`, success ? 'success' : 'error');
                
            } catch (error) {
                details.push({
                    test: test.name,
                    error: error.message,
                    success: false
                });
                this.log(`${test.name} エラー: ${error.message}`, 'error');
            }
        }

        this.testResults.speechSync = { passed, total: tests.length, details };
        this.log(`音声同期テスト完了: ${passed}/${tests.length} パス`, passed === tests.length ? 'success' : 'warn');
        return this.testResults.speechSync;
    },

    // 完全統合テスト実行
    async runCompleteTest() {
        this.log('🚀 Chloe\'s Complete Test Suite 開始', 'test');
        console.group('🎭 Live2D Chatbot Complete Test Results');
        
        const startTime = Date.now();
        
        try {
            // 各テストを順番に実行
            await this.testEmotionAnalysis();
            await this.testExclamationFix();
            await this.testLive2DIntegration();
            await this.testMotionPlayback();
            await this.testSpeechSync();
            
            // 結果サマリーを表示
            this.displayTestSummary();
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.log(`🎉 全テスト完了 (実行時間: ${duration}秒)`, 'success');
            
        } catch (error) {
            this.log(`❌ テスト実行中にエラー: ${error.message}`, 'error');
        } finally {
            console.groupEnd();
        }
    },

    // テスト結果サマリー表示
    displayTestSummary() {
        this.log('📊 テスト結果サマリー', 'info');
        
        let totalPassed = 0;
        let totalTests = 0;
        
        Object.keys(this.testResults).forEach(category => {
            const result = this.testResults[category];
            totalPassed += result.passed;
            totalTests += result.total;
            
            const percentage = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : '0.0';
            this.log(`${category}: ${result.passed}/${result.total} (${percentage}%)`, result.passed === result.total ? 'success' : 'warn');
        });
        
        const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
        this.log(`🎯 総合スコア: ${totalPassed}/${totalTests} (${overallPercentage}%)`, totalPassed === totalTests ? 'success' : 'warn');
        
        if (totalPassed === totalTests) {
            this.log('🎉 すべてのテストが正常に完了しました！', 'success');
        } else {
            this.log('⚠️ 一部のテストで問題が検出されました。詳細を確認してください。', 'warn');
        }
    },

    // 個別テスト実行用のショートカット
    async runQuickEmotionTest() {
        console.group('🧠 Quick Emotion Test');
        await this.testEmotionAnalysis();
        await this.testExclamationFix();
        console.groupEnd();
    },

    async runQuickLive2DTest() {
        console.group('🎭 Quick Live2D Test');
        await this.testLive2DIntegration();
        await this.testMotionPlayback();
        console.groupEnd();
    },

    async runQuickSyncTest() {
        console.group('🗣️ Quick Sync Test');
        await this.testSpeechSync();
        console.groupEnd();
    }
};

// グローバル関数として公開
window.runCompleteTest = () => window.ChloeTestSuite.runCompleteTest();
window.runQuickEmotionTest = () => window.ChloeTestSuite.runQuickEmotionTest();
window.runQuickLive2DTest = () => window.ChloeTestSuite.runQuickLive2DTest();
window.runQuickSyncTest = () => window.ChloeTestSuite.runQuickSyncTest();

console.log('🎭 Chloe\'s Test Suite v2.0 Ready!');
console.log('利用可能なテスト関数:');
console.log('- runCompleteTest() : 完全統合テスト');
console.log('- runQuickEmotionTest() : 感情分析テスト');
console.log('- runQuickLive2DTest() : Live2Dテスト');
console.log('- runQuickSyncTest() : 音声同期テスト');
