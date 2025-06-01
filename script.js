// Cloud FunctionsのエンドポイントURL
// ★ここにデプロイしたCloud FunctionsのURLを貼り付けてください★
const CLOUD_FUNCTION_URL = "https://gemini-chatbot-proxy-636074041441.asia-northeast1.run.app";

const chatHistoryDiv = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

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