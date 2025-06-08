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
    
    // 音声終了時の復帰コールバックを設定
    currentEmotionState.speechEndCallback = () => {
        setTimeout(async () => {
            try {
                if (window.Live2DController) {
                    await window.Live2DController.setExpression('Normal');
                    console.log('🔄 音声終了後に表情をNormalに復元');
                    currentEmotionState.expression = 'Normal';
                    currentEmotionState.isPlaying = false;
                }
            } catch (error) {
                console.error('❌ 音声終了後の表情復元エラー:', error);
            }
        }, 500); // 音声終了後0.5秒で復帰
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
        
        // フォールバック処理：直接Normalに戻す
        setTimeout(async () => {
            try {
                if (window.Live2DController && currentEmotionState.isPlaying) {
                    console.log('🔄 フォールバック感情復帰実行');
                    const result = await window.Live2DController.setExpression('Normal');
                    console.log('🔄 フォールバック：表情をNormalに復元 -', result ? '成功' : '失敗');
                    currentEmotionState.expression = 'Normal';
                    currentEmotionState.isPlaying = false;
                } else {
                    console.log('🔄 感情復帰スキップ: Live2DController利用不可 または 感情再生中ではない');
                }
            } catch (error) {
                console.error('❌ フォールバック感情復元エラー:', error);
            }
        }, 500);
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

        // 🔧 音声終了連動の感情復帰システム（時間ベース復帰を無効化）
        if (expressionResult && analysis.emotion !== 'neutral') {
            // 感情状態を記録
            currentEmotionState.expression = analysis.priority.expression;
            currentEmotionState.isPlaying = true;
            
            // 音声終了時の復帰処理をスケジュール
            scheduleEmotionRestore();
            console.log('🎭 感情表現開始 - 音声終了まで維持');
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

// デバッグ用感情テスト関数（拡張版）
function testEmotion(emotion) {
    const testPhrases = {
        happy: 'とても嬉しいです！素晴らしい一日ですね！ハッピーな気分です！',
        surprised: 'えー！本当ですか？びっくりしました！まさかそんなことが！',
        sad: '悲しいことがありました。とても辛くて残念です。涙が出そうです。',
        angry: 'それは許せません！とても腹が立ちます！ムカつく問題ですね！',
        excited: 'やる気満々です！エキサイトしています！テンション上がってきた！',
        thinking: 'う～ん、どうしようかな。難しい問題ですね。よく考える必要があります。',
        neutral: 'こんにちは。よろしくお願いします。ありがとうございます。'
    };
    
    const testPhrase = testPhrases[emotion] || testPhrases.neutral;
    console.log(`🧪 感情テスト開始: ${emotion}`);
    console.log(`📝 テストフレーズ: ${testPhrase}`);
    
    // 詳細分析も同時に実行
    const analysis = analyzeEmotion(testPhrase);
    console.log(`🎯 分析結果:`, analysis);
    
    // Live2D制御を実行
    return window.EmotionAnalyzer.applyEmotionToLive2D(testPhrase).then(result => {
        console.log(`🎭 制御結果:`, result);
        
        // 特別な確認メッセージ
        if (emotion === 'thinking' || emotion === 'neutral') {
            console.log(`💡 ${emotion}テスト: 表情が「Normal」に変更され、モーションが「${analysis.priority?.motion}」で実行されました。`);
            console.log(`👀 期待する動作: キャラクターの表情がニュートラルになり、${emotion === 'thinking' ? '頭をタップする' : 'アイドル状態の'}モーションが再生されます。`);
        }
        
        return result;
    });
}

// 感情キーワード動的追加（改良版）
function addEmotionKeywords(emotion, newKeywords) {
    if (!emotionKeywords[emotion]) {
        console.warn(`⚠️ 未知の感情カテゴリ: ${emotion}`);
        return false;
    }
    
    if (!Array.isArray(newKeywords)) {
        console.warn('⚠️ キーワードは配列で指定してください');
        return false;
    }
    
    const beforeCount = emotionKeywords[emotion].keywords.length;
    emotionKeywords[emotion].keywords.push(...newKeywords);
    const afterCount = emotionKeywords[emotion].keywords.length;
    
    console.log(`🧠 感情キーワード追加: ${emotion} (${beforeCount} → ${afterCount})`);
    return true;
}

// 感情分析結果の詳細ログ
function logEmotionAnalysis(text) {
    const analysis = analyzeEmotion(text);
    console.group('🔍 詳細感情分析結果');
    console.log('📝 入力テキスト:', text);
    console.log('🎯 判定感情:', analysis.emotion);
    console.log('📊 信頼度:', analysis.confidence.toFixed(3));
    console.log('🔢 生スコア:', analysis.rawScore);
    console.log('🎭 優先表情:', analysis.priority?.expression);
    console.log('🎬 優先モーション:', analysis.priority?.motion);
    console.log('🏷️ 検出キーワード:', analysis.keywords);
    console.log('📈 全結果:', analysis.allResults);
    console.groupEnd();
    return analysis;
}

// Live2D状態確認関数
function checkLive2DStatus() {
    console.group('🎭 Live2D状態確認');
    console.log('Live2DController利用可能:', !!window.Live2DController);
    console.log('Live2D初期化状態:', window.Live2DController?.isAvailable());
    console.log('現在のモデル:', !!window.currentModel);
    
    if (window.Live2DController && window.Live2DController.isAvailable()) {
        // 現在の表情を確認
        console.log('現在の表情:', window.currentModel ? '設定済み' : '未設定');
        
        // 利用可能な表情とモーションを表示
        console.log('利用可能な表情:', availableLive2DAssets.expressions);
        console.log('利用可能なモーション:', availableLive2DAssets.motionGroups);
    } else {
        console.warn('⚠️ Live2Dが利用できません');
    }
    console.groupEnd();
}

// 🔧 デバッグ用: angry感情のテスト関数（詳細版）
window.testAngryEmotion = async function(testText = "それは許せません！とても腹が立ちます！") {
    console.log('🔴 Angry感情テスト開始:', testText);
    
    // 感情分析をテスト
    const analysis = analyzeEmotion(testText);
    console.log('🔍 分析結果:', analysis);
    
    if (analysis.emotion === 'angry') {
        console.log('✅ Angry感情の検出成功');
        console.log('🎭 表情設定:', analysis.priority.expression);
        console.log('🎬 モーション設定:', analysis.priority.motion);
        
        // Live2D表情変更をテスト
        if (window.Live2DController) {
            try {
                console.log('🎭 Live2D表情変更実行中...');
                const result = await window.Live2DController.setExpression(analysis.priority.expression);
                console.log('🎭 表情変更結果:', result, '(', analysis.priority.expression, ')');
                
                // 実際に設定された表情を確認
                if (window.currentModel && window.currentModel.internalModel) {
                    const settings = window.currentModel.internalModel.settings;
                    if (settings && settings.expressions) {
                        console.log('🔍 利用可能な表情:', settings.expressions.map(exp => exp.Name || exp.name));
                        
                        // 現在の表情状態をチェック
                        setTimeout(() => {
                            console.log('🔍 現在の表情状態:', window.Live2DController ? 'Live2DController利用可能' : 'Live2DController利用不可');
                            if (window.currentModel && window.currentModel.internalModel) {
                                console.log('🔍 モデル状態:', {
                                    modelLoaded: !!window.currentModel,
                                    internalModel: !!window.currentModel.internalModel,
                                    expressionManager: !!window.currentModel.internalModel.expressionManager
                                });
                            }
                        }, 1000);
                    }
                }
            } catch (error) {
                console.error('❌ 表情変更エラー:', error);
            }
        } else {
            console.warn('⚠️ Live2DController が存在しません');
        }
    } else {
        console.warn('⚠️ Angry感情が検出されませんでした。実際の感情:', analysis.emotion);
        console.log('🔍 全感情スコア:', analysis.allResults);
    }
    
    return analysis;
};

// 🔧 デバッグ用: 直接表情変更テスト
window.testDirectExpression = async function(expressionName = 'Angry') {
    console.log('🎭 直接表情変更テスト:', expressionName);
    
    if (window.Live2DController) {
        try {
            const result = await window.Live2DController.setExpression(expressionName);
            console.log('🎭 直接表情変更結果:', result, '(', expressionName, ')');
            return result;
        } catch (error) {
            console.error('❌ 直接表情変更エラー:', error);
            return false;
        }
    } else {
        console.warn('⚠️ Live2DController が存在しません');
        return false;
    }
};

// 🔧 デバッグ用: 感情→表情のフローテスト
window.testEmotionFlow = async function(testText = "それは許せません！") {
    console.log('🔄 感情→表情フローテスト開始:', testText);
    
    try {
        // ステップ1: 感情分析
        console.log('📊 ステップ1: 感情分析');
        const analysis = analyzeEmotion(testText);
        console.log('結果:', analysis);
        
        // ステップ2: Live2D制御
        console.log('🎭 ステップ2: Live2D制御');
        const live2dResult = await applyEmotionToLive2D(testText);
        console.log('結果:', live2dResult);
        
        // ステップ3: 状態確認
        console.log('🔍 ステップ3: 状態確認');
        setTimeout(() => {
            if (window.currentModel) {
                console.log('現在のモデル状態: 読み込み済み');
                if (window.currentModel.internalModel && window.currentModel.internalModel.settings) {
                    console.log('利用可能な表情数:', window.currentModel.internalModel.settings.expressions.length);
                }
            } else {
                console.log('現在のモデル状態: 未読み込み');
            }
        }, 500);
        
        return { analysis, live2dResult };
    } catch (error) {
        console.error('❌ フローテストエラー:', error);
        return { error };
    }
};

// 🔧 デバッグ用: 全感情テスト関数
window.testAllEmotions = async function() {
    const testTexts = {
        happy: '素晴らしい！とても嬉しいです！',
        sad: '悲しいです。とても残念な気持ちです',
        angry: 'それは許せません！とても腹が立ちます！',
        surprised: 'びっくりした！まさか！',
        neutral: 'こんにちは。よろしくお願いします',
        excited: 'やった！エキサイティングです！',
        thinking: 'う～ん、考えてみますね。難しい問題ですね'
    };
    
    for (const [emotion, text] of Object.entries(testTexts)) {
        console.log(`\n🧪 ${emotion.toUpperCase()}感情テスト:`, text);
        const analysis = analyzeEmotion(text);
        console.log(`結果: ${analysis.emotion} (信頼度: ${analysis.confidence.toFixed(3)})`);
        
        if (analysis.emotion === emotion) {
            console.log('✅ 正しく検出');
        } else {
            console.warn('⚠️ 予期と異なる結果');
        }
    }
};

// 🔧 デバッグ用: 現在の状態を全て確認する関数
window.checkSystemState = function() {
    console.log('🔍 システム状態確認開始');
    
    // 1. Live2DController の状態
    console.log('1️⃣ Live2DController:', {
        exists: !!window.Live2DController,
        isAvailable: window.Live2DController ? window.Live2DController.isAvailable() : false,
        methods: window.Live2DController ? Object.keys(window.Live2DController) : []
    });
    
    // 2. currentModel の状態
    console.log('2️⃣ currentModel:', {
        exists: !!window.currentModel,
        hasInternalModel: !!(window.currentModel && window.currentModel.internalModel),
        expressionsAvailable: window.currentModel && window.currentModel.internalModel && window.currentModel.internalModel.settings ? 
            window.currentModel.internalModel.settings.expressions.length : 0
    });
    
    // 3. 感情分析システムの状態
    console.log('3️⃣ 感情分析システム:', {
        analyzeEmotionExists: !!window.analyzeEmotion,
        applyEmotionToLive2DExists: !!window.applyEmotionToLive2D,
        scheduleEmotionRestoreExists: !!window.scheduleEmotionRestore,
        currentEmotionState: currentEmotionState
    });
    
    // 4. Live2D表情状態（利用可能な場合）
    if (window.Live2DController && window.Live2DController.getCurrentExpressionState) {
        console.log('4️⃣ Live2D表情状態:', window.Live2DController.getCurrentExpressionState());
    }
    
    return {
        live2d: !!window.Live2DController,
        model: !!window.currentModel,
        emotion: !!window.analyzeEmotion,
        restore: !!window.scheduleEmotionRestore
    };
};

// 🔧 デバッグ用: angry問題のトラブルシューティング
window.troubleshootAngry = async function() {
    console.log('🔴 Angry表情問題のトラブルシューティング開始');
    
    const testText = "それは許せません！とても腹が立ちます！ムカつく！";
    
    try {
        // ステップ1: システム状態確認
        console.log('🔍 ステップ1: システム状態確認');
        const systemState = window.checkSystemState();
        
        if (!systemState.live2d) {
            console.error('❌ Live2DControllerが利用できません');
            return;
        }
        
        // ステップ2: 感情分析テスト
        console.log('🔍 ステップ2: 感情分析テスト');
        const analysis = window.analyzeEmotion(testText);
        console.log('感情分析結果:', analysis);
        
        if (analysis.emotion !== 'angry') {
            console.warn('⚠️ angry感情が検出されませんでした');
            return;
        }
        
        // ステップ3: 表情リセット
        console.log('🔍 ステップ3: 表情リセット');
        await window.Live2DController.forceResetExpression();
        
        // ステップ4: Angry表情テスト
        console.log('🔍 ステップ4: Angry表情直接テスト');
        const directResult = await window.Live2DController.setExpression('Angry');
        console.log('直接Angry表情設定結果:', directResult);
        
        // ステップ5: 表情状態確認
        console.log('🔍 ステップ5: 表情状態確認');
        setTimeout(() => {
            const state = window.Live2DController.getCurrentExpressionState();
            console.log('現在の表情状態:', state);
            
            if (state.currentExpression !== 'Angry') {
                console.warn('⚠️ Angry表情が正しく設定されていません:', state.currentExpression);
            } else {
                console.log('✅ Angry表情が正しく設定されました');
            }
        }, 1000);
        
        return { analysis, directResult };
        
    } catch (error) {
        console.error('❌ トラブルシューティングエラー:', error);
        return { error };
    }
};

// 🌟 感情分析エンジンをグローバルオブジェクトとしてエクスポート
window.EmotionAnalyzer = {
    // 主要な感情分析関数
    analyzeEmotion: analyzeEmotion,
    applyEmotionToLive2D: applyEmotionToLive2D,
    directAnalyze: analyzeEmotion,  // 直接分析用のエイリアス
    
    // 感情キーワード辞書
    emotionKeywords: emotionKeywords,
    
    // 検索とデバッグ機能
    searchKeywords: function(text, targetEmotion = null) {
        console.log(`🔍 キーワード検索: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        
        for (const [emotion, data] of Object.entries(emotionKeywords)) {
            if (targetEmotion && emotion !== targetEmotion) continue;
            
            const foundKeywords = data.keywords.filter(keyword => 
                text.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
                console.log(`  ✅ ${emotion}: [${foundKeywords.join(', ')}]`);
            }
        }
    },
    
    // バッチテスト機能
    batchTest: function(texts) {
        console.log('🧪 バッチテスト開始:', texts.length, '件のテキスト');
        const results = {};
        
        texts.forEach((text, index) => {
            const analysis = analyzeEmotion(text);
            const emotion = analysis.emotion;
            
            if (!results[emotion]) {
                results[emotion] = [];
            }
            results[emotion].push({
                index: index,
                text: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
                confidence: analysis.confidence
            });
        });
        
        console.log('📊 バッチテスト結果:', results);
        return results;
    },
    
    // 感情分布分析
    analyzeEmotionDistribution: function(texts) {
        const distribution = {};
        let totalConfidence = 0;
        
        texts.forEach(text => {
            const analysis = analyzeEmotion(text);
            const emotion = analysis.emotion;
            
            if (!distribution[emotion]) {
                distribution[emotion] = { count: 0, totalConfidence: 0 };
            }
            
            distribution[emotion].count++;
            distribution[emotion].totalConfidence += analysis.confidence;
            totalConfidence += analysis.confidence;
        });
        
        // 平均信頼度を計算
        for (const emotion in distribution) {
            distribution[emotion].averageConfidence = 
                distribution[emotion].totalConfidence / distribution[emotion].count;
            distribution[emotion].percentage = 
                (distribution[emotion].count / texts.length) * 100;
        }
        
        console.log('📈 感情分布:', distribution);
        return distribution;
    },
    
    // ユーティリティ関数
    getEmotionStats: getEmotionStats,
    testEmotion: testEmotion,
    addEmotionKeywords: addEmotionKeywords,
    logEmotionAnalysis: logEmotionAnalysis,
    checkLive2DStatus: checkLive2DStatus,
    
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
    },
    
    // デバッグ関数群
    debug: {
        testAngryEmotion: function() {
            console.log('🔥 Angry感情のテスト開始');
            return testEmotion('angry');
        },
        
        testAllEmotions: function() {
            const emotions = ['happy', 'angry', 'sad', 'surprised', 'excited', 'thinking', 'neutral'];
            console.log('🎭 全感情テスト開始');
            
            emotions.forEach((emotion, index) => {
                setTimeout(() => {
                    console.log(`▶️ ${emotion} テスト実行`);
                    testEmotion(emotion);
                }, index * 2000);
            });
        },
        
        troubleshootAngry: function() {
            return troubleshootAngry();
        }
    }
};

// 初期化完了ログ
console.log('✅ 感情分析エンジンv2.0読み込み完了');
console.log('🎯 利用可能な機能:', Object.keys(window.EmotionAnalyzer));
console.log('🧠 感情キーワード辞書:', Object.keys(emotionKeywords));

// 音声終了時の通知システムをグローバルに追加
window.notifySpeechEnd = function() {
    if (window.EmotionAnalyzer) {
        window.EmotionAnalyzer.notifySpeechEnd();
    }
};
