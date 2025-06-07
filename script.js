// Cloud FunctionsのエンドポイントURL
// ★ここにデプロイしたCloud FunctionsのURLを貼り付けてください★
const CLOUD_FUNCTION_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app";

const chatHistoryDiv = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceToggle = document.getElementById('voice-toggle');
const stopSpeechButton = document.getElementById('stop-speech');
const voiceEngineToggle = document.getElementById('voice-engine-toggle');

// 音声合成の設定
let isSpeechEnabled = true;
let currentSpeechSynthesis = null;
let voiceEngine = 'webspeech'; // 'webspeech', 'google-tts', または 'aivis'
let currentAudio = null; // Google TTS/AivisSpeech用のAudioオブジェクト

// Text-to-Speech APIのエンドポイント（Cloud Functionsで実装予定）
const TTS_API_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app/tts";

// AivisSpeech APIのエンドポイント（ローカル起動の場合）
// ポートを変更したい場合はここを修正してください
const AIVIS_API_URL = "http://127.0.0.1:10101";

// AivisSpeech Engineの状態確認
async function checkAivisSpeechEngine() {
    try {
        const response = await fetch(`${AIVIS_API_URL}/version`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3秒でタイムアウト
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('AivisSpeech Engine起動確認済み:', data);
            return true;
        }
    } catch (error) {
        console.warn('AivisSpeech Engine未起動:', error.message);
        return false;
    }
    return false;
}

// Web Speech API の音声合成をチェック
if ('speechSynthesis' in window) {
    console.log('Web Speech API is supported!');
} else {
    console.warn('Web Speech API is not supported in this browser.');
    voiceEngine = 'aivis'; // Web Speech API非対応の場合はAivisSpeechに切り替え
}

// 音声エンジン表示を更新
function updateVoiceEngineDisplay() {
    let engineText;
    let titleText;
    
    switch(voiceEngine) {
        case 'webspeech':
            engineText = 'Web';
            titleText = 'Web Speech API';
            break;
        case 'google-tts':
            engineText = 'GCP';
            titleText = 'Google Cloud TTS';
            break;
        case 'aivis':
            engineText = 'Aivis';
            titleText = 'AivisSpeech Engine';
            break;
        default:
            engineText = 'Web';
            titleText = 'Web Speech API';
    }
    
    voiceEngineToggle.textContent = `🎵${engineText}`;
    voiceEngineToggle.title = `音声エンジン: ${titleText}`;
}

// Google Cloud Text-to-Speech APIを使用した音声合成
async function speakTextWithGoogleTTS(text) {
    try {
        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                languageCode: 'ja-JP',
                voiceName: 'ja-JP-Neural2-B', // 女性の声
                audioEncoding: 'MP3'
            })
        });

        if (!response.ok) {
            throw new Error(`Google TTS API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Base64エンコードされた音声データをAudioオブジェクトで再生
        const audioBlob = new Blob([Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], {
            type: 'audio/mp3'
        });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 現在の音声を停止
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        currentAudio = new Audio(audioUrl);
        currentAudio.volume = 0.8;
        
        currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            console.log('Google TTS 音声読み上げ終了');
            
            // Live2Dキャラクターの音声終了アニメーション
            if (window.Live2DController) {
                window.Live2DController.onSpeechEnd();
            }
        };
        
        currentAudio.onerror = (error) => {
            console.error('Google TTS 音声再生エラー:', error);
            currentAudio = null;
        };
        
        await currentAudio.play();
        console.log('Google TTS 音声読み上げ開始');
        
    } catch (error) {
        console.error('Google TTS エラー:', error);
        // Google TTSが失敗した場合はWeb Speech APIにフォールバック
        if (voiceEngine === 'google-tts' && 'speechSynthesis' in window) {
            console.log('Google TTSエラーのため、Web Speech APIにフォールバック');
            speakTextWithWebSpeech(text);
        }
    }
}

// AivisSpeech Engineを使用した音声合成
async function speakTextWithAivisSpeech(text) {
    try {
        console.log('=== AivisSpeech 音声合成開始 ===');
        console.log('テキスト:', text);
        console.log('AIVIS_API_URL:', AIVIS_API_URL);
        
        // AivisSpeech Engine APIで音声合成を実行（クエリパラメータ形式）
        // スピーカーID: 1310138976 = 阿井田 茂 ノーマル（現在利用可能）
        const speakerID = 1310138976; // 阿井田 茂のノーマル音声
        const audioQueryURL = `${AIVIS_API_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerID}`;
        
        console.log('AivisSpeech audio_query URL:', audioQueryURL);
        console.log('Request details:', {
            method: 'POST',
            headers: { 'accept': 'application/json' },
            url: audioQueryURL
        });
        
        const response = await fetch(audioQueryURL, {
            method: 'POST',
            headers: {
                'accept': 'application/json'
            }
        }).catch(error => {
            console.error('=== CORS/Network エラー (audio_query) ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('これはCORS設定が原因の可能性があります');
            throw error;
        });
        
        console.log('Audio query response status:', response.status);
        console.log('Audio query response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AivisSpeech audio_query response:', errorText);
            throw new Error(`AivisSpeech audio_query error: ${response.status}`);
        }

        const audioQuery = await response.json();
        console.log('AivisSpeech audio_query 成功');

        // 音声ファイルを生成（クエリパラメータ形式）
        const synthesisURL = `${AIVIS_API_URL}/synthesis?speaker=${speakerID}`;
        console.log('AivisSpeech synthesis URL:', synthesisURL);
        console.log('Synthesis request body:', JSON.stringify(audioQuery, null, 2));
        
        const synthesisResponse = await fetch(synthesisURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'audio/wav'
            },
            body: JSON.stringify(audioQuery)
        }).catch(error => {
            console.error('=== CORS/Network エラー (synthesis) ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('これはCORS設定が原因の可能性があります');
            throw error;
        });
        
        console.log('Synthesis response status:', synthesisResponse.status);
        console.log('Synthesis response headers:', Object.fromEntries(synthesisResponse.headers.entries()));

        if (!synthesisResponse.ok) {
            const errorText = await synthesisResponse.text();
            console.error('AivisSpeech synthesis response:', errorText);
            throw new Error(`AivisSpeech synthesis error: ${synthesisResponse.status}`);
        }

        // WAV音声データを取得
        const audioBlob = await synthesisResponse.blob();
        console.log('AivisSpeech synthesis 成功、音声データサイズ:', audioBlob.size, 'bytes');
        console.log('Audio blob type:', audioBlob.type);
        
        // Blobが空でないことを確認
        if (audioBlob.size === 0) {
            throw new Error('受信した音声データが空です');
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL created:', audioUrl);

        // 現在の音声を停止
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        currentAudio = new Audio(audioUrl);
        currentAudio.volume = 0.8;
        console.log('Audio element created, volume set to:', currentAudio.volume);
        console.log('Audio src:', currentAudio.src);

        currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            console.log('AivisSpeech 音声読み上げ終了');
            
            // Live2Dキャラクターの音声終了アニメーション
            if (window.Live2DController) {
                window.Live2DController.onSpeechEnd();
            }
        };

        currentAudio.onerror = (error) => {
            console.error('AivisSpeech 音声再生エラー:', error);
            console.error('Audio エラー詳細:', error.target.error);
            console.error('Audio networkState:', currentAudio.networkState);
            console.error('Audio readyState:', currentAudio.readyState);
            currentAudio = null;
        };

        currentAudio.onloadeddata = () => {
            console.log('AivisSpeech 音声データ読み込み完了');
            console.log('Audio duration:', currentAudio.duration);
            console.log('Audio readyState:', currentAudio.readyState);
        };

        currentAudio.oncanplay = () => {
            console.log('AivisSpeech 音声再生準備完了');
        };

        try {
            // ブラウザの自動再生ポリシーを考慮した再生試行
            console.log('音声再生を試行中...');
            
            // Live2Dキャラクターの音声開始アニメーション
            if (window.Live2DController) {
                console.log('Live2D音声開始アニメーション実行');
                window.Live2DController.onSpeechStart();
            }
            
            await currentAudio.play();
            console.log('AivisSpeech 音声読み上げ開始');
        } catch (playError) {
            console.error('音声再生に失敗:', playError);
            console.error('PlayError name:', playError.name);
            console.error('PlayError message:', playError.message);
            
            // ブラウザの自動再生ポリシーによるエラーの場合の対処
            if (playError.name === 'NotAllowedError') {
                console.warn('自動再生がブロックされました。ユーザーのクリックが必要です。');
                // ユーザーに通知
                alert('音声再生にはクリックが必要です。OKを押すと音声が再生されます。');
                try {
                    await currentAudio.play();
                    console.log('ユーザーアクション後に音声再生開始');
                } catch (secondError) {
                    console.error('二回目の再生試行も失敗:', secondError);
                }
            }
        }

    } catch (error) {
        console.error('AivisSpeech エラー:', error);
        console.error('AivisSpeech Engine URL:', AIVIS_API_URL);
        console.error('テキスト:', text);
        
        // より詳細なエラー情報を表示
        if (error.message.includes('422')) {
            console.error('422エラー: リクエストパラメータに問題があります');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.error('ネットワークエラー: AivisSpeech Engineが起動していない可能性があります');
            console.log('AivisSpeech Engineを起動してください: http://127.0.0.1:10101');
        }
        
        // AivisSpeechが失敗した場合はWeb Speech APIにフォールバック
        if (voiceEngine === 'aivis' && 'speechSynthesis' in window) {
            console.log('AivisSpeechエラーのため、Web Speech APIにフォールバック');
            speakTextWithWebSpeech(text);
        }
    }
}

// Web Speech APIを使用した音声合成（既存の関数を分離）
function speakTextWithWebSpeech(text) {
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API is not supported');
        return;
    }
    
    // 現在の音声合成を停止
    if (currentSpeechSynthesis) {
        speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 日本語の音声設定
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9; // 読み上げ速度（0.1-10）
    utterance.pitch = 1.2; // 音の高さ（0-2）
    utterance.volume = 0.8; // 音量（0-1）
    
    // 利用可能な日本語音声を取得して設定
    const voices = speechSynthesis.getVoices();
    const japaneseVoice = voices.find(voice => 
        voice.lang.includes('ja') || 
        voice.name.includes('Japanese') ||
        voice.name.includes('日本')
    );
    
    if (japaneseVoice) {
        utterance.voice = japaneseVoice;
        console.log('使用する音声:', japaneseVoice.name);
    }
    
    // イベントリスナー
    utterance.onstart = function() {
        console.log('Web Speech 音声読み上げ開始');
        currentSpeechSynthesis = utterance;
    };
    
    utterance.onend = function() {
        console.log('Web Speech 音声読み上げ終了');
        currentSpeechSynthesis = null;
        
        // Live2Dキャラクターの音声終了アニメーション
        if (window.Live2DController) {
            window.Live2DController.onSpeechEnd();
        }
    };
    
    utterance.onerror = function(event) {
        console.error('Web Speech 音声読み上げエラー:', event.error);
        currentSpeechSynthesis = null;
        
        // エラー時もLive2Dアニメーションを停止
        if (window.Live2DController) {
            window.Live2DController.onSpeechEnd();
        }
    };
    
    // 読み上げ開始
    speechSynthesis.speak(utterance);
}

// 絵文字を除去する関数
function removeEmojis(text) {
    // 絵文字を検出する正規表現
    // Unicode絵文字ブロックと追加の絵文字シンボルを削除
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{2934}-\u{2935}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;
    
    return text.replace(emojiRegex, '').trim();
}

// 音声で読み上げる関数（エンジン選択対応）
function speakText(text) {
    if (!isSpeechEnabled) {
        return;
    }
    
    // 絵文字を除去してから音声合成
    const cleanText = removeEmojis(text);
    
    // 絵文字を除去した結果、空文字列になった場合は読み上げしない
    if (!cleanText || cleanText.length === 0) {
        console.log('絵文字除去後にテキストが空になったため、音声読み上げをスキップしました');
        return;
    }
    
    console.log('🎵 音声エンジン:', voiceEngine, '| テキスト:', cleanText);
    
    // Live2Dキャラクターの音声開始アニメーション
    if (window.Live2DController) {
        window.Live2DController.onSpeechStart();
    }
    
    switch (voiceEngine) {
        case 'google-tts':
            speakTextWithGoogleTTS(cleanText);
            break;
        case 'aivis':
            speakTextWithAivisSpeech(cleanText);
            break;
        case 'webspeech':
        default:
            speakTextWithWebSpeech(cleanText);
            break;
    }
}

// 音声停止関数（全エンジン対応）
function stopSpeech() {
    // Web Speech API の停止
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        currentSpeechSynthesis = null;
    }
    
    // Google TTS / AivisSpeech の停止
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Live2Dキャラクターの音声停止アニメーション
    if (window.Live2DController) {
        window.Live2DController.onSpeechEnd();
    }
    
    console.log('音声読み上げを停止しました');
}

// チャット履歴を保持する配列
// Cloud Functionsに送信する履歴もこの形式で管理します
let chatMessages = [];

// メッセージをチャット履歴に追加する関数
function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageDiv.textContent = text;
    chatHistoryDiv.appendChild(messageDiv);

    // スクロールを一番下へ
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// Cloud Functions経由でGemini APIへのリクエストを送信する関数
async function sendMessageToCloudFunction(message) {
    appendMessage('user', message); // ユーザーメッセージを即座に表示

    // ローディング表示
    const thinkingMessageDiv = document.createElement('div');
    thinkingMessageDiv.classList.add('message', 'bot-message');
    thinkingMessageDiv.textContent = '思考中...';
    chatHistoryDiv.appendChild(thinkingMessageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // スクロール
    sendButton.disabled = true;

    // クライアント側で履歴を管理し、毎回Cloud Functionsに送る
    // Cloud Functions側でこれをそのままGemini APIに渡す
    chatMessages.push({ role: 'user', text: message });

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userMessage: message,
                chatHistory: chatMessages.slice(0, -1) // 最新のユーザーメッセージを除く履歴を送信
                                                        // Gemini APIはユーザーメッセージを 'sendMessage' で受け取るため、
                                                        // 履歴には含まない（あるいは含めてもOK、モデルの挙動による）
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloud Functionエラー:', errorData);
            throw new Error(`Cloud Functionリクエストが失敗しました: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.details : '詳細不明'}`);
        }

        const data = await response.json();
        const botResponseText = data.reply;

        // 最新の「思考中...」メッセージを削除
        chatHistoryDiv.removeChild(thinkingMessageDiv);

        appendMessage('bot', botResponseText);
        
        // 🧠 感情分析とLive2D制御（音声読み上げ前に実行）
        if (window.EmotionAnalyzer) {
            console.log('🔍 チャットボット応答の感情分析開始:', botResponseText.substring(0, 100));
            console.log('🔍 完全な応答テキスト:', botResponseText);
            
            // 🔬 直接分析も実行して比較
            console.log('--- 直接分析結果 ---');
            const directResult = window.EmotionAnalyzer.directAnalyze(botResponseText);
            
            console.log('--- Live2D適用結果 ---');
            const emotionResult = await window.EmotionAnalyzer.applyEmotionToLive2D(botResponseText);
            console.log('🎭 感情分析結果:', emotionResult);
            
            // 🔍 キーワード検索も実行
            console.log('--- キーワード検索結果 ---');
            window.EmotionAnalyzer.searchKeywords(botResponseText);
        }
        
        // ボットの応答を音声で読み上げ
        speakText(botResponseText);

        // ボットの応答をチャット履歴に追加
        chatMessages.push({ role: 'model', text: botResponseText });

    } catch (error) {
        console.error('チャットボットエラー:', error);
        // 最新の「思考中...」メッセージを削除
        if (chatHistoryDiv.contains(thinkingMessageDiv)) {
             chatHistoryDiv.removeChild(thinkingMessageDiv);
        }
        appendMessage('bot', 'エラーが発生しました。もう一度お試しください。');
    } finally {
        sendButton.disabled = false;
        userInput.value = ''; // 入力欄をクリア
    }
}

// 送信ボタンのイベントリスナー
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        sendMessageToCloudFunction(message);
    }
});

// Enterキーでの送信
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        const message = userInput.value.trim();
        if (message) {
            sendMessageToCloudFunction(message);
        }
    }
});

// 音声ON/OFFボタンのイベントリスナー
voiceToggle.addEventListener('click', () => {
    isSpeechEnabled = !isSpeechEnabled;
    voiceToggle.textContent = isSpeechEnabled ? '🔊' : '🔇';
    voiceToggle.title = isSpeechEnabled ? '音声ON' : '音声OFF';
    
    // 音声がOFFになったら現在の読み上げを停止
    if (!isSpeechEnabled) {
        stopSpeech();
    }
    
    console.log('音声機能:', isSpeechEnabled ? 'ON' : 'OFF');
});

// 音声停止ボタンのイベントリスナー
stopSpeechButton.addEventListener('click', () => {
    stopSpeech();
});

// 音声エンジン切り替えボタンのイベントリスナー
voiceEngineToggle.addEventListener('click', async () => {
    // 現在の音声を停止
    stopSpeech();
    
    // エンジンを3つの中で順番に切り替え
    switch (voiceEngine) {
        case 'webspeech':
            voiceEngine = 'google-tts';
            break;
        case 'google-tts':
            voiceEngine = 'aivis';
            // AivisSpeechに切り替える際に状態確認
            const isAivisAvailable = await checkAivisSpeechEngine();
            if (!isAivisAvailable) {
                console.warn('AivisSpeech Engine未起動のため、Web Speech APIに戻します');
                voiceEngine = 'webspeech';
            }
            break;
        case 'aivis':
        default:
            voiceEngine = 'webspeech';
            break;
    }
    
    // Web Speech API非対応の場合は次のエンジンへ
    if (voiceEngine === 'webspeech' && !('speechSynthesis' in window)) {
        voiceEngine = 'google-tts';
        console.warn('Web Speech API非対応のため、Google TTSに切り替え');
    }
    
    updateVoiceEngineDisplay();
    console.log('音声エンジン切り替え:', voiceEngine);
});

// 初期表示を設定
updateVoiceEngineDisplay();

// 初期化時にAivisSpeech Engineの状態を確認
checkAivisSpeechEngine().then(isAvailable => {
    if (isAvailable) {
        console.log('✅ AivisSpeech Engine利用可能');
    } else {
        console.log('❌ AivisSpeech Engine未起動 - 手動で起動してください');
    }
});

// 音声リストが読み込まれた後に日本語音声をセットアップ
speechSynthesis.addEventListener('voiceschanged', () => {
    const voices = speechSynthesis.getVoices();
    console.log('利用可能な音声:', voices.map(v => `${v.name} (${v.lang})`));
    
    const japaneseVoices = voices.filter(voice => 
        voice.lang.includes('ja') || 
        voice.name.includes('Japanese') ||
        voice.name.includes('日本')
    );
    
    if (japaneseVoices.length > 0) {
        console.log('日本語音声が利用可能:', japaneseVoices.map(v => v.name));
    } else {
        console.warn('日本語音声が見つかりません。デフォルト音声を使用します。');
    }
});