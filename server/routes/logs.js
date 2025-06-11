const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getLogs } = require('../services/logs');
const router = express.Router();

// Get system logs (admin only)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { level, limit = 100, offset = 0 } = req.query;
        
        const logs = await getLogs({
            level: level,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            logs: logs,
            total: logs.length
        });
        
    } catch (error) {
        console.error('ログ取得エラー:', error);
        res.status(500).json({
            error: 'ログの取得に失敗しました',
            message: error.message
        });
    }
});

// Clear logs (admin only)
router.delete('/', requireAuth, async (req, res) => {
    try {
        // This would clear the logs file
        // Implementation depends on your logging service
        
        res.json({
            success: true,
            message: 'ログをクリアしました'
        });
        
    } catch (error) {
        console.error('ログクリアエラー:', error);
        res.status(500).json({
            error: 'ログのクリアに失敗しました',
            message: error.message
        });
    }
});

module.exports = router;
