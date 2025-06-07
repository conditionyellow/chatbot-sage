/**
 * 感情分析とLive2Dモーション制御
 * チャットボットの返答内容から感情を判定し、Live2Dのモーションと表情をリアルタイムで変更
 */

console.log('🧠 感情分析エンジン読み込み開始');

// 感情キーワード辞書
const emotionKeywords = {
    happy: {
        keywords: ['嬉しい', 'うれしい', '楽しい', 'たのしい', '喜ぶ', 'よろこぶ', '素晴らしい', 'すばらしい', 
                  'ワクワク', 'わくわく', '最高', 'さいこう', 'やった', 'おめでとう', '祝福', 'しゅくふく',
                  '笑顔', 'えがお', '笑', 'わら', '幸せ', 'しあわせ', '満足', 'まんぞく', '感激', 'かんげき',
                  'グッド', 'ナイス', 'いいね', '良い', 'よい', '愛', 'あい', 'ハッピー', 'ラッキー'],
        expression: 'Smile',
        motions: ['Idle'], // アイドルモーション
        intensity: 0.8
    },
    surprised: {
        keywords: ['驚き', 'おどろき', 'びっくり', 'ビックリ', '意外', 'いがい', 'まさか', 'え？', 'えー',
                  'なんと', '想像', 'そうぞう', '予想外', 'よそうがい', 'すごい', 'スゴイ', '信じられない',
                  'しんじられない', 'マジで', 'まじで', '本当', 'ほんとう', 'ホント', 'うそ', 'ウソ',
                  'わあ', 'わー', 'おお', 'オオ', '衝撃', 'しょうげき'],
        expression: 'Surprised',
        motions: ['Tap'], // タップモーション
        intensity: 0.9
    },
    sad: {
        keywords: ['悲しい', 'かなしい', '辛い', 'つらい', '苦しい', 'くるしい', '残念', 'ざんねん',
                  'がっかり', 'ショック', 'しょっく', '落ち込む', 'おちこむ', '憂鬱', 'ゆううつ',
                  '泣く', 'なく', '涙', 'なみだ', '寂しい', 'さびしい', '孤独', 'こどく', '心配', 'しんぱい',
                  '不安', 'ふあん', '疲れ', 'つかれ', 'だるい', 'ダルイ', '申し訳', 'もうしわけ',
                  'ごめん', 'すみません', '失敗', 'しっぱい'],
        expression: 'Sad',
        motions: ['FlickDown@Body'], // 下向きフリック
        intensity: 0.7
    },
    angry: {
        keywords: ['怒り', 'いかり', '腹立つ', 'はらだつ', 'ムカつく', 'むかつく', 'イライラ', 'いらいら',
                  '許せない', 'ゆるせない', '最悪', 'さいあく', '嫌', 'いや', 'ダメ', 'だめ', '駄目',
                  '問題', 'もんだい', '困る', 'こまる', 'うざい', 'ウザイ', 'バカ', 'ばか', 'アホ',
                  '頭にくる', 'あたまにくる', 'ふざけるな', 'やめろ', 'やめて', '迷惑', 'めいわく'],
        expression: 'Angry',
        motions: ['Flick@Body'], // ボディフリック
        intensity: 0.6
    },
    neutral: {
        keywords: ['こんにちは', 'おはよう', 'こんばんは', 'はじめまして', 'よろしく', 'ありがとう',
                  'どうぞ', 'なるほど', 'そうですね', 'わかりました', 'はい', 'いいえ', '普通', 'ふつう'],
        expression: 'Normal',
        motions: ['Idle'], // 基本アイドルモーション
        intensity: 0.5
    },
    excited: {
        keywords: ['興奮', 'こうふん', 'テンション', 'てんしょん', '盛り上がる', 'もりあがる', 'エキサイト',
                  'やる気', 'やるき', '元気', 'げんき', 'パワー', 'ぱわー', '活力', 'かつりょく',
                  'アドレナリン', 'あどれなりん', '勢い', 'いきおい', '熱い', 'あつい', '燃える', 'もえる'],
        expression: 'Smile',
        motions: ['FlickUp@Head'], // 頭上フリック
        intensity: 0.9
    },
    thinking: {
        keywords: ['考える', 'かんがえる', '思考', 'しこう', '悩む', 'なやむ', '迷う', 'まよう',
                  'わからない', '分からない', '判断', 'はんだん', '検討', 'けんとう', '思う', 'おもう',
                  'どうしよう', 'う～ん', 'うーん', 'ん～', 'んー', '難しい', 'むずかしい'],
        expression: 'Normal',
        motions: ['Tap@Head'], // 頭タップ
        intensity: 0.6
    }
};

// 感情分析メイン関数
function analyzeEmotion(text) {
    if (!text || typeof text !== 'string') {
        return { emotion: 'neutral', confidence: 0.5, keywords: [] };
    }

    const results = {};
    const foundKeywords = [];

    // 各感情カテゴリーでキーワードマッチングを実行
    for (const [emotionName, emotionData] of Object.entries(emotionKeywords)) {
        let score = 0;
        const matchedKeywords = [];

        emotionData.keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = text.match(regex);
            if (matches) {
                score += matches.length * emotionData.intensity;
                matchedKeywords.push(keyword);
                foundKeywords.push({ keyword, emotion: emotionName, count: matches.length });
            }
        });

        if (score > 0) {
            results[emotionName] = {
                score: score,
                keywords: matchedKeywords,
                expression: emotionData.expression,
                motions: emotionData.motions
            };
        }
    }

    // 最も高いスコアの感情を選択
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    let selectedData = emotionKeywords.neutral;

    for (const [emotion, data] of Object.entries(results)) {
        if (data.score > maxScore) {
            maxScore = data.score;
            dominantEmotion = emotion;
            selectedData = data;
        }
    }

    // 信頼度計算（0.0-1.0）
    const confidence = Math.min(maxScore / 3.0, 1.0); // 3つ以上のキーワードで最大信頼度

    console.log('🧠 感情分析結果:', {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        emotion: dominantEmotion,
        confidence: confidence.toFixed(2),
        score: maxScore,
        keywords: foundKeywords
    });

    return {
        emotion: dominantEmotion,
        confidence: confidence,
        expression: selectedData.expression,
        motions: selectedData.motions,
        keywords: foundKeywords
    };
}

// Live2Dモーション再生関数
async function playEmotionMotion(motionName) {
    if (!window.Live2DController || !window.Live2DController.isAvailable()) {
        console.warn('Live2D Controller が利用できません');
        return false;
    }

    try {
        // Live2DControllerの新しいplayEmotionMotionメソッドを使用
        const result = await window.Live2DController.playEmotionMotion(motionName);
        if (result) {
            console.log(`🎭 感情モーション再生成功: ${motionName}`);
            return true;
        } else {
            console.warn(`⚠️ 感情モーション再生失敗: ${motionName}`);
            return false;
        }
    } catch (error) {
        console.error('❌ 感情モーション再生エラー:', error);
        return false;
    }
}

// 感情ベースLive2D制御のメイン関数
async function applyEmotionToLive2D(text) {
    const analysis = analyzeEmotion(text);
    
    // 信頼度が低い場合は何もしない
    if (analysis.confidence < 0.3) {
        console.log('🧠 感情信頼度が低いため、Live2D変更をスキップ');
        return;
    }

    console.log(`🎭 Live2D感情制御開始: ${analysis.emotion} (信頼度: ${analysis.confidence.toFixed(2)})`);

    // 表情変更
    if (window.Live2DController && analysis.expression) {
        await window.Live2DController.setExpression(analysis.expression);
    }

    // モーション再生（感情に基づいて選択）
    if (analysis.motions && analysis.motions.length > 0) {
        await playEmotionMotion(analysis.emotion);
    }

    // 感情が強い場合は持続時間を延長
    if (analysis.confidence > 0.7) {
        setTimeout(() => {
            // 高信頼度の感情は3秒後に通常表情に戻る
            if (window.Live2DController) {
                window.Live2DController.setExpression('Normal');
            }
        }, 3000);
    }
}

// Gemini APIプロンプト拡張（オプション）
function createEmotionAwarePrompt(userMessage) {
    return `
あなたは親しみやすいAIアシスタントです。返答時に感情を表現してください。

ユーザーの質問: ${userMessage}

返答の際は、適切な感情を込めて自然に応答してください。
喜ばしい内容なら嬉しそうに、驚くべき内容なら驚いて、
悲しい内容なら共感して、問題がある内容なら適度に心配そうに応答してください。
`;
}

// 感情キーワード追加関数（動的拡張用）
function addEmotionKeywords(emotion, newKeywords) {
    if (emotionKeywords[emotion]) {
        emotionKeywords[emotion].keywords.push(...newKeywords);
        console.log(`🧠 感情キーワード追加: ${emotion} に ${newKeywords.length} 個のキーワードを追加`);
    } else {
        console.warn(`⚠️ 未知の感情カテゴリ: ${emotion}`);
    }
}

// 感情統計情報取得
function getEmotionStats() {
    const stats = {};
    for (const [emotion, data] of Object.entries(emotionKeywords)) {
        stats[emotion] = {
            keywordCount: data.keywords.length,
            intensity: data.intensity,
            expression: data.expression,
            motions: data.motions
        };
    }
    return stats;
}

// デバッグ用感情テスト関数
function testEmotion(emotion) {
    if (!window.EmotionAnalyzer) {
        console.error('感情分析エンジンが読み込まれていません');
        return;
    }
    
    const testPhrases = {
        happy: 'とても嬉しいです！素晴らしい一日ですね！',
        surprised: 'えー！本当ですか？びっくりしました！',
        sad: '悲しいことがありました。とても辛いです。',
        angry: 'それは許せません！とても腹が立ちます！',
        excited: 'やる気満々です！エキサイトしています！',
        thinking: 'う～ん、どうしようかな。難しい問題ですね。',
        neutral: 'こんにちは。よろしくお願いします。'
    };
    
    const testPhrase = testPhrases[emotion] || testPhrases.neutral;
    console.log(`🧪 感情テスト開始: ${emotion}`);
    console.log(`📝 テストフレーズ: ${testPhrase}`);
    
    window.EmotionAnalyzer.applyEmotionToLive2D(testPhrase);
}

// グローバル公開
window.EmotionAnalyzer = {
    analyzeEmotion,
    applyEmotionToLive2D,
    playEmotionMotion,
    createEmotionAwarePrompt,
    addEmotionKeywords,
    getEmotionStats,
    testEmotion // デバッグ用
};

console.log('✅ 感情分析エンジン読み込み完了');
console.log('📊 感情統計:', getEmotionStats());
