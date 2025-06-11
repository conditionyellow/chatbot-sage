// 感情分析システム単体テスト用のモック機能
// 実際のGemini APIを使わずに感情分析をテストする

// テスト用のボット応答パターン
const testBotResponses = {
    angry: [
        "そんなことされたら怒るのは当然です！",
        "それは腹が立ちますね。ムカつく気持ちがよくわかります。",
        "イライラする状況ですね。許せない行為です。"
    ],
    happy: [
        "それは素晴らしいニュースですね！嬉しい！",
        "やったー！おめでとうございます！",
        "最高ですね！楽しい時間をお過ごしください！"
    ],
    sad: [
        "それは悲しいお話ですね...",
        "辛い状況ですね。落ち込む気持ちがよくわかります。",
        "寂しい思いをされているのですね。"
    ],
    surprised: [
        "えっ！それは驚きです！",
        "まさか！びっくりしました！",
        "想像もしていませんでした！驚愕です！"
    ],
    thinking: [
        "それは難しい問題ですね...考えてみます。",
        "うーん、どう対処すべきか悩ましいところです。",
        "複雑な状況ですね。慎重に検討する必要がありそうです。"
    ],
    excited: [
        "ワクワクしますね！すごく楽しみです！",
        "やる気が湧いてきますね！頑張りましょう！",
        "エネルギッシュな提案ですね！盛り上がります！"
    ],
    neutral: [
        "なるほど、そういうことですね。",
        "承知いたしました。理解できます。",
        "そうですね。適切な対応だと思います。"
    ]
};

// モックテスト関数
window.testEmotionAnalysisWithMock = function(targetEmotion = null) {
    console.log('🧪 感情分析モックテスト開始');
    
    const emotionsToTest = targetEmotion ? [targetEmotion] : Object.keys(testBotResponses);
    
    emotionsToTest.forEach((emotion, index) => {
        setTimeout(() => {
            console.log(`\n🎯 ${emotion.toUpperCase()} 感情テスト:`);
            
            testBotResponses[emotion].forEach((response, respIndex) => {
                setTimeout(() => {
                    console.log(`\n📝 テスト${respIndex + 1}: "${response}"`);
                    
                    if (window.EmotionAnalyzer) {
                        try {
                            // 感情分析実行
                            const analysis = window.EmotionAnalyzer.analyzeEmotion(response);
                            console.log(`📊 分析結果: ${analysis.emotion} (信頼度: ${analysis.confidence})`);
                            
                            // 期待結果と比較
                            if (analysis.emotion === emotion) {
                                console.log('✅ 正解！');
                            } else {
                                console.log(`❌ 不正解 (期待: ${emotion}, 実際: ${analysis.emotion})`);
                            }
                            
                            // Live2D適用テスト
                            window.EmotionAnalyzer.applyEmotionToLive2D(response).then(result => {
                                console.log(`🎭 Live2D適用: 表情=${result.expression}`);
                            });
                            
                        } catch (error) {
                            console.error('❌ テストエラー:', error);
                        }
                    } else {
                        console.error('❌ EmotionAnalyzerが利用できません');
                    }
                }, respIndex * 1000);
            });
            
        }, index * 4000);
    });
};

// 怒り感情専用テスト
window.testAngryEmotionMock = function() {
    console.log('🔥 怒り感情専用モックテスト');
    window.testEmotionAnalysisWithMock('angry');
};

// チャット送信をモックする関数
window.mockChatMessage = function(userMessage, botEmotion = 'neutral') {
    console.log(`\n👤 ユーザー: "${userMessage}"`);
    
    // ランダムに選択されたボット応答
    const responses = testBotResponses[botEmotion] || testBotResponses.neutral;
    const botResponse = responses[Math.floor(Math.random() * responses.length)];
    
    console.log(`🤖 ボット: "${botResponse}"`);
    
    // 感情分析実行 (script.jsの処理を模擬)
    if (window.EmotionAnalyzer) {
        console.log('🔧 EmotionAnalyzer存在チェック:', typeof window.EmotionAnalyzer);
        console.log('✅ EmotionAnalyzerが利用可能です');
        console.log('🔍 チャットボット応答の感情分析開始:', botResponse.substring(0, 100));
        
        try {
            // 直接分析
            const directResult = window.EmotionAnalyzer.directAnalyze(botResponse);
            console.log('📊 直接分析結果:', directResult);
            
            // Live2D適用
            window.EmotionAnalyzer.applyEmotionToLive2D(botResponse).then(emotionResult => {
                console.log('🎭 感情分析結果:', emotionResult);
            });
            
            // キーワード検索
            console.log('--- キーワード検索結果 ---');
            window.EmotionAnalyzer.searchKeywords(botResponse);
            
        } catch (error) {
            console.error('❌ 感情分析中にエラーが発生しました:', error);
        }
    } else {
        console.error('❌ EmotionAnalyzerが読み込まれていません');
    }
};

console.log('🧪 感情分析モックテストシステム読み込み完了');
console.log('📋 利用可能なテスト関数:');
console.log('  - testEmotionAnalysisWithMock(emotion) : 指定感情のテスト');
console.log('  - testAngryEmotionMock() : 怒り感情専用テスト');
console.log('  - mockChatMessage(userMsg, botEmotion) : チャット模擬');
console.log('💡 例: mockChatMessage("怒って", "angry")');
