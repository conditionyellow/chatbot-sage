/**
 * 修正内容のテスト用スクリプト
 */

// 🔧 感嘆符誤分類修正のテスト
function testExclamationFix() {
    console.group('🔧 感嘆符誤分類修正テスト');
    
    const testCases = [
        "そんなことされたら怒るのは当然です！",
        "それは許せない！",
        "ふざけるな！",
        "やったー！嬉しい！",  // これは excited であるべき
        "頑張るぞ！",          // これは excited であるべき
    ];
    
    testCases.forEach(text => {
        console.log(`\n🧪 テスト: "${text}"`);
        const analysis = window.EmotionAnalyzer.analyzeEmotion(text);
        console.log(`結果: ${analysis.emotion} (信頼度: ${analysis.confidence.toFixed(3)})`);
        
        // 怒り系のテキストで excited になっていないかチェック
        if (text.includes('怒る') || text.includes('許せない') || text.includes('ふざけるな')) {
            if (analysis.emotion === 'excited') {
                console.error(`❌ 修正失敗: 怒りの文章が excited として分類された`);
            } else {
                console.log(`✅ 修正成功: 怒りの文章が ${analysis.emotion} として正しく分類された`);
            }
        }
    });
    
    console.groupEnd();
}

// 🎭 Live2D統合テスト
async function testLive2DIntegration() {
    console.group('🎭 Live2D統合テスト');
    
    // システム状態確認
    console.log('Live2DController利用可能:', !!window.Live2DController);
    console.log('Live2D初期化状態:', window.Live2DController?.isAvailable());
    console.log('現在のモデル:', !!window.currentModel);
    
    if (!window.Live2DController?.isAvailable()) {
        console.warn('⚠️ Live2Dが利用できないため、テストをスキップします');
        console.groupEnd();
        return;
    }
    
    // 怒り表情テスト
    console.log('\n🧪 怒り表情テスト開始');
    const angryText = "それは許せません！";
    const result = await window.EmotionAnalyzer.applyEmotionToLive2D(angryText);
    console.log('感情制御結果:', result);
    
    // 表情が正しく設定されたかチェック
    setTimeout(() => {
        if (window.currentModel) {
            console.log('🔍 現在の表情状態を確認中...');
            const currentExpressionState = window.Live2DController.getCurrentExpressionState();
            console.log('現在の表情状態:', currentExpressionState);
        }
    }, 1000);
    
    console.groupEnd();
}

// 🎬 モーション再生テスト
async function testMotionPlayback() {
    console.group('🎬 モーション再生テスト');
    
    if (!window.Live2DController?.isAvailable()) {
        console.warn('⚠️ Live2Dが利用できないため、テストをスキップします');
        console.groupEnd();
        return;
    }
    
    const motionGroups = ['Idle', 'Tap', 'FlickUp@Head', 'Flick@Body', 'FlickDown@Body', 'Tap@Head'];
    
    for (const motionGroup of motionGroups) {
        console.log(`\n🧪 モーション "${motionGroup}" をテスト中...`);
        try {
            const result = await window.Live2DController.playMotion(motionGroup);
            console.log(`${result ? '✅' : '❌'} モーション "${motionGroup}": ${result ? '成功' : '失敗'}`);
            
            // 各モーション間に少し間隔を開ける
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ モーション "${motionGroup}" エラー:`, error);
        }
    }
    
    console.groupEnd();
}

// 🔄 完全なフローテスト
async function testCompleteFlow() {
    console.group('🔄 完全感情フローテスト');
    
    const testMessages = [
        "それは許せません！",
        "嬉しいです！",
        "悲しいな...",
        "びっくりした！",
        "う～ん、どうしよう",
        "こんにちは"
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`\n🧪 テスト ${i + 1}: "${message}"`);
        
        try {
            // 感情分析
            const analysis = window.EmotionAnalyzer.analyzeEmotion(message);
            console.log(`感情分析: ${analysis.emotion} (信頼度: ${analysis.confidence.toFixed(3)})`);
            
            // Live2D適用（利用可能な場合）
            if (window.Live2DController?.isAvailable()) {
                const result = await window.EmotionAnalyzer.applyEmotionToLive2D(message);
                console.log(`Live2D適用: ${result.success ? '成功' : '失敗'} (理由: ${result.reason})`);
            }
            
            // 次のテストまで間隔を開ける
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ テスト ${i + 1} エラー:`, error);
        }
    }
    
    console.groupEnd();
}

// 自動テスト実行
function runAllTests() {
    console.log('🏁 修正内容の自動テスト開始');
    
    // 感嘆符修正テスト
    testExclamationFix();
    
    // しばらく待ってからLive2Dテスト
    setTimeout(async () => {
        await testLive2DIntegration();
        
        setTimeout(async () => {
            await testMotionPlayback();
            
            setTimeout(async () => {
                await testCompleteFlow();
                console.log('🎉 全テスト完了');
            }, 3000);
        }, 3000);
    }, 2000);
}

// グローバル関数として公開
window.testExclamationFix = testExclamationFix;
window.testLive2DIntegration = testLive2DIntegration;
window.testMotionPlayback = testMotionPlayback;
window.testCompleteFlow = testCompleteFlow;
window.runAllTests = runAllTests;

console.log('🧪 修正テスト関数が読み込まれました');
console.log('使用可能な関数:');
console.log('- testExclamationFix() : 感嘆符誤分類修正のテスト');
console.log('- testLive2DIntegration() : Live2D統合テスト');
console.log('- testMotionPlayback() : モーション再生テスト');
console.log('- testCompleteFlow() : 完全フローテスト');
console.log('- runAllTests() : 全テスト自動実行');
