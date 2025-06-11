const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getConfig } = require('../services/config');
const { addLog } = require('../services/logs');
const router = express.Router();

// Global variables for YouTube monitoring
let isMonitoring = false;
let monitoringInterval = null;
let processedMessageIds = new Map();
let liveChatId = null;
let currentConfig = null;
let messageQueue = [];

// フロントエンド用メッセージ取得エンドポイント
router.get('/frontend/messages', (req, res) => {
    const messages = [...messageQueue];
    messageQueue = [];
    
    res.json({
        messages: messages,
        isMonitoring: isMonitoring,
        liveChatId: liveChatId,
        timestamp: new Date().toISOString()
    });
});

// YouTube monitoring status
router.get('/status', (req, res) => {
    res.json({
        isMonitoring: isMonitoring,
        liveChatId: liveChatId,
        configLoaded: !!currentConfig,
        processedMessagesCount: processedMessageIds.size
    });
});

// 基本的なメッセージエンドポイント
router.get('/messages', (req, res) => {
    res.json({
        messages: [],
        isMonitoring: isMonitoring
    });
});

// API Key test endpoint (admin only)
router.post('/test-api-key', requireAuth, async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                error: 'APIキーが提供されていません'
            });
        }
        
        // APIキーの基本形式チェック
        const apiKeyPattern = /^AIza[0-9A-Za-z-_]{35}$/;
        if (!apiKeyPattern.test(apiKey)) {
            return res.status(400).json({
                error: 'APIキーの形式が正しくありません',
                details: {
                    expected: 'AIzaから始まる39文字の英数字・ハイフン・アンダースコア',
                    received: `${apiKey.length}文字、先頭: ${apiKey.substring(0, 4)}`
                }
            });
        }
        
        console.log(`🧪 YouTube API Key テスト開始: ${apiKey.substring(0, 8)}...`);
        
        // YouTube Data API v3で簡単なリクエストを実行してAPIキーをテスト
        const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey}`;
        
        // HTTPリファラー制限に対応
        const requestOptions = {
            method: 'GET',
            headers: {
                'Referer': process.env.ADMIN_URL || 'http://localhost:8081',
                'User-Agent': 'ChatBot-Sage/1.0.0 (Backend API Test)'
            }
        };
        
        const response = await fetch(testUrl, requestOptions);
        const data = await response.json();
        
        console.log(`📡 YouTube API レスポンス: ${response.status}`, data);
        
        if (response.ok) {
            await addLog('info', 'YouTube API接続テスト成功', {
                quotaUsed: 'search request (100 units)',
                apiKeyPrefix: apiKey.substring(0, 8)
            });
            
            res.json({
                success: true,
                message: 'YouTube Data API接続成功',
                details: {
                    quotaUsed: '100ユニット（検索リクエスト）',
                    resultsFound: data.items ? data.items.length : 0,
                    apiKeyPrefix: apiKey.substring(0, 8) + '...'
                }
            });
        } else {
            await addLog('error', 'YouTube API接続テスト失敗', {
                status: response.status,
                error: data,
                apiKeyPrefix: apiKey.substring(0, 8)
            });
            
            let errorMessage = 'APIキーが無効か、YouTubeデータAPIが有効化されていません';
            let details = {
                status: response.status,
                reason: data.error?.errors?.[0]?.reason || 'unknown',
                message: data.error?.message || 'No detailed message'
            };
            
            if (response.status === 403) {
                if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
                    errorMessage = 'APIクォータが上限に達しています（日次制限: 10,000ユニット）';
                } else if (data.error?.errors?.[0]?.reason === 'accessNotConfigured') {
                    errorMessage = 'YouTube Data API v3が有効化されていません';
                    details.solution = 'Google Cloud ConsoleでYouTube Data API v3を有効化してください';
                } else if (data.error?.errors?.[0]?.reason === 'forbidden') {
                    errorMessage = 'APIキーにYouTube Data APIのアクセス権限がありません';
                }
            } else if (response.status === 400) {
                if (data.error?.errors?.[0]?.reason === 'keyInvalid') {
                    errorMessage = 'APIキーが無効です';
                    details.solution = 'Google Cloud ConsoleでAPIキーを再生成してください';
                } else {
                    errorMessage = `不正なリクエスト: ${data.error?.message || 'Unknown error'}`;
                }
            } else if (response.status === 401) {
                errorMessage = 'APIキーが認証されていません';
                details.solution = 'APIキーを確認して再入力してください';
            }
            
            res.status(400).json({
                error: errorMessage,
                details: details
            });
        }
        
    } catch (error) {
        console.error('YouTube API テストエラー:', error);
        await addLog('error', 'YouTube APIテスト実行エラー', { 
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            error: 'API接続テストの実行に失敗しました',
            message: error.message,
            details: {
                type: 'network_error',
                suggestion: 'インターネット接続とファイアウォール設定を確認してください'
            }
        });
    }
});

// API availability check endpoint (admin only)
router.post('/check-api-availability', requireAuth, async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                error: 'APIキーが提供されていません'
            });
        }
        
        console.log(`🔍 YouTube Data API v3 可用性チェック開始`);
        
        // より軽量なAPIエンドポイントでチェック - searchエンドポイントを使用
        const checkUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey}`;
        
        console.log(`📡 リクエストURL: ${checkUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
        
        // HTTPリファラー制限に対応するため、リファラーヘッダーを追加
        const requestOptions = {
            method: 'GET',
            headers: {
                'Referer': process.env.ADMIN_URL || 'http://localhost:8081',
                'User-Agent': 'ChatBot-Sage/1.0.0 (Backend API Test)'
            }
        };
        
        const response = await fetch(checkUrl, requestOptions);
        const data = await response.json();
        
        console.log(`📡 API可用性チェック結果: ${response.status}`, JSON.stringify(data, null, 2));
        
        if (response.ok) {
            res.json({
                success: true,
                message: 'YouTube Data API v3が利用可能です',
                details: {
                    status: 'API有効',
                    quotaUsed: '1ユニット（動画詳細取得）',
                    recommendation: 'このAPIキーでYouTubeライブチャット監視が可能です'
                }
            });
        } else {
            let errorMessage = 'YouTube Data API v3へのアクセスに問題があります';
            let solution = '';
            
            if (response.status === 403) {
                const reason = data.error?.errors?.[0]?.reason;
                if (reason === 'accessNotConfigured') {
                    errorMessage = 'YouTube Data API v3が有効化されていません';
                    solution = 'Google Cloud ConsoleでYouTube Data API v3を有効化してください';
                } else if (reason === 'forbidden') {
                    errorMessage = 'APIキーにYouTube Data APIのアクセス権限がありません';
                    solution = 'APIキーの制限設定でYouTube Data API v3を許可してください';
                } else if (reason === 'quotaExceeded') {
                    errorMessage = 'APIクォータが上限に達しています';
                    solution = '明日になるとクォータがリセットされます（日次制限: 10,000ユニット）';
                }
            }
            
            res.status(400).json({
                error: errorMessage,
                details: {
                    status: response.status,
                    reason: data.error?.errors?.[0]?.reason || 'unknown',
                    solution: solution,
                    message: data.error?.message,
                    fullError: data.error,
                    debugInfo: {
                        requestUrl: checkUrl.replace(apiKey, 'API_KEY_HIDDEN'),
                        responseHeaders: Object.fromEntries(response.headers.entries())
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('API可用性チェックエラー:', error);
        res.status(500).json({
            error: 'API可用性チェックに失敗しました',
            message: error.message
        });
    }
});

// Video connection test endpoint (admin only)
router.post('/test-video', requireAuth, async (req, res) => {
    try {
        const { youtubeApiKey, videoId } = req.body;
        
        if (!youtubeApiKey) {
            return res.status(400).json({
                error: 'YouTube API Keyが提供されていません'
            });
        }
        
        if (!videoId) {
            return res.status(400).json({
                error: '動画IDまたはURLが提供されていません',
                details: {
                    suggestion: 'YouTubeライブ配信のURLまたは動画IDを入力してください',
                    example: 'https://www.youtube.com/watch?v=VIDEO_ID または VIDEO_ID'
                }
            });
        }
        
        // Extract video ID from URL if provided
        let cleanVideoId = videoId.trim();
        
        // 複数のYouTube URLパターンに対応
        const urlPatterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of urlPatterns) {
            const match = cleanVideoId.match(pattern);
            if (match) {
                cleanVideoId = match[1];
                break;
            }
        }
        
        // 動画IDの形式チェック（YouTubeの動画IDは通常11文字）
        if (!/^[a-zA-Z0-9_-]{10,12}$/.test(cleanVideoId)) {
            await addLog('error', 'YouTube動画ID形式エラー', {
                originalInput: videoId,
                extractedId: cleanVideoId,
                inputLength: cleanVideoId.length
            });
            
            return res.status(400).json({
                error: '無効な動画IDです',
                details: {
                    provided: videoId,
                    extracted: cleanVideoId,
                    length: cleanVideoId.length,
                    expected: '10-12文字の英数字とハイフン、アンダースコア',
                    example: 'dQw4w9WgXcQ',
                    supportedUrls: [
                        'https://www.youtube.com/watch?v=VIDEO_ID',
                        'https://youtu.be/VIDEO_ID',
                        'https://www.youtube.com/live/VIDEO_ID',
                        'VIDEO_ID (直接入力)'
                    ]
                }
            });
        }
        
        await addLog('info', 'YouTube動画ID抽出成功', {
            originalInput: videoId,
            extractedId: cleanVideoId
        });
        
        // Test video info retrieval
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${cleanVideoId}&part=liveStreamingDetails,snippet&key=${youtubeApiKey}`;
        
        const response = await fetch(videoUrl, {
            headers: {
                'Referer': 'http://localhost:8081'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                const liveDetails = video.liveStreamingDetails;
                
                if (!liveDetails) {
                    return res.status(400).json({
                        error: 'この動画はライブ配信ではありません',
                        details: {
                            videoId: cleanVideoId,
                            title: video.snippet?.title || '不明',
                            suggestion: 'ライブ配信中の動画IDを指定してください'
                        }
                    });
                }
                
                if (!liveDetails.activeLiveChatId) {
                    return res.status(400).json({
                        error: 'この配信ではライブチャットが有効ではありません',
                        details: {
                            videoId: cleanVideoId,
                            title: video.snippet?.title || '不明',
                            isLive: !!liveDetails.actualStartTime && !liveDetails.actualEndTime,
                            suggestion: 'ライブチャットが有効な配信を指定してください'
                        }
                    });
                }
                
                await addLog('info', 'YouTube動画接続テスト成功', {
                    videoId: cleanVideoId,
                    title: video.snippet?.title,
                    liveChatId: liveDetails.activeLiveChatId
                });
                
                res.json({
                    success: true,
                    message: 'ライブ配信への接続に成功しました',
                    videoInfo: {
                        videoId: cleanVideoId,
                        title: video.snippet?.title || '不明',
                        liveChatId: liveDetails.activeLiveChatId,
                        isLive: !!liveDetails.actualStartTime && !liveDetails.actualEndTime,
                        startTime: liveDetails.actualStartTime,
                        channelTitle: video.snippet?.channelTitle
                    },
                    quotaUsed: 'videos.list: 1ユニット'
                });
            } else {
                res.status(404).json({
                    error: '指定された動画IDが見つかりません',
                    details: {
                        videoId: cleanVideoId,
                        suggestion: '動画IDが正しいか確認してください',
                        possibleCauses: [
                            '動画が削除されている',
                            '動画が非公開設定になっている',
                            '動画IDが間違っている'
                        ]
                    }
                });
            }
        } else {
            let errorMessage = 'YouTube API接続に失敗しました';
            let details = {
                status: response.status,
                reason: data.error?.errors?.[0]?.reason || 'unknown',
                message: data.error?.message || 'No detailed message'
            };
            
            if (response.status === 403) {
                if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
                    errorMessage = 'APIクォータが上限に達しています';
                    details.solution = '明日になるとクォータがリセットされます';
                } else if (data.error?.errors?.[0]?.reason === 'accessNotConfigured') {
                    errorMessage = 'YouTube Data API v3が有効化されていません';
                    details.solution = 'Google Cloud ConsoleでAPIを有効化してください';
                }
            } else if (response.status === 400) {
                errorMessage = `不正なリクエスト: ${data.error?.message || 'Unknown error'}`;
            } else if (response.status === 401) {
                errorMessage = 'APIキーが認証されていません';
                details.solution = 'APIキーを確認して再入力してください';
            }
            
            await addLog('error', 'YouTube動画接続テスト失敗', {
                videoId: cleanVideoId,
                status: response.status,
                error: data,
                apiKeyPrefix: youtubeApiKey.substring(0, 8)
            });
            
            res.status(400).json({
                error: errorMessage,
                details: details
            });
        }
        
    } catch (error) {
        console.error('YouTube動画テストエラー:', error);
        await addLog('error', 'YouTube動画テスト実行エラー', { 
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            error: '動画接続テストの実行に失敗しました',
            message: error.message,
            details: {
                type: 'network_error',
                suggestion: 'インターネット接続とファイアウォール設定を確認してください'
            }
        });
    }
});

// Start YouTube monitoring (admin only)
router.post('/start', requireAuth, async (req, res) => {
    try {
        if (isMonitoring) {
            return res.status(400).json({
                error: '既に監視中です'
            });
        }
        
        currentConfig = await getConfig();
        
        if (!currentConfig.youtubeApiKey || !currentConfig.videoId) {
            return res.status(400).json({
                error: 'YouTube API KeyまたはVideo IDが設定されていません'
            });
        }
        
        isMonitoring = true;
        processedMessageIds.clear();
        
        // 最初にライブチャットIDを取得
        await getLiveChatId();
        
        if (!liveChatId) {
            isMonitoring = false;
            return res.status(400).json({
                error: 'ライブチャットIDの取得に失敗しました。配信がライブ状態でない可能性があります。'
            });
        }
        
        // 監視インターバルを開始
        const interval = (currentConfig.checkInterval || 10) * 1000; // 秒をミリ秒に変換
        monitoringInterval = setInterval(async () => {
            await fetchLiveChatMessages();
        }, interval);
        
        await addLog('info', 'YouTube監視開始', {
            videoId: currentConfig.videoId,
            liveChatId: liveChatId,
            interval: interval / 1000
        });
        
        console.log('🎥 YouTube監視開始', {
            videoId: currentConfig.videoId,
            liveChatId: liveChatId,
            interval: interval / 1000 + '秒'
        });
        
        res.json({
            success: true,
            message: 'YouTube監視を開始しました',
            videoId: currentConfig.videoId,
            liveChatId: liveChatId,
            interval: interval / 1000
        });
        
    } catch (error) {
        console.error('YouTube監視開始エラー:', error);
        res.status(500).json({
            error: 'YouTube監視の開始に失敗しました',
            message: error.message
        });
    }
});

// Stop YouTube monitoring (admin only)
router.post('/stop', requireAuth, async (req, res) => {
    try {
        if (!isMonitoring) {
            return res.status(400).json({
                error: '監視は実行されていません'
            });
        }
        
        await stopMonitoring();
        messageQueue = [];
        currentConfig = null;
        
        console.log('⏹️ YouTube監視停止');
        
        res.json({
            success: true,
            message: 'YouTube監視を停止しました'
        });
        
    } catch (error) {
        console.error('YouTube監視停止エラー:', error);
        res.status(500).json({
            error: 'YouTube監視の停止に失敗しました',
            message: error.message
        });
    }
});

// ライブチャットIDを取得する関数
async function getLiveChatId() {
    try {
        if (!currentConfig?.youtubeApiKey || !currentConfig?.videoId) {
            console.error('設定が不足しています');
            return null;
        }

        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${currentConfig.videoId}&part=liveStreamingDetails&key=${currentConfig.youtubeApiKey}`;
        
        const response = await fetch(videoUrl, {
            headers: {
                'Referer': 'http://localhost:3001'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.items && data.items.length > 0) {
            const liveDetails = data.items[0].liveStreamingDetails;
            if (liveDetails && liveDetails.activeLiveChatId) {
                liveChatId = liveDetails.activeLiveChatId;
                await addLog('info', 'ライブチャットID取得成功', {
                    videoId: currentConfig.videoId,
                    liveChatId: liveChatId
                });
                return liveChatId;
            } else {
                await addLog('error', 'ライブチャットが見つかりません', {
                    videoId: currentConfig.videoId,
                    liveDetails: liveDetails
                });
                return null;
            }
        } else {
            await addLog('error', 'ビデオ情報の取得に失敗', {
                status: response.status,
                error: data
            });
            return null;
        }
    } catch (error) {
        console.error('ライブチャットID取得エラー:', error);
        await addLog('error', 'ライブチャットID取得エラー', {
            error: error.message
        });
        return null;
    }
}

// ライブチャットメッセージを取得する関数
async function fetchLiveChatMessages() {
    try {
        if (!liveChatId || !currentConfig?.youtubeApiKey) {
            return;
        }

        const chatUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${currentConfig.youtubeApiKey}`;
        
        const response = await fetch(chatUrl, {
            headers: {
                'Referer': 'http://localhost:3001'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.items && data.items.length > 0) {
                const newMessages = data.items.filter(item => 
                    !processedMessageIds.has(item.id)
                );
                
                for (const message of newMessages) {
                    processedMessageIds.set(message.id, true);
                    
                    const chatMessage = {
                        id: message.id,
                        author: message.authorDetails.displayName,
                        text: message.snippet.displayMessage,
                        timestamp: message.snippet.publishedAt,
                        type: 'youtube_chat'
                    };
                    
                    // メッセージをキューに追加
                    messageQueue.push(chatMessage);
                    
                    console.log('📺 新しいYouTubeメッセージ:', {
                        author: chatMessage.author,
                        text: chatMessage.text
                    });
                    
                    await addLog('info', 'YouTubeメッセージ受信', {
                        author: chatMessage.author,
                        text: chatMessage.text,
                        messageId: chatMessage.id
                    });
                }
                
                // キューサイズを制限（最新100件まで）
                if (messageQueue.length > 100) {
                    messageQueue = messageQueue.slice(-100);
                }
            }
        } else {
            console.error('ライブチャットメッセージ取得エラー:', data);
            await addLog('error', 'ライブチャットメッセージ取得エラー', {
                status: response.status,
                error: data
            });
            
            // クォータ制限やその他のエラーで監視を停止
            if (response.status === 403) {
                console.log('⚠️ APIクォータ制限により監視を停止します');
                await stopMonitoring();
            }
        }
    } catch (error) {
        console.error('ライブチャットメッセージ取得エラー:', error);
        await addLog('error', 'ライブチャットメッセージ取得例外', {
            error: error.message
        });
    }
}

// 監視停止のヘルパー関数
async function stopMonitoring() {
    isMonitoring = false;
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
    processedMessageIds.clear();
    liveChatId = null;
    await addLog('info', 'YouTube監視停止');
}

module.exports = router;
