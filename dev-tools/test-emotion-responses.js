/**
 * 感情分析テスト用スクリプト
 * 様々なチャットボット応答パターンをテスト
 */

// 典型的なチャットボット応答パターン
const typicalBotResponses = [
    // Happy patterns
    "素晴らしい質問ですね！とても嬉しく思います。",
    "それは本当に良いアイデアです！",
    "おめでとうございます！成功おめでとうございます！",
    "やったー！うまくいきましたね！",
    
    // Surprised patterns  
    "えー！それは本当に驚きです！",
    "なんと！そんなことが可能なんですね！",
    "びっくりしました！想像していませんでした。",
    "まさか！信じられません！",
    
    // Thinking patterns
    "う～ん、それは興味深い質問ですね。考えてみましょう。",
    "難しい問題ですね。いくつかの要因を考慮する必要があります。",
    "そうですね...複数のアプローチが考えられます。",
    "なるほど、それについて詳しく分析してみましょう。",
    
    // Sad/Concerned patterns
    "残念ながら、その方法は推奨できません。",
    "申し訳ございませんが、そのご要望にはお応えできません。",
    "心配になります。安全性について考慮が必要です。",
    "困った状況ですね。解決策を考えてみましょう。",
    
    // Neutral patterns
    "こんにちは！何かお手伝いできることはありますか？",
    "承知いたしました。以下の通りです。",
    "はい、その通りです。詳細を説明します。",
    "わかりました。順番に説明していきましょう。",
    
    // Mixed emotional patterns
    "おぉ！それは素晴らしいアイデアですが、実装は少し複雑かもしれません。",
    "うわあ！とても興味深い結果ですね。分析してみましょう。",
    "やった！成功しましたが、まだ改善の余地があります。"
];

// 英語混じりパターン
const mixedLanguageResponses = [
    "That's amazing! 本当に素晴らしい結果ですね！",
    "Wow! びっくりしました！",
    "Hmm... それは難しい問題ですね。Let me think about it.",
    "Great job! とても良い仕事をしましたね！",
    "Oh no... 残念ながらエラーが発生しました。"
];

// テスト実行関数
function runEmotionTests() {
    console.log('🧪 === チャットボット応答感情分析テスト開始 ===');
    
    console.log('\n📊 典型的なボット応答パターンテスト:');
    const typicalResults = window.EmotionAnalyzer.batchTest(typicalBotResponses);
    
    console.log('\n🌐 英語混じり応答パターンテスト:');
    const mixedResults = window.EmotionAnalyzer.batchTest(mixedLanguageResponses);
    
    // 感情分布を分析
    console.log('\n📈 感情分布分析:');
    const allTexts = [...typicalBotResponses, ...mixedLanguageResponses];
    const distribution = window.EmotionAnalyzer.analyzeEmotionDistribution(allTexts);
    
    // 結果サマリー
    console.log('\n📋 テスト結果サマリー:');
    console.log('- 総テスト数:', allTexts.length);
    console.log('- 検出された感情:', Object.keys(distribution));
    console.log('- 最も検出されやすい感情:', Object.entries(distribution).sort((a,b) => b[1] - a[1])[0]);
    
    return { typicalResults, mixedResults, distribution };
}

// より具体的な感情テスト
function testSpecificEmotions() {
    console.log('\n🎯 === 特定感情検出テスト ===');
    
    const emotionTests = {
        happy: [
            "最高です！素晴らしい！",
            "Good job! 良い結果ですね！",
            "やったー！成功しました！"
        ],
        surprised: [
            "えー！マジですか？",
            "Wow! 信じられません！",
            "なんと！すごいことですね！"
        ],
        thinking: [
            "う～ん、考えてみましょう。",
            "Hmm... 難しい問題ですね。",
            "そうですね...検討が必要です。"
        ],
        sad: [
            "残念です...申し訳ありません。",
            "Sorry... うまくいきませんでした。",
            "困りました...問題があります。"
        ]
    };
    
    const results = {};
    for (const [emotion, texts] of Object.entries(emotionTests)) {
        console.log(`\n🎭 ${emotion.toUpperCase()}感情テスト:`);
        results[emotion] = window.EmotionAnalyzer.batchTest(texts);
    }
    
    return results;
}

// グローバルスコープに公開
if (typeof window !== 'undefined') {
    window.EmotionTestSuite = {
        runEmotionTests,
        testSpecificEmotions,
        typicalBotResponses,
        mixedLanguageResponses
    };
    console.log('✅ 感情分析テストスイート読み込み完了 - window.EmotionTestSuiteで利用可能');
}
