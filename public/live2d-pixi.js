/**
 * Live2D PIXI Integration
 * PIXI.js + pixi-live2d-display を使用した完全なLive2D実装
 */

console.log('🎭 Live2D PIXI Controller 読み込み開始');

// グローバル変数
let app = null;
let currentModel = null;
let canvas = null;
let isInitialized = false;
let currentExpression = 'Normal';
let isLipSyncActive = false;
let lipSyncTimer = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let sourceNode = null;
let lipSyncAnimationFrame = null;

// モデル設定
const modelConfig = {
    name: "Natori",
    path: "./models/natori/runtime/natori_pro_t06.model3.json",
    scale: 0.15,  // 大きなモデルに対応してさらに縮小
    position: {
        offsetX: 0,
        offsetY: -50  // 顔が見えるようにさらに下に移動
    }
};

/**
 * Live2D PIXI 初期化
 */
async function initializeLive2DPIXI() {
    console.log('🎭 Live2D PIXI 初期化開始');
    
    try {
        // ライブラリ確認
        if (!window.PIXI) {
            throw new Error('PIXI.js が読み込まれていません');
        }
        
        if (!window.PIXI.live2d) {
            throw new Error('pixi-live2d-display が読み込まれていません');
        }
        
        console.log('✅ 必要なライブラリが確認できました');
        console.log('PIXI version:', PIXI.VERSION);
        console.log('PIXI Live2D available:', !!PIXI.live2d.Live2DModel);
        
        // Canvas コンテナ取得
        const canvasContainer = document.querySelector('.live2d-container');
        if (!canvasContainer) {
            throw new Error('Canvas コンテナが見つかりません');
        }
        
        // 既存の canvas 要素を削除
        const existingCanvas = document.getElementById('live2d-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // コンテナサイズを計算（padding を考慮）
        const containerWidth = 440;  // 360px から 440px に拡大
        const containerHeight = 580; // 540px から 580px に拡大
        
        console.log(`コンテナサイズ: ${containerWidth}x${containerHeight}`);
        
        // PIXI アプリケーション作成
        app = new PIXI.Application({
            width: containerWidth,
            height: containerHeight,
            transparent: false,
            antialias: true,
            autoDensity: false,  // 自動密度調整を無効化
            resolution: 1,       // 解像度を固定
            backgroundColor: 0x333333,
            powerPreference: 'high-performance'
        });
        
        // Canvas にIDとスタイルを設定
        app.view.id = 'live2d-canvas';
        app.view.style.width = containerWidth + 'px';
        app.view.style.height = containerHeight + 'px';
        app.view.style.display = 'block';
        app.view.style.borderRadius = '8px';
        app.view.style.border = '2px solid #444';
        app.view.style.backgroundColor = '#333';
        app.view.style.marginBottom = '15px';
        
        // Canvas をコンテナの最初に追加（ボタンの前）
        const characterControls = canvasContainer.querySelector('.character-controls');
        if (characterControls) {
            canvasContainer.insertBefore(app.view, characterControls);
        } else {
            canvasContainer.appendChild(app.view);
        }
        
        console.log('✅ PIXI アプリケーション作成成功');
        
        // Live2D モデル読み込み
        await loadLive2DModel();
        
        isInitialized = true;
        console.log('🎉 Live2D PIXI 初期化完了');
        
    } catch (error) {
        console.error('❌ Live2D PIXI 初期化エラー:', error);
        showErrorFallback(error.message);
    }
}

/**
 * Live2D モデル読み込み
 */
async function loadLive2DModel() {
    console.log('📦 Live2D モデル読み込み開始:', modelConfig.path);
    
    try {
        // ファイル存在確認
        const response = await fetch(modelConfig.path);
        if (!response.ok) {
            throw new Error(`モデルファイルが見つかりません: ${modelConfig.path} (${response.status})`);
        }
        
        console.log('✅ モデルファイル確認成功');
        
        // Live2D モデル作成
        const { Live2DModel } = PIXI.live2d;
        
        console.log('Live2DModel クラス:', Live2DModel);
        
        const model = await Live2DModel.from(modelConfig.path, {
            autoUpdate: true,
            autoInteract: true,
            motionPreload: 'idle',
            onLoad: (m) => {
                console.log('✅ モデルロード成功!');
                console.log('モデル情報:', {
                    size: `${m.width}x${m.height}`,
                    expressions: m.internalModel?.settings?.expressions?.length || 0,
                    motions: Object.keys(m.internalModel?.settings?.motions || {}).length
                });
            },
            onError: (error) => {
                console.error('❌ モデルロードエラー:', error);
            }
        });
        
        if (!model) {
            throw new Error('モデル作成に失敗しました');
        }
        
        console.log('✅ Live2Dモデルが正常に作成されました');
        console.log('モデルオブジェクト:', model);
        
        // モデル設定
        currentModel = model;
        window.currentModel = model;  // グローバルアクセス用
        
        // ステージに追加
        app.stage.addChild(model);
        
        // スケール設定
        model.scale.set(modelConfig.scale);
        
        // 位置設定（アンカーポイントも含む）
        positionModel(model);
        
        // 利用可能な表情を確認
        if (model.internalModel && model.internalModel.settings) {
            const expressions = model.internalModel.settings.expressions || [];
            console.log('利用可能な表情:', expressions.map(exp => exp.Name || exp.name));
        }
        
        // リサイズ対応
        window.addEventListener('resize', () => {
            if (currentModel) {
                positionModel(currentModel);
            }
        });
        
        console.log('🎭 モデル設定完了');
        
    } catch (error) {
        console.error('❌ モデル読み込みエラー:', error);
        throw error;
    }
}

/**
 * モデル位置設定
 */
function positionModel(model) {
    if (!app || !model) return;
    
    // アンカーポイント設定（上中央基準で顔が見えるように）
    if (model.anchor) {
        model.anchor.set(0.5, 0.2);  // 上から20%の位置を基準点に（顔の位置）
    }
    
    // 表示エリアの中央に配置
    const centerX = app.view.width / 2;
    const centerY = app.view.height * 0.5;  // 中央位置
    
    console.log(`キャンバスサイズ: ${app.view.width}x${app.view.height}`);
    console.log(`モデル元サイズ: ${model.width}x${model.height}`);
    console.log(`モデルスケール後サイズ: ${model.width * model.scale.x}x${model.height * model.scale.y}`);
    console.log(`配置位置ベース: 中央X=${centerX}, 中央Y=${centerY}`);
    
    // オフセット適用
    const finalX = centerX + modelConfig.position.offsetX;
    const finalY = centerY + modelConfig.position.offsetY;
    
    model.position.set(finalX, finalY);
    
    console.log(`モデル最終位置: (${finalX}, ${finalY})`);
    console.log(`モデル境界: X=${finalX - (model.width * model.scale.x)/2} to ${finalX + (model.width * model.scale.x)/2}`);
    console.log(`モデル境界: Y=${finalY - (model.height * model.scale.y * 0.2)} to ${finalY + (model.height * model.scale.y * 0.8)}`);
}

/**
 * 表情変更（管理画面からの制御用）
 */
async function setExpression(expressionName) {
    if (!currentModel) {
        console.warn('モデルが読み込まれていません');
        return;
    }
    
    console.log(`🎭 表情変更: ${currentExpression} → ${expressionName}`);
    
    try {
        let result = false;
        
        // 🔍 デバッグ: 現在のモデル状態を確認
        if (currentModel.internalModel && currentModel.internalModel.settings) {
            const availableExpressions = currentModel.internalModel.settings.expressions || [];
            console.log('🔍 利用可能な表情:', availableExpressions.map(exp => exp.Name || exp.name));
        }
        
        // Live2D表情名マッピング（Normalも含む）
        const expressionMap = {
            'Normal': 'Normal',
            'Smile': 'Smile',
            'Surprised': 'Surprised', 
            'Sad': 'Sad',
            'Angry': 'Angry',
            'Blushing': 'Blushing'
        };
        
        const live2dExpression = expressionMap[expressionName];
        console.log(`🔍 表情マッピング: ${expressionName} → ${live2dExpression}`);
        
        if (live2dExpression) {
            if (expressionName === 'Normal') {
                // Normal表情の場合：まず他の表情をリセットしてからNormal表情を適用
                console.log('🔄 Normal表情への変更: 先にリセット実行');
                await currentModel.expression(null);
                await new Promise(resolve => setTimeout(resolve, 100)); // 短い遅延
                result = await currentModel.expression('Normal');
                console.log(`🔄 Normal表情に変更: ${result ? '成功' : '失敗'}`);
            } else {
                // 他の表情の場合
                console.log(`🎭 ${live2dExpression}表情への変更を実行`);
                result = await currentModel.expression(live2dExpression);
                console.log(`✅ 表情変更${result ? '成功' : '失敗'}: ${live2dExpression}`);
                
                // 🔍 デバッグ: 実際に設定された表情を確認
                if (currentModel.internalModel && currentModel.internalModel.motionManager) {
                    console.log('🔍 現在のモーション状態:', currentModel.internalModel.motionManager);
                }
            }
            
            if (!result) {
                console.warn(`⚠️ 表情が見つからないまたは変更失敗: ${live2dExpression}`);
                
                // 🔍 追加デバッグ: 表情ファイルの存在確認
                if (currentModel.internalModel && currentModel.internalModel.settings) {
                    const expressions = currentModel.internalModel.settings.expressions || [];
                    const foundExpression = expressions.find(exp => (exp.Name || exp.name) === live2dExpression);
                    if (foundExpression) {
                        console.log('🔍 表情ファイルは存在:', foundExpression);
                    } else {
                        console.error('❌ 表情ファイルが見つかりません:', live2dExpression);
                    }
                }
            }
        } else {
            console.warn(`⚠️ 未対応の表情名: ${expressionName}`);
        }
        
        // 表情が正常に変更されたら記録
        if (result) {
            currentExpression = expressionName;
            console.log(`✅ 表情変更完了: ${currentExpression}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ 表情変更エラー:', error);
        return false;
    }
}

/**
 * Live2Dの口パラメータを制御（リップシンク用）
 */
function setMouthParameter(openness) {
    if (!currentModel || !currentModel.internalModel) {
        return;
    }
    
    try {
        const model = currentModel.internalModel;
        
        // 一般的なリップシンクパラメータ名で試行
        const lipParamNames = [
            'ParamMouthOpenY',
            'PARAM_MOUTH_OPEN_Y', 
            'MouthOpenY',
            'mouth_open_y'
        ];
        
        let parameterSet = false;
        for (const paramName of lipParamNames) {
            try {
                // パラメータが存在するかチェックして設定
                if (model.getParameterIndex && model.getParameterIndex(paramName) >= 0) {
                    model.setParameterValueById(paramName, openness);
                    parameterSet = true;
                    break;
                } else if (model.setParameterValueById) {
                    // 直接設定を試行（エラーが出ても続行）
                    model.setParameterValueById(paramName, openness);
                    parameterSet = true;
                    break;
                }
            } catch (paramError) {
                // このパラメータ名では失敗、次を試行
                continue;
            }
        }
        
        if (!parameterSet) {
            // フォールバック: デフォルトパラメータインデックスで設定
            if (model.setParameterValueByIndex) {
                model.setParameterValueByIndex(0, openness); // 通常最初のパラメータは口
            }
        }
    } catch (error) {
        // エラーログを制限
        if (!window.mouthParamErrorLogged) {
            console.warn('🚨 口パラメータ設定エラー:', error.message);
            window.mouthParamErrorLogged = true;
        }
    }
}

/**
 * 基本的なリップシンク開始（後方互換性のため）
 */
function startLipSync() {
    if (!isInitialized || !currentModel) {
        console.warn('🚨 Live2Dモデルが初期化されていません');
        return;
    }
    
    console.log('🎤 Live2D 基本リップシンク開始');
    startTimerBasedLipSync();
}

/**
 * Web Audio APIを使用した高度なリップシンク
 */
function startAudioAnalysisLipSync(audioElement) {
    if (!isInitialized || !currentModel) {
        console.warn('🚨 Live2Dモデルが初期化されていません');
        return;
    }
    
    if (!audioElement) {
        console.warn('🚨 音声要素が提供されていません、タイマーベースに切り替えます');
        startTimerBasedLipSync();
        return;
    }
    
    console.log('🎤 Live2D Web Audio APIリップシンク開始');
    
    try {
        // Web Audio APIコンテキストを作成
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // アナライザーを作成
        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        
        // 音声ソースを作成してアナライザーに接続
        sourceNode = audioContext.createMediaElementSource(audioElement);
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        
        isLipSyncActive = true;
        
        // リアルタイム解析ループ
        function analyzeLipSync() {
            if (!isLipSyncActive) return;
            
            analyser.getByteFrequencyData(dataArray);
            
            // 低周波数帯域（人間の声）の音量を計算
            let sum = 0;
            const voiceRange = Math.floor(dataArray.length * 0.3); // 低周波数帯域
            for (let i = 0; i < voiceRange; i++) {
                sum += dataArray[i];
            }
            
            const averageVolume = sum / voiceRange;
            const normalizedVolume = Math.min(averageVolume / 128, 1.0);
            
            // 口の開き具合を設定（0.0-1.0）
            const mouthOpenness = Math.pow(normalizedVolume, 0.5) * 0.8;
            setMouthParameter(mouthOpenness);
            
            lipSyncAnimationFrame = requestAnimationFrame(analyzeLipSync);
        }
        
        analyzeLipSync();
        
    } catch (error) {
        console.error('❌ Web Audio APIリップシンクエラー:', error);
        // フォールバックとしてタイマーベースを使用
        startTimerBasedLipSync();
    }
}

/**
 * タイマーベースのシンプルなリップシンク
 */
function startTimerBasedLipSync() {
    if (!isInitialized || !currentModel) {
        console.warn('🚨 Live2Dモデルが初期化されていません');
        return;
    }
    
    console.log('🎤 Live2D タイマーベースリップシンク開始');
    
    isLipSyncActive = true;
    
    lipSyncTimer = setInterval(() => {
        if (!isLipSyncActive) return;
        
        // ランダムな口の動き（0.0-0.8の範囲）
        const randomOpenness = Math.random() * 0.8;
        setMouthParameter(randomOpenness);
        
    }, 100); // 100msごとに更新
}

/**
 * リップシンク停止
 */
function stopLipSync() {
    if (!isLipSyncActive) return;
    
    isLipSyncActive = false;
    console.log('🎤 Live2D リップシンク停止');
    
    // エラー状態をリセット
    window.lipSyncErrorLogged = false;
    window.mouthParamErrorLogged = false;
    
    // タイマーベースリップシンクを停止
    if (lipSyncTimer) {
        clearInterval(lipSyncTimer);
        lipSyncTimer = null;
    }
    
    // Web Audio API ベースリップシンクを停止
    if (lipSyncAnimationFrame) {
        cancelAnimationFrame(lipSyncAnimationFrame);
        lipSyncAnimationFrame = null;
    }
    
    // 音声解析ノードをクリーンアップ
    if (sourceNode) {
        try {
            sourceNode.disconnect();
        } catch (e) {
            // 既に切断されている場合は無視
        }
        sourceNode = null;
    }
    
    // 口を閉じた状態に戻す
    setMouthParameter(0);
}

/**
 * 音声再生開始イベント
 */
function onSpeechStart() {
    console.log('🗣️ Live2D 音声再生開始');
    
    // 話し始めの表情
    if (currentExpression === 'Normal') {
        setExpression('Smile');
    }
    
    // リップシンク開始
    startLipSync();
}

/**
 * 音声再生終了イベント
 */
function onSpeechEnd() {
    console.log('🗣️ Live2D 音声再生終了');
    
    // リップシンク停止
    stopLipSync();
    
    // 感情表現中は通常表情への復帰を抑制
    // 感情制御システムが管理するため、自動復帰は無効化
    console.log('🎭 感情表現維持のため、表情自動復帰をスキップ');
}

/**
 * エラー時のフォールバック表示
 */
function showErrorFallback(errorMessage) {
    const container = document.querySelector('.live2d-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #ffebee, #ffcdd2);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <div style="font-size: 16px; font-weight: bold; color: #d32f2f; margin-bottom: 10px;">
                Live2D読み込みエラー
            </div>
            <div style="font-size: 12px; color: #666; text-align: center;">
                ${errorMessage}
            </div>
            <div style="font-size: 10px; color: #999; margin-top: 20px; text-align: center;">
                コンソールで詳細を確認してください
            </div>
        </div>
    `;
}

/**
 * Live2Dモーション再生
 */
async function playMotion(motionName) {
    if (!currentModel) {
        console.warn('モデルが読み込まれていません');
        return false;
    }
    
    console.log(`🎭 モーション再生開始: ${motionName}`);
    
    try {
        const result = await currentModel.motion(motionName);
        if (result) {
            console.log(`✅ モーション再生成功: ${motionName}`);
            return true;
        } else {
            console.warn(`⚠️ モーション再生失敗: ${motionName}`);
            return false;
        }
    } catch (error) {
        console.error('❌ モーション再生エラー:', error);
        return false;
    }
}

/**
 * 感情ベースモーション制御
 */
async function playEmotionMotion(emotion, motionGroup = null) {
    // Live2Dモデルの実際のモーション定義に基づく分類
    const emotionMotions = {
        'happy': ['Idle'], // アイドルモーション（嬉しい時）
        'surprised': ['Tap'], // タップモーション（驚いた時）
        'sad': ['FlickDown@Body'], // 下向きフリック（悲しい時）
        'angry': ['Flick@Body'], // ボディフリック（怒った時）
        'neutral': ['Idle'], // 基本アイドルモーション
        'excited': ['FlickUp@Head'], // 頭上フリック（興奮時）
        'thinking': ['Tap@Head'] // 頭タップ（考えている時）
    };
    
    const selectedMotionGroup = motionGroup || emotionMotions[emotion] || emotionMotions['neutral'];
    const motionGroupName = Array.isArray(selectedMotionGroup) ? selectedMotionGroup[0] : selectedMotionGroup;
    
    try {
        const result = await currentModel.motion(motionGroupName);
        if (result) {
            console.log(`✅ 感情モーション再生成功: ${emotion} → ${motionGroupName}`);
            return true;
        } else {
            console.warn(`⚠️ 感情モーション再生失敗: ${emotion} → ${motionGroupName}`);
            return false;
        }
    } catch (error) {
        console.error('❌ 感情モーション再生エラー:', error);
        return false;
    }
}

/**
 * 🔧 現在の表情状態を取得（デバッグ用）
 */
function getCurrentExpressionState() {
    if (!currentModel || !currentModel.internalModel) {
        return { error: 'モデルが読み込まれていません' };
    }
    
    try {
        const settings = currentModel.internalModel.settings;
        const expressionManager = currentModel.internalModel.expressionManager;
        
        return {
            currentExpression: currentExpression,
            availableExpressions: settings?.expressions?.map(exp => exp.Name || exp.name) || [],
            expressionManagerState: expressionManager ? {
                isFinished: expressionManager.isFinished(),
                currentExpression: expressionManager._currentExpressionIndex
            } : null,
            modelLoaded: !!currentModel,
            internalModelLoaded: !!currentModel.internalModel
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 🔧 表情を強制的にクリアしてリセット（デバッグ用）
 */
async function forceResetExpression() {
    if (!currentModel) {
        console.warn('モデルが読み込まれていません');
        return false;
    }
    
    try {
        console.log('🔄 表情強制リセット開始');
        
        // 表情をクリア
        await currentModel.expression(null);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Normalに設定
        const result = await currentModel.expression('Normal');
        
        currentExpression = 'Normal';
        updateExpressionButtons();
        
        console.log('🔄 表情強制リセット完了:', result);
        return result;
    } catch (error) {
        console.error('❌ 表情強制リセットエラー:', error);
        return false;
    }
}

/**
 * クリーンアップ
 */
function cleanup() {
    // リップシンクを停止
    stopLipSync();
    
    // Web Audio APIリソースをクリーンアップ
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    analyser = null;
    dataArray = null;
    sourceNode = null;
    
    if (currentModel) {
        currentModel.destroy();
        currentModel = null;
    }
    
    if (app) {
        app.destroy(true, true);
        app = null;
    }
}

// グローバル公開
window.Live2DController = {
    setExpression,
    playMotion,
    playEmotionMotion,
    startLipSync,
    stopLipSync,
    startAudioAnalysisLipSync,
    startTimerBasedLipSync,
    setMouthParameter,
    onSpeechStart,
    onSpeechEnd,
    isAvailable: () => isInitialized,
    getCurrentExpressionState,
    forceResetExpression,
    cleanup
};

// Live2Dモデルをグローバルアクセス可能にする
window.currentModel = null;
Object.defineProperty(window, 'currentModel', {
    get: () => currentModel,
    set: (value) => { currentModel = value; }
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM読み込み完了 - Live2D PIXI初期化');
    initializeLive2DPIXI();
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', cleanup);

console.log('✅ Live2D PIXI Controller 読み込み完了');
