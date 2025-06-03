// Cloud FunctionsのエンドポイントURL
// ★ここにデプロイしたCloud FunctionsのURLを貼り付けてください★
const CLOUD_FUNCTION_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app";

const chatHistoryDiv = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceToggle = document.getElementById('voice-toggle');
const stopSpeechButton = document.getElementById('stop-speech');

// 音声合成の設定
let isSpeechEnabled = true;
let currentSpeechSynthesis = null;

// Web Speech API の音声合成をチェック
if ('speechSynthesis' in window) {
    console.log('Web Speech API is supported!');
} else {
    console.warn('Web Speech API is not supported in this browser.');
    voiceToggle.style.display = 'none';
    stopSpeechButton.style.display = 'none';
}

// 音声で読み上げる関数
function speakText(text) {
    if (!isSpeechEnabled || !('speechSynthesis' in window)) {
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
        console.log('音声読み上げ開始');
        currentSpeechSynthesis = utterance;
    };
    
    utterance.onend = function() {
        console.log('音声読み上げ終了');
        currentSpeechSynthesis = null;
    };
    
    utterance.onerror = function(event) {
        console.error('音声読み上げエラー:', event.error);
        currentSpeechSynthesis = null;
    };
    
    // 読み上げ開始
    speechSynthesis.speak(utterance);
}

// 音声停止関数
function stopSpeech() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        currentSpeechSynthesis = null;
        console.log('音声読み上げを停止しました');
    }
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