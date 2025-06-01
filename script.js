// WARNING: APIキーを直接クライアントサイドに埋め込むのは危険です。
// 本番環境では必ずバックエンドサーバーを介してAPIリクエストをプロキシしてください。
const API_KEY = "AIzaSyA0SVNytyuLYf2-RKN42fhXLNHxE6h0E5w"; // ★あなたのAPIキーをここに貼り付けてください★
const MODEL_NAME = "gemini-2.0-flash"; // または gemini-1.5-pro-latest など、利用可能なモデル名

const chatHistoryDiv = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// チャット履歴を保持する配列
// Gemini APIのhistoryフォーマットに合わせる
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

// Gemini APIへのリクエストを送信する関数
async function sendMessageToGemini(message) {
    appendMessage('user', message); // ユーザーメッセージを即座に表示

    // ローディング表示
    appendMessage('bot', '思考中...');
    sendButton.disabled = true;

    // Gemini APIのフォーマットに合わせてチャット履歴を更新
    chatMessages.push({ role: 'user', parts: [{ text: message }] });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: chatMessages // これまでの会話履歴を送信
            })
        });

        if (!response.ok) {
            // エラーレスポンスの詳細をログに出力
            const errorData = await response.json();
            console.error('APIエラー:', errorData);
            throw new Error(`APIリクエストが失敗しました: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.message : '詳細不明'}`);
        }

        const data = await response.json();
        const botResponseText = data.candidates[0].content.parts[0].text;

        // 最新の「思考中...」メッセージを削除
        chatHistoryDiv.removeChild(chatHistoryDiv.lastChild);

        appendMessage('bot', botResponseText);

        // モデルの応答をチャット履歴に追加
        chatMessages.push({ role: 'model', parts: [{ text: botResponseText }] });

    } catch (error) {
        console.error('チャットボットエラー:', error);
        // 最新の「思考中...」メッセージを削除
        chatHistoryDiv.removeChild(chatHistoryDiv.lastChild);
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
        sendMessageToGemini(message);
    }
});

// Enterキーでの送信
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        const message = userInput.value.trim();
        if (message) {
            sendMessageToGemini(message);
        }
    }
});

// 初期メッセージを履歴に追加
// appendMessage('bot', 'こんにちは！何か質問がありますか？'); // HTMLで直接記述したので不要