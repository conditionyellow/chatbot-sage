/**
 * 感情分析とLive2Dモーション制御 v2.0
 * チャットボットの返答内容から感情を判定し、Live2Dのモーションと表情をリアルタイムで変更
 * Natoriモデル専用最適化版
 */

console.log('🧠 感情分析エンジンv2.0読み込み開始');

// 感情キーワード辞書（Natori用最適化）
const emotionKeywords = {
    happy: {
        keywords: ['嬉しい', 'うれしい', '楽しい', 'たのしい', '喜ぶ', 'よろこぶ', '素晴らしい', 'すばらしい', 
                  'ワクワク', 'わくわく', '最高', 'さいこう', 'やった', 'おめでとう', '祝福', 'しゅくふく',
                  '笑顔', 'えがお', '笑', 'わら', '幸せ', 'しあわせ', '満足', 'まんぞく', '感激', 'かんげき',
                  'グッド', 'ナイス', 'いいね', '良い', 'よい', '愛', 'あい', 'ハッピー', 'ラッキー',
                  // 🔧 英語・カタカナ表現を追加
                  'good', 'great', 'awesome', 'wonderful', 'nice', 'excellent', 'perfect', 'amazing',
                  'happy', 'joy', 'glad', 'pleased', 'excited', 'fantastic', 'brilliant', 'super',
                  // 🔧 よくある日本語表現を追加
                  'いい感じ', 'バッチリ', 'ぴったり', '気分良い', 'きぶんいい', '調子良い', 'ちょうしいい',
                  '順調', 'じゅんちょう', '成功', 'せいこう', '達成', 'たっせい', 'やり遂げ', 'やりとげ'],
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
        keywords: ['怒り', 'いかり', '腹立つ', 'はらだつ', 'ムカつく', 'むかつく', 'イライラ', 'いらいら',
                  '許せない', 'ゆるせない', '最悪', 'さいあく', '嫌', 'いや', 'ダメ', 'だめ', '駄目',
                  '問題', 'もんだい', '困る', 'こまる', 'うざい', 'ウザイ', 'バカ', 'ばか', 'アホ',
                  '頭にくる', 'あたまにくる', 'ふざけるな', 'やめろ', 'やめて', '迷惑', 'めいわく'],
        expressions: ['Angry'],
        motions: ['Flick@Body', 'Tap'],
        priority: { expression: 'Angry', motion: 'Flick@Body' },
        intensity: 0.6
    },
    neutral: {
        keywords: ['こんにちは', 'おはよう', 'こんばんは', 'はじめまして', 'よろしく', 'ありがとう',
                  'どうぞ', 'なるほど', 'そうですね', 'わかりました', 'はい', 'いいえ', '普通', 'ふつう'],
        expressions: ['Normal'],
        motions: ['Idle'],
        priority: { expression: 'Normal', motion: 'Idle' },
        intensity: 0.5
    },
    excited: {
        keywords: ['興奮', 'こうふん', 'テンション', 'てんしょん', '盛り上がる', 'もりあがる', 'エキサイト',
                  'やる気', 'やるき', '元気', 'げんき', 'パワー', 'ぱわー', '活力', 'かつりょく',
                  'アドレナリン', 'あどれなりん', '勢い', 'いきおい', '熱い', 'あつい', '燃える', 'もえる'],
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
        // 疑問符や感嘆符による感情推測
        if (text.includes('?') || text.includes('？')) {
            dominantEmotion = 'thinking';
            selectedData = emotionKeywords.thinking;
            maxScore = 0.3; // 低い信頼度で設定
            console.log('🤔 疑問符検出により思考感情を推測');
        } else if (text.includes('!') || text.includes('！')) {
            dominantEmotion = 'excited';
            selectedData = emotionKeywords.excited;
            maxScore = 0.4;
            console.log('🎉 感嘆符検出により興奮感情を推測');
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

        // 高信頼度の感情処理
        const restoreDelay = options.restoreDelay || (analysis.confidence > 0.7 ? 3000 : 2000);
        if (analysis.confidence > 0.7 && expressionResult) {
            setTimeout(async () => {
                try {
                    await window.Live2DController.setExpression('Normal');
                    console.log('🔄 表情を通常に復元');
                } catch (error) {
                    console.error('❌ 表情復元エラー:', error);
                }
            }, restoreDelay);
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

// グローバル公開（拡張版）
window.EmotionAnalyzer = {
    // コア機能
    analyzeEmotion,
    applyEmotionToLive2D,
    playMotionByGroup,
    
    // プロンプト拡張
    createEmotionAwarePrompt,
    
    // 管理・統計
    addEmotionKeywords,
    getEmotionStats,
    
    // デバッグ・テスト
    testEmotion,
    logEmotionAnalysis,
    checkLive2DStatus,  // 新しい関数を追加
    
    // データアクセス
    emotionKeywords,
    availableLive2DAssets,
    
    // バージョン情報
    version: '2.1.0',
    description: 'Natori専用最適化感情分析エンジン（デバッグ強化版）'
};

console.log('✅ 感情分析エンジンv2.0読み込み完了');
console.log('📊 感情統計:', getEmotionStats());
console.log('🎭 Live2D利用可能アセット:', availableLive2DAssets);

// グローバルスコープに感情分析機能を公開（デバッグ用）
window.EmotionAnalyzer = {
    analyzeEmotion,
    applyEmotionToLive2D,
    logEmotionAnalysis,
    checkLive2DStatus,
    addEmotionKeywords,
    getEmotionStats,
    emotionKeywords,
    
    // 🔧 新追加: 簡単なテスト関数
    testEmotion: function(text) {
        console.log('🧪 感情分析テスト開始:', text);
        const result = logEmotionAnalysis(text);
        return result;
    },
    
    // 🔧 新追加: 直接感情分析（Live2D適用なし）
    directAnalyze: function(text) {
        console.log('\n🔬 === 直接感情分析テスト ===');
        console.log('入力テキスト:', text);
        const result = analyzeEmotion(text);
        console.log('分析結果:', result);
        return result;
    },
    
    // 🔧 新追加: キーワード検索テスト
    searchKeywords: function(text, emotion = null) {
        console.log('\n🔍 === キーワード検索テスト ===');
        const targetEmotions = emotion ? [emotion] : Object.keys(emotionKeywords);
        
        targetEmotions.forEach(emo => {
            console.log(`\n--- ${emo.toUpperCase()}感情のキーワード検索 ---`);
            const keywords = emotionKeywords[emo].keywords;
            const found = [];
            
            keywords.forEach(keyword => {
                if (text.toLowerCase().includes(keyword.toLowerCase())) {
                    found.push(keyword);
                    console.log(`✅ マッチ: "${keyword}"`);
                }
            });
            
            if (found.length === 0) {
                console.log(`❌ ${emo}: マッチするキーワードなし`);
            } else {
                console.log(`🎯 ${emo}: ${found.length}個のキーワードがマッチ:`, found);
            }
        });
    },
    
    // 🔧 新追加: 複数テキストの一括テスト
    batchTest: function(texts) {
        console.log('🧪 一括感情分析テスト開始');
        const results = [];
        texts.forEach((text, index) => {
            console.log(`\n--- テスト ${index + 1}: ${text.substring(0, 30)}... ---`);
            const result = this.directAnalyze(text);
            results.push({ text, result });
        });
        return results;
    },
    
    // 🔧 新追加: 感情分布の可視化
    analyzeEmotionDistribution: function(texts) {
        const distribution = {};
        texts.forEach(text => {
            const result = analyzeEmotion(text);
            distribution[result.emotion] = (distribution[result.emotion] || 0) + 1;
        });
        console.log('📊 感情分布:', distribution);
        return distribution;
    }
};

console.log('✅ 感情分析エンジンv2.0読み込み完了 - window.EmotionAnalyzerで利用可能');
