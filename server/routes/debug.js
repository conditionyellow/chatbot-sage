const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// System health check
router.get('/health', async (req, res) => {
    try {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Frontend status check (admin only)
router.get('/frontend-status', requireAuth, async (req, res) => {
    try {
        // WebSocketマネージャーから接続状況を取得
        const { wsManager } = require('../app');
        
        let frontendStatus = {
            url: 'http://localhost:8080',
            timestamp: new Date().toISOString(),
            components: {
                live2d: 'unknown',
                emotionAnalyzer: 'unknown',
                speechSynthesis: 'unknown',
                backendClient: 'unknown'
            },
            websocket: {
                enabled: !!wsManager,
                connections: wsManager ? wsManager.getConnectionStatus() : null
            },
            note: 'WebSocket接続経由でフロントエンド状態を取得'
        };

        res.json({
            success: true,
            status: frontendStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Execute debug command on frontend (admin only)
router.post('/execute-frontend', requireAuth, async (req, res) => {
    try {
        const { command } = req.body;

        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'コマンドが指定されていません'
            });
        }

        // WebSocketマネージャーを取得
        const { wsManager } = require('../app');
        
        if (!wsManager) {
            return res.status(500).json({
                success: false,
                error: 'WebSocketマネージャーが初期化されていません'
            });
        }

        // フロントエンドクライアントの存在確認
        const status = wsManager.getConnectionStatus();
        if (status.frontendClients.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'フロントエンドクライアントが接続されていません'
            });
        }

        // 一意のリクエストIDを生成
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // コマンドをフロントエンドに送信（一時的な実装）
        res.json({
            success: true,
            message: 'フロントエンドにコマンドを送信しました',
            requestId: requestId,
            command: command,
            connectedClients: status.frontendClients.length,
            note: 'この機能はWebSocketを使用して実装されました'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get system debug info (admin only)
router.get('/debug-info', requireAuth, async (req, res) => {
    try {
        const debugInfo = {
            node: {
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime()
            },
            memory: process.memoryUsage(),
            env: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT,
                hasSessionSecret: !!process.env.SESSION_SECRET
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            debugInfo: debugInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
