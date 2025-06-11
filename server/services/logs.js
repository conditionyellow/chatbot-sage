const fs = require('fs-extra');
const path = require('path');

const LOGS_FILE = process.env.LOGS_FILE_PATH || './data/logs.json';
const MAX_LOG_ENTRIES = 1000;

// Log levels
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(LOGS_FILE);
    await fs.ensureDir(dataDir);
}

// Add log entry
async function addLog(level, message, data = {}) {
    try {
        await ensureDataDirectory();
        
        const logEntry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data
        };
        
        let logs = [];
        
        // Read existing logs
        if (await fs.pathExists(LOGS_FILE)) {
            try {
                logs = await fs.readJson(LOGS_FILE);
            } catch (error) {
                console.error('ログファイル読み込みエラー:', error);
                logs = [];
            }
        }
        
        // Add new log entry
        logs.unshift(logEntry); // Add to beginning
        
        // Limit log entries
        if (logs.length > MAX_LOG_ENTRIES) {
            logs = logs.slice(0, MAX_LOG_ENTRIES);
        }
        
        // Save logs
        await fs.writeJson(LOGS_FILE, logs, { spaces: 2 });
        
        // Also log to console
        const consoleMessage = `[${level.toUpperCase()}] ${message}`;
        switch (level) {
            case 'error':
                console.error(consoleMessage, data);
                break;
            case 'warn':
                console.warn(consoleMessage, data);
                break;
            case 'info':
                console.info(consoleMessage, data);
                break;
            case 'debug':
                console.debug(consoleMessage, data);
                break;
            default:
                console.log(consoleMessage, data);
        }
        
    } catch (error) {
        console.error('ログ追加エラー:', error);
    }
}

// Get logs with filtering
async function getLogs(options = {}) {
    try {
        await ensureDataDirectory();
        
        if (!await fs.pathExists(LOGS_FILE)) {
            return [];
        }
        
        let logs = await fs.readJson(LOGS_FILE);
        
        // Filter by level
        if (options.level) {
            const minLevel = LOG_LEVELS[options.level] ?? 2;
            logs = logs.filter(log => (LOG_LEVELS[log.level] ?? 2) <= minLevel);
        }
        
        // Apply pagination
        const offset = options.offset || 0;
        const limit = options.limit || 100;
        
        return logs.slice(offset, offset + limit);
        
    } catch (error) {
        console.error('ログ取得エラー:', error);
        return [];
    }
}

// Clear logs
async function clearLogs() {
    try {
        await ensureDataDirectory();
        await fs.writeJson(LOGS_FILE, [], { spaces: 2 });
        console.log('📝 ログクリア完了');
    } catch (error) {
        console.error('ログクリアエラー:', error);
        throw new Error('ログのクリアに失敗しました');
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
    addLog,
    getLogs,
    clearLogs,
    LOG_LEVELS
};
