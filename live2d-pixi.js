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
        const containerWidth = 360;  // CSS で指定した幅
        const containerHeight = 540; // CSS で指定した高さ
        
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
        
        // 表情ボタン設定
        setupExpressionButtons();
        
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
 * 表情変更
 */
async function setExpression(expressionName) {
    if (!currentModel) {
        console.warn('モデルが読み込まれていません');
        return;
    }
    
    console.log(`🎭 表情変更: ${currentExpression} → ${expressionName}`);
    
    try {
        // Normal 表情の場合は表情をリセット
        if (expressionName === 'Normal') {
            await currentModel.expression(null);
        } else {
            // Live2D表情名マッピング
            const expressionMap = {
                'Smile': 'Smile',
                'Surprised': 'Surprised', 
                'Sad': 'Sad',
                'Angry': 'Angry'
            };
            
            const live2dExpression = expressionMap[expressionName];
            if (live2dExpression) {
                const result = await currentModel.expression(live2dExpression);
                if (result) {
                    console.log(`✅ 表情変更成功: ${live2dExpression}`);
                } else {
                    console.warn(`⚠️ 表情が見つかりません: ${live2dExpression}`);
                }
            }
        }
        
        currentExpression = expressionName;
        updateExpressionButtons();
        
    } catch (error) {
        console.error('❌ 表情変更エラー:', error);
    }
}

/**
 * 表情ボタン設定
 */
function setupExpressionButtons() {
    const buttons = [
        { id: 'expression-happy', expression: 'Smile' },
        { id: 'expression-surprised', expression: 'Surprised' },
        { id: 'expression-sad', expression: 'Sad' },
        { id: 'expression-angry', expression: 'Angry' },
        { id: 'expression-normal', expression: 'Normal' }
    ];
    
    buttons.forEach(({ id, expression }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => setExpression(expression));
            console.log(`✅ ボタン設定完了: ${id} → ${expression}`);
        }
    });
    
    updateExpressionButtons();
}

/**
 * 表情ボタン更新
 */
function updateExpressionButtons() {
    const buttonMap = {
        'Smile': 'expression-happy',
        'Surprised': 'expression-surprised',
        'Sad': 'expression-sad', 
        'Angry': 'expression-angry',
        'Normal': 'expression-normal'
    };
    
    // 全ボタンリセット
    Object.values(buttonMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.backgroundColor = '';
            btn.style.transform = '';
            btn.style.boxShadow = '';
        }
    });
    
    // アクティブボタンハイライト
    const activeId = buttonMap[currentExpression];
    if (activeId) {
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) {
            activeBtn.style.backgroundColor = '#2196f3';
            activeBtn.style.transform = 'scale(1.1)';
            activeBtn.style.boxShadow = '0 0 10px rgba(33, 150, 243, 0.5)';
        }
    }
}

/**
 * リップシンク開始
 */
function startLipSync() {
    if (isLipSyncActive || !currentModel) return;
    
    isLipSyncActive = true;
    console.log('🎤 Live2D リップシンク開始');
    
    // Live2D パラメータでのリップシンク
    lipSyncTimer = setInterval(() => {
        if (currentModel && currentModel.internalModel) {
            try {
                // 口の開閉パラメータ
                const lipValue = Math.sin(Date.now() * 0.01) * 0.8 + 0.2;
                
                // Live2D Core でパラメータ設定
                const coreModel = currentModel.internalModel.coreModel;
                if (coreModel) {
                    // パラメータIDを検索
                    const paramIds = coreModel.getParameterIds();
                    for (let i = 0; i < paramIds.length; i++) {
                        const paramId = paramIds[i];
                        if (paramId.includes('MouthOpenY') || paramId.includes('ParamMouthOpenY')) {
                            coreModel.setParameterValueById(paramId, lipValue);
                            break;
                        }
                    }
                }
            } catch (error) {
                console.warn('リップシンクパラメータ設定エラー:', error);
            }
        }
    }, 50);
}

/**
 * リップシンク停止
 */
function stopLipSync() {
    if (!isLipSyncActive) return;
    
    isLipSyncActive = false;
    console.log('🎤 Live2D リップシンク停止');
    
    if (lipSyncTimer) {
        clearInterval(lipSyncTimer);
        lipSyncTimer = null;
    }
    
    // 口を閉じた状態に戻す
    if (currentModel && currentModel.internalModel) {
        try {
            const coreModel = currentModel.internalModel.coreModel;
            if (coreModel) {
                const paramIds = coreModel.getParameterIds();
                for (let i = 0; i < paramIds.length; i++) {
                    const paramId = paramIds[i];
                    if (paramId.includes('MouthOpenY') || paramId.includes('ParamMouthOpenY')) {
                        coreModel.setParameterValueById(paramId, 0);
                        break;
                    }
                }
            }
        } catch (error) {
            console.warn('リップシンク停止エラー:', error);
        }
    }
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
    
    // 通常表情に戻す（遅延）
    setTimeout(() => {
        setExpression('Normal');
    }, 1500);
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
 * クリーンアップ
 */
function cleanup() {
    if (lipSyncTimer) {
        clearInterval(lipSyncTimer);
        lipSyncTimer = null;
    }
    
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
    startLipSync,
    stopLipSync,
    onSpeechStart,
    onSpeechEnd,
    isAvailable: () => isInitialized,
    cleanup
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM読み込み完了 - Live2D PIXI初期化');
    initializeLive2DPIXI();
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', cleanup);

console.log('✅ Live2D PIXI Controller 読み込み完了');
