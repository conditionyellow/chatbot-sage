const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = process.env.CONFIG_FILE_PATH || './data/config.json';

// Default configuration
const DEFAULT_CONFIG = {
    youtubeApiKey: '',
    videoId: '',
    checkInterval: 10,
    systemSettings: {
        enableLogging: true,
        logLevel: 'info',
        maxLogEntries: 1000
    },
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
};

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(CONFIG_FILE);
    await fs.ensureDir(dataDir);
}

// Get configuration
async function getConfig() {
    try {
        await ensureDataDirectory();
        
        if (await fs.pathExists(CONFIG_FILE)) {
            const configData = await fs.readJson(CONFIG_FILE);
            return { ...DEFAULT_CONFIG, ...configData };
        } else {
            // Create default config file
            await saveConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
    } catch (error) {
        console.error('設定ファイル読み込みエラー:', error);
        return DEFAULT_CONFIG;
    }
}

// Save configuration
async function saveConfig(config) {
    try {
        await ensureDataDirectory();
        
        const configToSave = {
            ...config,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeJson(CONFIG_FILE, configToSave, { spaces: 2 });
        console.log('📝 設定ファイル保存完了:', CONFIG_FILE);
        
        return configToSave;
    } catch (error) {
        console.error('設定ファイル保存エラー:', error);
        throw new Error('設定の保存に失敗しました');
    }
}

// Validate configuration
function validateConfig(config) {
    const errors = [];
    
    if (!config.youtubeApiKey) {
        errors.push('YouTube API Keyが必要です');
    } else if (config.youtubeApiKey.length < 30) {
        errors.push('YouTube API Keyが短すぎます');
    }
    
    if (config.checkInterval && (config.checkInterval < 5 || config.checkInterval > 60)) {
        errors.push('チェック間隔は5-60秒の範囲で設定してください');
    }
    
    return errors;
}

module.exports = {
    getConfig,
    saveConfig,
    validateConfig,
    DEFAULT_CONFIG
};
