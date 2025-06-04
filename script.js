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
let voiceEngine = 'webspeech'; // 'webspeech' または 'google-tts'
let currentAudio = null; // Google TTS用のAudioオブジェクト

// Text-to-Speech APIのエンドポイント（Cloud Functionsで実装予定）
const TTS_API_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app/tts";

// Web Speech API の音声合成をチェック
if ('speechSynthesis' in window) {
    console.log('Web Speech API is supported!');
} else {
    console.warn('Web Speech API is not supported in this browser.');
    voiceEngine = 'google-tts'; // Web Speech API非対応の場合はGoogle TTSに切り替え
}

// 音声エンジン表示を更新
function updateVoiceEngineDisplay() {
    const engineText = voiceEngine === 'webspeech' ? 'Web' : 'GCP';
    voiceEngineToggle.textContent = `🎵${engineText}`;
    voiceEngineToggle.title = `音声エンジン: ${voiceEngine === 'webspeech' ? 'Web Speech API' : 'Google Cloud TTS'}`;
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
    };
    
    utterance.onerror = function(event) {
        console.error('Web Speech 音声読み上げエラー:', event.error);
        currentSpeechSynthesis = null;
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
    
    if (voiceEngine === 'google-tts') {
        speakTextWithGoogleTTS(cleanText);
    } else {
        speakTextWithWebSpeech(cleanText);
    }
}

// 音声停止関数（両エンジン対応）
function stopSpeech() {
    // Web Speech API の停止
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        currentSpeechSynthesis = null;
    }
    
    // Google TTS の停止
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
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
voiceEngineToggle.addEventListener('click', () => {
    // 現在の音声を停止
    stopSpeech();
    
    // エンジンを切り替え
    voiceEngine = voiceEngine === 'webspeech' ? 'google-tts' : 'webspeech';
    
    // Web Speech API非対応の場合はGoogle TTSのみ
    if (voiceEngine === 'webspeech' && !('speechSynthesis' in window)) {
        voiceEngine = 'google-tts';
        console.warn('Web Speech API非対応のため、Google TTSを継続使用');
    }
    
    updateVoiceEngineDisplay();
    console.log('音声エンジン切り替え:', voiceEngine);
});

// 初期表示を設定
updateVoiceEngineDisplay();

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