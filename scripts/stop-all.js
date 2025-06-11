#!/usr/bin/env node

/**
 * ChatBot Sage 統合停止スクリプト
 * npm stop で全サーバーを安全に停止
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ChatBotSageStopper {
    constructor() {
        this.pidsFile = path.join(__dirname, '..', '.pids');
        
        // 色付きロガー
        this.log = {
            info: (msg) => console.log(chalk.blue('ℹ️ '), msg),
            success: (msg) => console.log(chalk.green('✅'), msg),
            warning: (msg) => console.log(chalk.yellow('⚠️ '), msg),
            error: (msg) => console.log(chalk.red('❌'), msg),
            title: (msg) => console.log(chalk.cyan.bold(msg)),
            subtitle: (msg) => console.log(chalk.yellow(msg))
        };
    }
    
    async stop() {
        this.log.title('⏹️  ChatBot Sage 停止中...');
        this.log.subtitle('=========================');
        
        try {
            // PIDファイルから停止
            await this.stopFromPidFile();
            
            // ポート別に停止
            await this.stopByPorts();
            
            // 残存プロセスクリーンアップ
            await this.cleanupProcesses();
            
            // ファイルクリーンアップ
            this.cleanup();
            
            this.log.success('🎉 ChatBot Sage の停止が完了しました！');
            
        } catch (error) {
            this.log.error(`停止処理でエラーが発生しました: ${error.message}`);
            process.exit(1);
        }
    }
    
    async stopFromPidFile() {
        if (!fs.existsSync(this.pidsFile)) {
            this.log.info('PIDファイルが見つかりません');
            return;
        }
        
        this.log.info('PIDファイルからプロセスを停止中...');
        
        const pidsContent = fs.readFileSync(this.pidsFile, 'utf8').trim();
        if (!pidsContent) {
            this.log.info('PIDファイルが空です');
            return;
        }
        
        const pids = pidsContent.split('\n').filter(Boolean);
        
        for (const pid of pids) {
            await this.stopProcess(parseInt(pid));
        }
        
        this.log.success('PIDファイルからの停止完了');
    }
    
    async stopByPorts() {
        this.log.info('ポート使用中のプロセスをチェック中...');
        
        const ports = [
            { port: 3001, name: 'バックエンド' },
            { port: 8080, name: 'フロントエンド' },
            { port: 8081, name: '管理画面' }
        ];
        
        for (const { port, name } of ports) {
            await this.stopPortProcess(port, name);
        }
    }
    
    async stopPortProcess(port, name) {
        try {
            const { stdout } = await this.runCommand(`lsof -ti:${port}`);
            if (stdout.trim()) {
                const pids = stdout.trim().split('\n').filter(Boolean);
                for (const pid of pids) {
                    this.log.info(`${name}(ポート${port})のプロセス${pid}を停止中...`);
                    await this.stopProcess(parseInt(pid));
                }
            }
        } catch (e) {
            // ポートが使用されていない場合は無視
            this.log.info(`ポート${port}は使用されていません`);
        }
    }
    
    async stopProcess(pid) {
        try {
            // プロセスが存在するかチェック
            await this.runCommand(`ps -p ${pid}`);
            
            // SIGTERM で優しく停止
            this.log.info(`プロセス ${pid} を停止中...`);
            await this.runCommand(`kill ${pid}`);
            
            // 5秒待機
            let stopped = false;
            for (let i = 0; i < 50; i++) {
                try {
                    await this.runCommand(`ps -p ${pid}`);
                    await this.sleep(100);
                } catch (e) {
                    stopped = true;
                    break;
                }
            }
            
            // まだ動いている場合は強制停止
            if (!stopped) {
                this.log.warning(`プロセス ${pid} を強制停止中...`);
                try {
                    await this.runCommand(`kill -9 ${pid}`);
                } catch (e) {
                    // 既に停止している場合は無視
                }
            }
            
            this.log.success(`プロセス ${pid} を停止しました`);
            
        } catch (e) {
            // プロセスが既に存在しない場合は無視
            this.log.info(`プロセス ${pid} は既に停止しています`);
        }
    }
    
    async cleanupProcesses() {
        this.log.info('残存プロセスをクリーンアップ中...');
        
        // Node.js関連プロセス
        try {
            const { stdout } = await this.runCommand(`pgrep -f "chatbot-sage|app.js"`);
            if (stdout.trim()) {
                const pids = stdout.trim().split('\n').filter(Boolean);
                for (const pid of pids) {
                    await this.stopProcess(parseInt(pid));
                }
            }
        } catch (e) {
            // プロセスが見つからない場合は無視
        }
        
        // Python HTTPサーバー関連プロセス
        try {
            const { stdout } = await this.runCommand(`pgrep -f "http.server.*80[89][01]"`);
            if (stdout.trim()) {
                const pids = stdout.trim().split('\n').filter(Boolean);
                for (const pid of pids) {
                    await this.stopProcess(parseInt(pid));
                }
            }
        } catch (e) {
            // プロセスが見つからない場合は無視
        }
    }
    
    cleanup() {
        this.log.info('一時ファイルをクリーンアップ中...');
        
        const filesToClean = [
            this.pidsFile,
            path.join(__dirname, '..', 'backend.log'),
            path.join(__dirname, '..', 'frontend.log'),
            path.join(__dirname, '..', 'admin.log')
        ];
        
        for (const file of filesToClean) {
            if (fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                    this.log.info(`${path.basename(file)} を削除しました`);
                } catch (e) {
                    this.log.warning(`${path.basename(file)} の削除に失敗: ${e.message}`);
                }
            }
        }
    }
    
    // ユーティリティメソッド
    runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// メイン実行
const stopper = new ChatBotSageStopper();
stopper.stop().catch(error => {
    console.error(chalk.red('Fatal Error:'), error.message);
    process.exit(1);
});
