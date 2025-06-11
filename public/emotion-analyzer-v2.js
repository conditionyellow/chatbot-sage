/**
 /**
 * 感情分析とLive2Dモーション制御 v2.0
 * チャットボットの返答内容から感情を判定し、Live2Dのモーションと表情をリアルタイムで変更
 * Natoriモデル専用最適化版
 */

console.log('🧠 感情分析エンジンv2.0読み込み開始');

// 🔧 感情状態管理用グローバル変数（音声終了まで感情をキープ）
let currentEmotionState = {
    expression: 'Normal',
    isPlaying: false,
    restoreTimer: null,
    speechEndCallback: null,
    speechStartTime: null,  // 🆕 音声開始時刻を記録
    lastSetEmotion: 'Normal', // 🆕 最後に設定した感情を記録
    speechEngine: null      // 🆕 現在使用中の音声エンジンを記録
};

// 🔧 音声終了時の感情復帰処理
function scheduleEmotionRestore() {
    // 既存のタイマーをクリア
    if (currentEmotionState.restoreTimer) {
        clearTimeout(currentEmotionState.restoreTimer);
        currentEmotionState.restoreTimer = null;
    }
    
    // 音声終了時の復帰コールバックを設定（バック機能削除により簡素化）
    currentEmotionState.speechEndCallback = () => {
        console.log('🔄 音声終了通知受信');
        currentEmotionState.isPlaying = false;
    };
    
    console.log('🎭 感情復帰コールバック設定完了');
}

// 🔧 グローバル関数として公開（script.jsから呼び出し可能）
window.scheduleEmotionRestore = () => {
    console.log('🔄 感情復帰処理 - 呼び出し確認');
    
    if (currentEmotionState.speechEndCallback && typeof currentEmotionState.speechEndCallback === 'function') {
        console.log('🔄 音声終了による感情復帰処理実行');
        currentEmotionState.speechEndCallback();
    } else {
        console.warn('⚠️ 感情復帰コールバックが設定されていません');
    }
    
    // 🔧 状態確認のための追加ログ
    console.log('🔍 現在の感情状態:', {
        expression: currentEmotionState.expression,
        isPlaying: currentEmotionState.isPlaying,
        lastSetEmotion: currentEmotionState.lastSetEmotion,
        speechEngine: currentEmotionState.speechEngine,
        speechStartTime: currentEmotionState.speechStartTime,
        hasCallback: !!currentEmotionState.speechEndCallback,
        live2dAvailable: !!window.Live2DController
    });
};

// 🆕 音声再生開始通知関数
window.notifySpeechStart = (engine = 'unknown') => {
    console.log(`🎤 音声再生開始通知 - エンジン: ${engine}`);
    currentEmotionState.speechStartTime = Date.now();
    currentEmotionState.speechEngine = engine;
    currentEmotionState.isPlaying = true;
    
    console.log('🔍 音声開始時の感情状態:', {
        expression: currentEmotionState.expression,
        lastSetEmotion: currentEmotionState.lastSetEmotion,
        speechEngine: engine,
        speechStartTime: new Date(currentEmotionState.speechStartTime).toLocaleTimeString()
    });
};

// 感情キーワード辞書（Natori用最適化）
const emotionKeywords = {
    happy: {
        keywords: ['嬉しい', 'うれしい', '楽しい', 'たのしい', '喜ぶ', 'よろこぶ', '素晴らしい', 'すばらしい', 
                  'ワクワク', 'わくわく', '最高', 'さいこう', 'やった', 'おめでとう', '祝福', 'しゅくふく',
                  '笑顔', 'えがお', '幸せ', 'しあわせ', '感激', 'かんげき', 'ハッピー', 'ラッキー',
                  // 🔧 強い感情表現のみに限定（一般的すぎる単語を除去）
                  'awesome', 'wonderful', 'excellent', 'perfect', 'amazing', 'fantastic', 'brilliant',
                  'バッチリ', 'やり遂げ', 'やりとげ'],
        expressions: ['Smile', 'Blushing'],
        motions: ['Tap', 'FlickUp@Head'],
        priority: { expression: 'Smile', motion: 'Tap' },
        intensity: 0.8
    },
    surprised: {
        keywords: ['驚き', 'おどろき', 'びっくり', 'ビックリ', '意外', 'いがい', 'まさか', 'え？', 'えー',
                  'なんと', '想像', 'そうぞう', '予想外', 'よそうがい', 'すごい', 'スゴイ', '信じられない',
                  'しんじられない', 'マジで', 'まじで', '本当', 'ほんとう', 'ホント', 'うそ', 'ウソ',
                  'わあ', 'わー', 'おお', 'オオ', '衝撃', 'しょうげき',
                  // 🔧 英語・カタカナ表現を追加
                  'wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'surprise', 'astonishing',
                  'omg', 'really', 'seriously', 'no way', 'what', 'whoa', 'oh my',
                  // 🔧 よくある日本語表現を追加
                  'えぇ', 'えええ', 'マジ', 'ほんと', 'ガチ', 'やば', 'ヤバ', 'やばい', 'ヤバい',
                  '想定外', 'そうていがい', 'まじか', 'うわあ', 'へえ', 'ほう', 'なるほど'],
        expressions: ['Surprised'],
        motions: ['FlickUp@Head', 'Tap@Head'],
        priority: { expression: 'Surprised', motion: 'FlickUp@Head' },
        intensity: 0.9
    },
    sad: {
        keywords: ['悲しい', 'かなしい', '辛い', 'つらい', '苦しい', 'くるしい', '残念', 'ざんねん',
                  'がっかり', 'ショック', 'しょっく', '落ち込む', 'おちこむ', '憂鬱', 'ゆううつ',
                  '泣く', 'なく', '涙', 'なみだ', '寂しい', 'さびしい', '孤独', 'こどく', '心配', 'しんぱい',
                  '不安', 'ふあん', '疲れ', 'つかれ', 'だるい', 'ダルイ', '申し訳', 'もうしわけ',
                  'ごめん', 'すみません', '失敗', 'しっぱい'],
        expressions: ['Sad'],
        motions: ['FlickDown@Body'],
        priority: { expression: 'Sad', motion: 'FlickDown@Body' },
        intensity: 0.7
    },
    angry: {
        keywords: ['怒り', 'いかり', '怒る', 'おこる', '怒って', 'おこって', '怒った', 'おこった',
                  '腹立つ', 'はらだつ', '腹が立つ', 'はらがたつ', '腹が立ちます', 'はらがたちます',
                  'ムカつく', 'むかつく', 'ムカついた', 'むかついた', 'ムカムカ', 'むかむか',
                  'イライラ', 'いらいら', 'イライラする', 'いらいらする',
                  '許せない', 'ゆるせない', '許さない', 'ゆるさない',
                  '腹立たしい', 'はらだたしい', '最悪', 'さいあく', '嫌', 'いや', 'ダメ', 'だめ', '駄目',
                  '困る', 'こまる', 'うざい', 'ウザイ', 'バカ', 'ばか', 'アホ', 'あほ',
                  '頭にくる', 'あたまにくる', '頭に来る', 'あたまにくる', '頭にきた', 'あたまにきた',
                  'ふざけるな', 'ふざけんな', 'やめろ', 'やめて', '迷惑', 'めいわく',
                  '癪に障る', 'しゃくにさわる', '気に入らない', 'きにいらない',
                  '腹黒い', 'はらぐろい', '憤り', 'いきどおり', '憤慨', 'ふんがい',
                  // 🔧 追加のangryキーワード強化
                  '当然', 'とうぜん', '当然です', 'とうぜんです', '理不尽', 'りふじん', 
                  '理不尽な', 'りふじんな', '頭にくる', '頭にきた', '納得いかない', 'なっとくいかない',
                  '納得できない', 'なっとくできない', '不快', 'ふかい', '不愉快', 'ふゆかい',
                  '腹に据えかねる', 'はらにすえかねる', '我慢ならない', 'がまんならない', 
                  'むしゃくしゃ', 'ムシャクシャ'],
        expressions: ['Angry'],
        motions: ['Flick@Body', 'Tap'],
        priority: { expression: 'Angry', motion: 'Flick@Body' },
        intensity: 0.6
    },
    neutral: {
        keywords: ['こんにちは', 'おはよう', 'こんばんは', 'はじめまして', 'よろしく', 'ありがとう',
                  'どうぞ', 'なるほど', 'そうですね', 'わかりました', 'はい', 'いいえ', '普通', 'ふつう',
                  // 🔧 一般的な肯定的表現をneutralに分類（happyから移動）
                  'グッド', 'good', 'ナイス', 'nice', 'いいね', '良い', 'よい', 'great', 'いい感じ',
                  'ぴったり', '気分良い', 'きぶんいい', '調子良い', 'ちょうしいい', '順調', 'じゅんちょう',
                  '成功', 'せいこう', '達成', 'たっせい', '満足', 'まんぞく', 'happy', 'joy', 'glad', 
                  'pleased', 'super', '笑', 'わら', '愛', 'あい'],
        expressions: ['Normal'],
        motions: ['Idle'],
        priority: { expression: 'Normal', motion: 'Idle' },
        intensity: 0.7  // 🔧 neutralの重みを上げて優先度向上
    },
    excited: {
        keywords: ['興奮', 'こうふん', 'テンション', 'てんしょん', '盛り上がる', 'もりあがる', 'エキサイト', 'エキサイティング',
                  'やる気', 'やるき', '元気', 'げんき', 'パワー', 'ぱわー', '活力', 'かつりょく',
                  'アドレナリン', 'あどれなりん', '勢い', 'いきおい', '熱い', 'あつい', '燃える', 'もえる',
                  // 🔧 excited専用キーワードを追加
                  'エクサイト', 'ワクワク感', 'ドキドキ', 'ハイテンション', 'ノリノリ', 'フィーバー'],
        expressions: ['Smile', 'Surprised', 'Blushing'],
        motions: ['Tap', 'FlickUp@Head', 'Tap@Head'],
        priority: { expression: 'Smile', motion: 'Tap' },
        intensity: 0.9
    },
    thinking: {
        keywords: ['考える', 'かんがえる', '思考', 'しこう', '悩む', 'なやむ', '迷う', 'まよう',
                  'わからない', '分からない', '判断', 'はんだん', '検討', 'けんとう', '思う', 'おもう',
                  'どうしよう', 'う～ん', 'うーん', 'ん～', 'んー', '難しい', 'むずかしい',
                  // 🔧 英語・カタカナ表現を追加
                  'think', 'thinking', 'consider', 'wondering', 'hmm', 'let me think', 'well',
                  'difficult', 'complex', 'complicated', 'challenging', 'puzzling',
                  // 🔧 よくある日本語表現を追加
                  'うむ', 'そうね', 'そうだね', 'どうかな', 'どうだろう', 'たしかに', '確かに',
                  '複雑', 'ふくざつ', '微妙', 'びみょう', '検討', 'けんとう', '分析', 'ぶんせき',
                  'もう少し', 'もうすこし', 'ちょっと', '少し', 'すこし'],
        expressions: ['Normal', 'exp_01'],
        motions: ['Tap@Head'],  // 頭をタップする動作で「考えている」を表現
        priority: { expression: 'Normal', motion: 'Tap@Head' },
        intensity: 0.6
    }
};

// Live2D エクスプレッション・モーション利用可能性チェック
const availableLive2DAssets = {
    expressions: ['Angry', 'Blushing', 'Normal', 'Sad', 'Smile', 'Surprised', 'exp_01', 'exp_02', 'exp_03', 'exp_04', 'exp_05'],
    motionGroups: ['Idle', 'Tap', 'FlickUp@Head', 'Flick@Body', 'FlickDown@Body', 'Tap@Head']
};

// 🆕 ネガティブ感情キーワードの存在をチェックするヘルパー関数
function hasNegativeEmotion(text) {
    const negativeEmotions = ['angry', 'sad'];
    const lowerText = text.toLowerCase();
    
    for (const emotion of negativeEmotions) {
        const keywords = emotionKeywords[emotion]?.keywords || [];
        for (const keyword of keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                console.log(`🔍 ネガティブキーワード「${keyword}」を検出 (${emotion})`);
                return true;
            }
        }
    }
    return false;
}

// 感情分析メイン関数（改良版）
function analyzeEmotion(text) {
    console.log('🧠 感情分析開始:', {
        originalText: text,
        textLength: text ? text.length : 0,
        textType: typeof text,
        firstChars: text ? text.substring(0, 50) : 'null/undefined'
    });
    
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ 無効なテキスト入力:', text);
        return { emotion: 'neutral', confidence: 0.5, keywords: [], analysis: null };
    }

    const results = {};
    const foundKeywords = [];
    const textLower = text.toLowerCase();
    
    console.log('🔍 小文字変換後テキスト:', textLower.substring(0, 100));

    // 各感情カテゴリーでキーワードマッチングを実行
    for (const [emotionName, emotionData] of Object.entries(emotionKeywords)) {
        let score = 0;
        let matchCount = 0;
        const matchedKeywords = [];
        
        console.log(`🔍 ${emotionName}感情の検索開始 (${emotionData.keywords.length}キーワード)`);

        emotionData.keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = text.match(regex);
            if (matches) {
                const keywordScore = matches.length * emotionData.intensity;
                score += keywordScore;
                matchCount += matches.length;
                matchedKeywords.push({ keyword, count: matches.length, score: keywordScore });
                foundKeywords.push({ keyword, emotion: emotionName, count: matches.length });
                // 🔍 詳細デバッグ：マッチしたキーワードをログ出力
                console.log(`🎯 キーワードマッチ: "${keyword}" in "${emotionName}" (${matches.length}回, スコア:${keywordScore})`);
            }
        });

        if (score > 0) {
            console.log(`✅ ${emotionName}: スコア=${score}, マッチ数=${matchCount}`);
            results[emotionName] = {
                score: score,
                matchCount: matchCount,
                keywords: matchedKeywords,
                expressions: emotionData.expressions,
                motions: emotionData.motions,
                priority: emotionData.priority
            };
        } else {
            console.log(`❌ ${emotionName}: マッチなし`);
        }
    }

    // 最も高いスコアの感情を選択
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    let selectedData = {
        expressions: emotionKeywords.neutral.expressions,
        motions: emotionKeywords.neutral.motions,
        priority: emotionKeywords.neutral.priority
    };

    for (const [emotion, data] of Object.entries(results)) {
        if (data.score > maxScore) {
            maxScore = data.score;
            dominantEmotion = emotion;
            selectedData = data;
        }
    }

    // 🔧 キーワードマッチがない場合の文脈推測（新機能）
    if (maxScore === 0 && text.length > 10) {
        // 疑問符や感嘆符による感情推測（ただし、他の感情キーワードが存在しない場合のみ）
        if (text.includes('?') || text.includes('？')) {
            dominantEmotion = 'thinking';
            selectedData = emotionKeywords.thinking;
            maxScore = 0.3; // 低い信頼度で設定
            console.log('🤔 疑問符検出により思考感情を推測');
        } else if ((text.includes('!') || text.includes('！')) && !hasNegativeEmotion(text)) {
            // 感嘆符があっても、ネガティブな感情キーワードがある場合は excited にしない
            dominantEmotion = 'excited';
            selectedData = emotionKeywords.excited;
            maxScore = 0.4;
            console.log('🎉 感嘆符検出により興奮感情を推測（ネガティブ要素なし）');
        } else if (text.length > 50) {
            // 長いテキストは思考感情として推測
            dominantEmotion = 'thinking';
            selectedData = emotionKeywords.thinking;
            maxScore = 0.2;
            console.log('📝 長文テキストにより思考感情を推測');
        }
    }

    // 信頼度計算（0.0-1.0）- より敏感で短いテキストに対応したアルゴリズム
    const baseConfidence = Math.min(maxScore / 2.0, 1.0); // 🔧 3.0から2.0に変更（感度向上）
    const keywordDiversity = foundKeywords.length > 0 ? Math.min(foundKeywords.length / 2.0, 1.0) : 0; // 🔧 3.0から2.0に変更
    const textLengthFactor = Math.min(text.length / 50.0, 1.0); // 🔧 100.0から50.0に変更（短いテキストに対応）
    
    // 重み調整: マッチしたキーワードがある場合は基本信頼度を向上
    const keywordBonus = foundKeywords.length > 0 ? 0.2 : 0; // 🔧 新追加
    
    const confidence = (baseConfidence * 0.6) + (keywordDiversity * 0.3) + (textLengthFactor * 0.1) + keywordBonus;

    const analysisResult = {
        emotion: dominantEmotion,
        confidence: Math.min(confidence, 1.0),
        rawScore: maxScore,
        expressions: selectedData.expressions,
        motions: selectedData.motions,
        priority: selectedData.priority,
        keywords: foundKeywords,
        allResults: results
    };

    console.log('🧠 感情分析結果v2:', {
        text: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
        fullText: text, // 🔍 デバッグ用: 完全なテキスト
        emotion: dominantEmotion,
        confidence: analysisResult.confidence.toFixed(3),
        rawScore: maxScore,
        keywordCount: foundKeywords.length,
        priority: selectedData.priority,
        foundKeywords: foundKeywords, // 🔍 デバッグ用: マッチしたキーワード
        allResults: Object.keys(results) // 🔍 デバッグ用: 全感情スコア
    });

    return analysisResult;
}

// Live2D制御統合関数（エラーハンドリング強化版）
async function applyEmotionToLive2D(text, options = {}) {
    try {
        const analysis = analyzeEmotion(text);
        
        // 信頼度チェック（閾値を下げて感度向上）
        const minConfidence = options.minConfidence || 0.1; // 🔧 0.3から0.1に変更
        if (analysis.confidence < minConfidence) {
            console.log(`🧠 感情信頼度が低いため、Live2D変更をスキップ (${analysis.confidence.toFixed(3)} < ${minConfidence})`);
            return { success: false, reason: 'low_confidence', analysis };
        }

        // Live2D Controller 利用可能性チェック
        if (!window.Live2DController) {
            console.warn('⚠️ Live2D Controller が存在しません');
            return { success: false, reason: 'no_controller', analysis };
        }

        if (!window.Live2DController.isAvailable()) {
            console.warn('⚠️ Live2D Controller が利用できません');
            return { success: false, reason: 'controller_unavailable', analysis };
        }

        console.log(`🎭 Live2D感情制御開始: ${analysis.emotion} (信頼度: ${analysis.confidence.toFixed(3)})`);

        let expressionResult = false;
        let motionResult = false;

        // 表情変更（優先度順）
        if (analysis.priority?.expression) {
            try {
                if (availableLive2DAssets.expressions.includes(analysis.priority.expression)) {
                    expressionResult = await window.Live2DController.setExpression(analysis.priority.expression);
                    if (expressionResult) {
                        console.log(`✅ 表情変更成功: ${analysis.priority.expression}`);
                    }
                } else {
                    console.warn(`⚠️ 利用できない表情: ${analysis.priority.expression}`);
                }
            } catch (error) {
                console.error('❌ 表情変更エラー:', error);
            }
        }

        // モーション再生（優先度順）
        if (analysis.priority?.motion) {
            try {
                if (availableLive2DAssets.motionGroups.includes(analysis.priority.motion)) {
                    motionResult = await playMotionByGroup(analysis.priority.motion);
                    if (motionResult) {
                        console.log(`✅ モーション再生成功: ${analysis.priority.motion}`);
                    }
                } else {
                    console.warn(`⚠️ 利用できないモーション: ${analysis.priority.motion}`);
                }
            } catch (error) {
                console.error('❌ モーション再生エラー:', error);
            }
        }

        // 🔧 音声終了連動の感情制御システム（バック機能削除により簡素化）
        if (expressionResult && analysis.emotion !== 'neutral') {
            // 感情状態を記録
            currentEmotionState.expression = analysis.priority.expression;
            currentEmotionState.isPlaying = true;
            
            // 音声終了時の処理をスケジュール（復帰なし）
            scheduleEmotionRestore();
            console.log('🎭 感情表現開始');
        }

        return {
            success: expressionResult || motionResult,
            expressionResult,
            motionResult,
            analysis,
            reason: 'completed'
        };

    } catch (error) {
        console.error('❌ 感情制御総合エラー:', error);
        return { success: false, reason: 'error', error: error.message, analysis: null };
    }
}

// モーショングループ別再生関数
async function playMotionByGroup(groupName) {
    if (!window.Live2DController || !window.Live2DController.playMotion) {
        console.warn('Live2D Controller のplayMotionメソッドが利用できません');
        return false;
    }

    try {
        // Live2DControllerのplayMotionメソッドを使用
        const result = await window.Live2DController.playMotion(groupName);
        return result;
    } catch (error) {
        console.error(`モーショングループ再生エラー (${groupName}):`, error);
        return false;
    }
}

// Gemini APIプロンプト拡張（感情誘導版）
function createEmotionAwarePrompt(userMessage) {
    return `
あなたは感情豊かで親しみやすいAIアシスタントです。Live2Dキャラクターとして、適切な感情表現をしながら返答してください。

ユーザーの質問: ${userMessage}

返答時の感情表現ガイドライン：
- 嬉しい内容 → 「嬉しい」「素晴らしい」「やった」などの表現を含める
- 驚くべき内容 → 「びっくり」「すごい」「意外」などの表現を含める
- 悲しい内容 → 「残念」「悲しい」「心配」などの表現で共感する
- 問題のある内容 → 「困った」「問題」などの表現で適度に反応する
- 興奮する内容 → 「エキサイト」「やる気」「元気」などの表現を使う
- 考える内容 → 「う～ん」「考える」「難しい」などの表現を含める

自然で親しみやすい日本語で、感情を込めて応答してください。
`;
}

// 感情統計・分析関数
function getEmotionStats() {
    const stats = {
        totalEmotions: Object.keys(emotionKeywords).length,
        totalKeywords: 0,
        emotionDetails: {},
        live2dAssets: availableLive2DAssets
    };

    for (const [emotion, data] of Object.entries(emotionKeywords)) {
        stats.totalKeywords += data.keywords.length;
        stats.emotionDetails[emotion] = {
            keywordCount: data.keywords.length,
            intensity: data.intensity,
            expressions: data.expressions,
            motions: data.motions,
            priority: data.priority
        };
    }

    return stats;
}



















// 🌟 感情分析エンジンをグローバルオブジェクトとしてエクスポート
window.EmotionAnalyzer = {
    // 主要な感情分析関数
    analyzeEmotion: analyzeEmotion,
    applyEmotionToLive2D: applyEmotionToLive2D,
    
    // 感情キーワード辞書
    emotionKeywords: emotionKeywords,
    
    // ユーティリティ関数
    getEmotionStats: getEmotionStats,
    
    // モーション再生
    playMotionByGroup: playMotionByGroup,
    
    // 感情状態管理
    getCurrentEmotionState: function() {
        return { ...currentEmotionState };
    },
    
    // 音声終了通知（speech engines用）
    notifySpeechEnd: function() {
        if (currentEmotionState.speechEndCallback) {
            console.log('🎤 音声終了通知を受信');
            currentEmotionState.speechEndCallback();
            currentEmotionState.speechEndCallback = null;
        }
    }
};

// 初期化完了ログ
console.log('✅ 感情分析エンジンv2.0読み込み完了');

// 音声終了時の通知システムをグローバルに追加
window.notifySpeechEnd = function() {
    if (window.EmotionAnalyzer) {
        window.EmotionAnalyzer.notifySpeechEnd();
    }
};
