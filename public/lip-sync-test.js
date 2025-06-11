/**
 * リップシンクテスト機能
 * Chloe's Advanced Lip Sync Testing Suite v1.0
 */

console.log('👄 Chloeのリップシンクテストスイート読み込み中...');

/**
 * リップシンクの基本テスト
 */
function testLipSync() {
    console.log('👄 リップシンクテスト開始');
    
    if (!window.Live2DController) {
        console.error('❌ Live2DControllerが見つかりません');
        alert('Live2Dが初期化されていません。ページを再読み込みしてください。');
        return;
    }
    
    if (!window.Live2DController.isAvailable()) {
        console.error('❌ Live2Dモデルが読み込まれていません');
        alert('Live2Dモデルがまだ読み込まれていません。しばらく待ってから再試行してください。');
        return;
    }
    
    // テスト用音声を作成（短いビープ音）
    testLipSyncWithBeep();
}

/**
 * ビープ音を使ったリップシンクテスト
 */
function testLipSyncWithBeep() {
    try {
        console.log('🔊 テスト用音声でリップシンクテスト実行');
        
        // Web Audio APIでテスト用ビープ音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 440Hzのサイン波（ラの音）を2秒間再生
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // ラの音
        oscillator.type = 'sine';
        
        // 音量エンベロープ（フェードイン・フェードアウト）
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        
        // リップシンク開始
        if (window.Live2DController.startLipSync) {
            window.Live2DController.startLipSync();
            console.log('✅ リップシンク開始');
        }
        
        // 音声再生
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 2);
        
        // 2秒後にリップシンク停止
        setTimeout(() => {
            if (window.Live2DController.stopLipSync) {
                window.Live2DController.stopLipSync();
                console.log('✅ リップシンクテスト終了');
            }
        }, 2000);
        
        console.log('🎵 2秒間のリップシンクテストを実行中...');
        
    } catch (error) {
        console.error('❌ リップシンクテストエラー:', error);
        alert('リップシンクテストでエラーが発生しました: ' + error.message);
    }
}

/**
 * マニュアルリップシンクテスト
 */
function testManualLipSync() {
    console.log('👄 マニュアルリップシンクテスト開始');
    
    if (!window.Live2DController?.setMouthParameter) {
        console.error('❌ setMouthParameter関数が見つかりません');
        return;
    }
    
    let currentOpenness = 0;
    let direction = 1;
    let testInterval;
    
    console.log('🎭 手動口パク制御テスト（5秒間）');
    
    testInterval = setInterval(() => {
        // 口の開閉を0から1の間で振動
        currentOpenness += direction * 0.1;
        
        if (currentOpenness >= 1) {
            currentOpenness = 1;
            direction = -1;
        } else if (currentOpenness <= 0) {
            currentOpenness = 0;
            direction = 1;
        }
        
        // Live2Dの口パラメータを直接制御
        if (window.Live2DController.setMouthParameter) {
            window.Live2DController.setMouthParameter(currentOpenness);
        }
        
    }, 100); // 100ms間隔
    
    // 5秒後にテスト終了
    setTimeout(() => {
        clearInterval(testInterval);
        // 口を閉じた状態に戻す
        if (window.Live2DController.setMouthParameter) {
            window.Live2DController.setMouthParameter(0);
        }
        console.log('✅ マニュアルリップシンクテスト終了');
    }, 5000);
}

/**
 * 音声解析ベースリップシンクテスト（実際の音声ファイル使用）
 */
function testAudioAnalysisLipSync() {
    console.log('🎵 音声解析ベースリップシンクテスト開始');
    
    if (!window.Live2DController?.startAudioAnalysisLipSync) {
        console.error('❌ startAudioAnalysisLipSync関数が見つかりません');
        alert('音声解析ベースリップシンク機能が利用できません');
        return;
    }
    
    // テスト用短音声（日本語）を音声合成で作成
    const testText = "こんにちは、リップシンクのテストです。";
    
    // 現在選択されている音声エンジンでテスト音声を再生
    if (window.speakText) {
        console.log('🗣️ テスト音声でリップシンク確認:', testText);
        window.speakText(testText);
    } else {
        console.error('❌ speakText関数が見つかりません');
        alert('音声合成機能が利用できません');
    }
}

/**
 * 包括的リップシンクテスト
 */
function runComprehensiveLipSyncTest() {
    console.log('🚀 包括的リップシンクテスト開始');
    
    // 1. マニュアルテスト
    console.log('📝 Step 1: マニュアルリップシンクテスト');
    testManualLipSync();
    
    // 6秒後にビープ音テスト
    setTimeout(() => {
        console.log('📝 Step 2: ビープ音リップシンクテスト');
        testLipSyncWithBeep();
    }, 6000);
    
    // 9秒後に音声解析テスト
    setTimeout(() => {
        console.log('📝 Step 3: 音声解析リップシンクテスト');
        testAudioAnalysisLipSync();
    }, 9000);
    
    console.log('⏰ 包括的テストは約15秒間実行されます');
}

/**
 * リップシンク機能の状態チェック
 */
function checkLipSyncStatus() {
    console.log('🔍 リップシンク機能状態チェック');
    
    const status = {
        live2dAvailable: !!window.Live2DController,
        modelLoaded: window.Live2DController?.isAvailable() || false,
        functions: {
            startLipSync: !!window.Live2DController?.startLipSync,
            stopLipSync: !!window.Live2DController?.stopLipSync,
            startAudioAnalysisLipSync: !!window.Live2DController?.startAudioAnalysisLipSync,
            startTimerBasedLipSync: !!window.Live2DController?.startTimerBasedLipSync,
            setMouthParameter: !!window.Live2DController?.setMouthParameter
        },
        webAudioAPI: !!(window.AudioContext || window.webkitAudioContext),
        speechSynthesis: !!window.speechSynthesis
    };
    
    console.table(status);
    console.log('🎯 利用可能な機能:', Object.entries(status.functions).filter(([key, value]) => value).map(([key]) => key));
    
    return status;
}

// グローバル公開
window.testLipSync = testLipSync;
window.testManualLipSync = testManualLipSync;
window.testAudioAnalysisLipSync = testAudioAnalysisLipSync;
window.runComprehensiveLipSyncTest = runComprehensiveLipSyncTest;
window.checkLipSyncStatus = checkLipSyncStatus;

// 開発者向けクイックアクセス
window.LipSyncTester = {
    test: testLipSync,
    manual: testManualLipSync,
    audio: testAudioAnalysisLipSync,
    comprehensive: runComprehensiveLipSyncTest,
    status: checkLipSyncStatus
};

console.log('✅ Chloeのリップシンクテストスイート読み込み完了');
console.log('💡 使用方法:');
console.log('  - window.testLipSync() - 基本テスト');
console.log('  - window.LipSyncTester.comprehensive() - 包括的テスト');
console.log('  - window.LipSyncTester.status() - 機能状態確認');
