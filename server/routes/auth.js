const express = require('express');
const { validateAdminCredentials } = require('../middleware/auth');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                error: 'ユーザー名とパスワードが必要です'
            });
        }
        
        const isValid = await validateAdminCredentials(username, password);
        
        if (!isValid) {
            // Add delay to prevent brute force attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return res.status(401).json({
                error: '認証に失敗しました',
                message: 'ユーザー名またはパスワードが正しくありません'
            });
        }
        
        req.session.authenticated = true;
        req.session.username = username;
        req.session.loginTime = new Date().toISOString();
        
        console.log(`✅ 管理者ログイン成功: ${username} at ${req.session.loginTime}`);
        
        res.json({
            success: true,
            message: 'ログインに成功しました',
            user: {
                username: username,
                loginTime: req.session.loginTime
            }
        });
        
    } catch (error) {
        console.error('ログインエラー:', error);
        res.status(500).json({
            error: 'ログイン処理中にエラーが発生しました'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    const username = req.session.username;
    
    req.session.destroy((err) => {
        if (err) {
            console.error('ログアウトエラー:', err);
            return res.status(500).json({
                error: 'ログアウト処理中にエラーが発生しました'
            });
        }
        
        console.log(`📤 管理者ログアウト: ${username}`);
        
        res.json({
            success: true,
            message: 'ログアウトしました'
        });
    });
});

// Check authentication status
router.get('/status', (req, res) => {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({
            authenticated: false,
            message: '認証されていません'
        });
    }
    
    res.json({
        authenticated: true,
        user: {
            username: req.session.username,
            loginTime: req.session.loginTime
        }
    });
});

module.exports = router;
