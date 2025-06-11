/**
 * 感情分析デバッグテスト用の明確なテキストパターン
 */

// 感情別の明確なテストケース
const clearEmotionTests = {
    happy: [
        "嬉しい！本当に嬉しいです！",
        "素晴らしい結果ですね！やった！",
        "最高の気分です！ありがとうございます！",
        "グッドジョブ！excellent work!",
        "ハッピーな気持ちになりました！"
    ],
    
    surprised: [
        "えー！びっくりしました！",
        "なんと！すごいじゃないですか！",
        "まさか！信じられません！",
        "わあ！驚きです！",
        "Wow! amazing! 本当に驚きました！"
    ],
    
    thinking: [
        "う～ん、考えてみましょう。",
        "難しい問題ですね。悩みます。",
        "そうですね...検討が必要です。",
        "Hmm... let me think about it.",
        "複雑な状況ですね。分析してみます。"
    ],
    
    sad: [
        "残念ですが、うまくいきませんでした。",
        "悲しいニュースです。申し訳ありません。",
        "困った状況ですね。心配です。",
        "Sorry... 失敗してしまいました。",
        "つらい結果になってしまいました。"
    ],
    
    angry: [
        "問題があります！困ります！",
        "これは許せません！",
        "ダメです！やめてください！",
        "迷惑な状況ですね。",
        "怒りを感じます。"
    ],
    
    excited: [
        "やる気満々です！エキサイトしています！",
        "テンション上がりますね！",
        "エネルギッシュに取り組みましょう！",
        "興奮しています！燃えますね！",
        "パワフルにいきましょう！"
    ]
};

// デバッグ用のテスト実行関数
function runClearEmotionTests() {
    console.log('🧪 === 明確な感情テストケース実行 ===\n');
    
    for (const [emotion, texts] of Object.entries(clearEmotionTests)) {
        console.log(`\n🎭 ${emotion.toUpperCase()}感情テスト:`);
        console.log('----------------------------');
        
        texts.forEach((text, index) => {
            console.log(`\nテスト${index + 1}: "${text}"`);
            
            // キーワード検索
            console.log('キーワード検索:');
            window.EmotionAnalyzer.searchKeywords(text, emotion);
            
            // 直接分析
            console.log('感情分析:');
            const result = window.EmotionAnalyzer.directAnalyze(text);
            
            const isCorrect = result.emotion === emotion;
            console.log(`結果: ${isCorrect ? '✅ 正解' : '❌ 不正解'} (期待: ${emotion}, 実際: ${result.emotion})`);
        });
    }
}

// 感情別キーワード確認関数
function checkEmotionKeywords() {
    console.log('📝 === 感情別キーワード一覧 ===\n');
    
    for (const [emotion, data] of Object.entries(window.EmotionAnalyzer.emotionKeywords)) {
        console.log(`\n${emotion.toUpperCase()} (${data.keywords.length}個):`);
        console.log(data.keywords.join(', '));
    }
}

// 単一キーワードテスト
function testSingleKeywords() {
    console.log('🔍 === 単一キーワードテスト ===\n');
    
    const testKeywords = {
        happy: ['嬉しい', 'やった', 'good', 'すばらしい'],
        surprised: ['びっくり', 'えー', 'wow', 'すごい'],
        thinking: ['う～ん', '考える', 'hmm', '難しい'],
        sad: ['残念', '悲しい', 'sorry', '申し訳'],
        angry: ['問題', '困る', '迷惑', 'ダメ'],
        excited: ['やる気', 'エキサイト', 'テンション', '燃える']
    };
    
    for (const [emotion, keywords] of Object.entries(testKeywords)) {
        console.log(`\n${emotion.toUpperCase()}キーワードテスト:`);
        
        keywords.forEach(keyword => {
            const result = window.EmotionAnalyzer.directAnalyze(keyword);
            const isCorrect = result.emotion === emotion;
            console.log(`"${keyword}" → ${result.emotion} ${isCorrect ? '✅' : '❌'} (信頼度: ${result.confidence.toFixed(3)})`);
        });
    }
}

// グローバルスコープに公開
if (typeof window !== 'undefined') {
    window.EmotionDebugger = {
        runClearEmotionTests,
        checkEmotionKeywords,
        testSingleKeywords,
        clearEmotionTests
    };
    console.log('✅ 感情分析デバッガー読み込み完了 - window.EmotionDebuggerで利用可能');
}
