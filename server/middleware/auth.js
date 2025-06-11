const bcrypt = require('bcryptjs');

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({
            error: '認証が必要です',
            message: '管理画面にログインしてください'
        });
    }
    next();
};

// Admin user validation
const validateAdminCredentials = async (username, password) => {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    if (!adminPasswordHash) {
        throw new Error('管理者パスワードが設定されていません');
    }
    
    if (username !== adminUsername) {
        return false;
    }
    
    try {
        return await bcrypt.compare(password, adminPasswordHash);
    } catch (error) {
        console.error('パスワード検証エラー:', error);
        return false;
    }
};

// Generate password hash (for setup)
const generatePasswordHash = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

module.exports = {
    requireAuth,
    validateAdminCredentials,
    generatePasswordHash
};
