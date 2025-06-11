const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getConfig, saveConfig } = require('../services/config');
const router = express.Router();

// Get configuration (admin only)
router.get('/', requireAuth, async (req, res) => {
    try {
        const config = await getConfig();
        
        // Don't expose the API key in logs
        console.log('📋 設定取得要求');
        
        res.json({
            success: true,
            config: config
        });
        
    } catch (error) {
        console.error('設定取得エラー:', error);
        res.status(500).json({
            error: '設定の取得に失敗しました',
            message: error.message
        });
    }
});

// Save configuration (admin only)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { youtubeApiKey, videoId, checkInterval, systemSettings } = req.body;
        
        // Validate required fields
        if (!youtubeApiKey) {
            return res.status(400).json({
                error: 'YouTube API Keyが必要です'
            });
        }
        
        if (youtubeApiKey.length < 30) {
            return res.status(400).json({
                error: 'YouTube API Keyが短すぎます（通常39文字）'
            });
        }
        
        const config = {
            youtubeApiKey: youtubeApiKey.trim(),
            videoId: videoId ? videoId.trim() : '',
            checkInterval: parseInt(checkInterval) || 10,
            systemSettings: systemSettings || {},
            lastUpdated: new Date().toISOString(),
            updatedBy: req.session.username
        };
        
        await saveConfig(config);
        
        console.log(`💾 設定保存完了: ${req.session.username} が YouTube設定を更新`);
        
        res.json({
            success: true,
            message: '設定を保存しました',
            config: {
                ...config,
                youtubeApiKey: '***HIDDEN***' // Don't return the API key
            }
        });
        
    } catch (error) {
        console.error('設定保存エラー:', error);
        res.status(500).json({
            error: '設定の保存に失敗しました',
            message: error.message
        });
    }
});

// Test YouTube connection (admin only)
router.post('/test-youtube', requireAuth, async (req, res) => {
    try {
        const { youtubeApiKey, videoId } = req.body;
        
        if (!youtubeApiKey || !videoId) {
            return res.status(400).json({
                error: 'YouTube API KeyとVideo IDが必要です'
            });
        }
        
        // Extract video ID if URL is provided
        const extractedVideoId = extractVideoId(videoId);
        
        // Test YouTube API connection
        const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${extractedVideoId}&key=${youtubeApiKey}`;
        
        const response = await fetch(testUrl);
        
        if (!response.ok) {
            let errorMessage = `YouTube API エラー (${response.status})`;
            
            if (response.status === 403) {
                errorMessage = 'API Keyが無効か、YouTubeデータAPIが有効化されていません';
            } else if (response.status === 404) {
                errorMessage = '指定された動画が見つかりません';
            } else if (response.status === 400) {
                errorMessage = 'リクエストパラメータが不正です';
            }
            
            return res.status(response.status).json({
                error: errorMessage,
                details: await response.text()
            });
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return res.status(404).json({
                error: '指定された動画が見つかりません',
                videoId: extractedVideoId
            });
        }
        
        const video = data.items[0];
        const liveDetails = video.liveStreamingDetails;
        
        if (!liveDetails || !liveDetails.activeLiveChatId) {
            return res.status(400).json({
                error: 'この動画はライブ配信ではないか、チャットが無効です',
                videoId: extractedVideoId
            });
        }
        
        console.log(`✅ YouTube接続テスト成功: ${extractedVideoId}`);
        
        res.json({
            success: true,
            message: 'YouTube APIとの接続テストに成功しました',
            videoInfo: {
                videoId: extractedVideoId,
                liveChatId: liveDetails.activeLiveChatId,
                title: video.snippet?.title || 'タイトル不明'
            }
        });
        
    } catch (error) {
        console.error('YouTube接続テストエラー:', error);
        res.status(500).json({
            error: 'YouTube接続テストに失敗しました',
            message: error.message
        });
    }
});

// Helper function to extract video ID
function extractVideoId(input) {
    if (!input) return '';
    
    // Direct video ID
    if (input.length === 11 && !input.includes('/')) {
        return input;
    }
    
    // YouTube URL patterns
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) return match[1];
    }
    
    return input; // Return as-is if no pattern matches
}

module.exports = router;
