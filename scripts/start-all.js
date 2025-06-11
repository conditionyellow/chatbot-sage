#!/usr/bin/env node

/**
 * ChatBot Sage 統合起動スクリプト
 * npm start または npm run dev で全サーバーを連動起動
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ChatBotSageStarter {
    constructor() {
        this.processes = [];
        this.pidsFile = path.join(__dirname, '..', '.pids');
        this.logDir = path.join(__dirname, '..', 'logs');
        this.isDev = process.argv.includes('--dev');
        
        // ログディレクトリを作成
        this.ensureLogDirectory();
        
        // 色付きロガー
        this.log = {
            info: (msg) => console.log(chalk.blue('ℹ️ '), msg),
            success: (msg) => console.log(chalk.green('✅'), msg),
            warning: (msg) => console.log(chalk.yellow('⚠️ '), msg),
            error: (msg) => console.log(chalk.red('❌'), msg),
            title: (msg) => console.log(chalk.cyan.bold(msg)),
            subtitle: (msg) => console.log(chalk.yellow(msg))
        };
        
        // 終了処理
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
        process.on('exit', () => this.cleanup());
    }
    
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    async start() {
        this.log.title('🚀 ChatBot Sage 統合起動中...');
        this.log.subtitle('==============================');
        
        try {
            // 依存関係チェック
            await this.checkDependencies();
            
            // 既存プロセス停止
            await this.stopExistingProcesses();
            
            // サーバー起動
            await this.startBackend();
            await this.startFrontend();
            await this.startAdmin();
            
            // PIDファイル保存
            this.savePids();
            
            // 起動完了メッセージ
            this.showStartupComplete();
            
            // プロセス監視開始
            this.startProcessMonitoring();
            
        } catch (error) {
            this.log.error(`起動に失敗しました: ${error.message}`);
            await this.shutdown();
            process.exit(1);
        }
    }
    
    async checkDependencies() {
        this.log.info('依存関係をチェック中...');
        
        const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            this.log.warning('依存関係をインストール中...');
            await this.runCommand('npm install', { stdio: 'inherit' });
        }
        
        this.log.success('依存関係OK');
    }
    
    async stopExistingProcesses() {
        this.log.info('既存プロセスをチェック中...');
        
        const ports = [3001, 8080, 8081];
        for (const port of ports) {
            await this.killPortProcess(port);
        }
        
        // 既存PIDファイルからも停止
        if (fs.existsSync(this.pidsFile)) {
            const pids = fs.readFileSync(this.pidsFile, 'utf8').trim().split('\n').filter(Boolean);
            for (const pid of pids) {
                try {
                    process.kill(parseInt(pid), 'SIGTERM');
                    this.log.info(`既存プロセス ${pid} を停止しました`);
                } catch (e) {
                    // プロセスが既に存在しない場合は無視
                }
            }
            fs.unlinkSync(this.pidsFile);
        }
    }
    
    async killPortProcess(port) {
        try {
            const { stdout } = await this.runCommand(`lsof -ti:${port}`);
            if (stdout.trim()) {
                const pid = stdout.trim();
                await this.runCommand(`kill ${pid}`);
                this.log.warning(`ポート${port}のプロセス(${pid})を停止しました`);
                // 少し待機
                await this.sleep(1000);
            }
        } catch (e) {
            // ポートが使用されていない場合は無視
        }
    }
    
    async startBackend() {
        this.log.info('バックエンドサーバーを起動中...');
        
        const command = this.isDev ? 'nodemon' : 'node';
        const args = [path.join(__dirname, '..', 'server', 'app.js')];
        
        const backendProcess = spawn(command, args, {
            cwd: path.join(__dirname, '..'),
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });
        
        // ログファイルに出力を保存
        const logFile = fs.createWriteStream(path.join(this.logDir, 'backend.log'), { flags: 'a' });
        backendProcess.stdout.pipe(logFile);
        backendProcess.stderr.pipe(logFile);
        
        // コンソールにも出力（開発モードの場合）
        if (this.isDev) {
            backendProcess.stdout.on('data', (data) => {
                console.log(chalk.gray(`[Backend] ${data.toString().trim()}`));
            });
            backendProcess.stderr.on('data', (data) => {
                console.error(chalk.red(`[Backend Error] ${data.toString().trim()}`));
            });
        }
        
        this.processes.push({
            name: 'Backend',
            process: backendProcess,
            port: 3001,
            url: 'http://localhost:3001'
        });
        
        // 起動確認
        await this.waitForPort(3001, 10000);
        this.log.success(`バックエンドサーバー起動完了 (PID: ${backendProcess.pid})`);
    }
    
    async startFrontend() {
        this.log.info('フロントエンドサーバーを起動中...');
        
        const frontendProcess = spawn('python3', ['-m', 'http.server', '8080', '--directory', 'public'], {
            cwd: path.join(__dirname, '..'),
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });
        
        // ログファイルに出力を保存
        const logFile = fs.createWriteStream(path.join(this.logDir, 'frontend.log'), { flags: 'a' });
        frontendProcess.stdout.pipe(logFile);
        frontendProcess.stderr.pipe(logFile);
        
        this.processes.push({
            name: 'Frontend',
            process: frontendProcess,
            port: 8080,
            url: 'http://localhost:8080'
        });
        
        // 起動確認
        await this.waitForPort(8080, 5000);
        this.log.success(`フロントエンドサーバー起動完了 (PID: ${frontendProcess.pid})`);
    }
    
    async startAdmin() {
        this.log.info('管理画面サーバーを起動中...');
        
        const adminProcess = spawn('python3', ['-m', 'http.server', '8081', '--directory', 'admin'], {
            cwd: path.join(__dirname, '..'),
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });
        
        // ログファイルに出力を保存
        const logFile = fs.createWriteStream(path.join(this.logDir, 'admin.log'), { flags: 'a' });
        adminProcess.stdout.pipe(logFile);
        adminProcess.stderr.pipe(logFile);
        
        this.processes.push({
            name: 'Admin',
            process: adminProcess,
            port: 8081,
            url: 'http://localhost:8081'
        });
        
        // 起動確認
        await this.waitForPort(8081, 5000);
        this.log.success(`管理画面サーバー起動完了 (PID: ${adminProcess.pid})`);
    }
    
    savePids() {
        const pids = this.processes.map(p => p.process.pid).join('\n');
        fs.writeFileSync(this.pidsFile, pids);
        this.log.info('PIDファイルを保存しました');
    }
    
    showStartupComplete() {
        console.log('');
        this.log.success('🎉 ChatBot Sage の起動が完了しました！');
        this.log.subtitle('==============================');
        console.log(chalk.blue('📱 フロントエンド:'), chalk.underline('http://localhost:8080'));
        console.log(chalk.blue('⚙️  管理画面:'), chalk.underline('http://localhost:8081'));
        console.log(chalk.blue('🔧 バックエンドAPI:'), chalk.underline('http://localhost:3001'));
        console.log('');
        this.log.subtitle('管理画面ログイン情報:');
        console.log('ユーザー名: admin');
        console.log('パスワード: chloe2025');
        console.log('');
        this.log.warning('停止するには: npm stop または Ctrl+C を押してください');
        console.log('');
        this.log.success('ブラウザでアクセスして楽しんでください！');
        
        if (this.isDev) {
            console.log('');
            this.log.info('開発モードで起動中 - ファイル変更を自動監視しています');
        }
    }
    
    startProcessMonitoring() {
        // プロセス終了監視
        this.processes.forEach(({ name, process }) => {
            process.on('exit', (code, signal) => {
                if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
                    this.log.error(`${name}が異常終了しました (code: ${code}, signal: ${signal})`);
                    this.shutdown();
                }
            });
            
            process.on('error', (error) => {
                this.log.error(`${name}でエラーが発生しました: ${error.message}`);
                this.shutdown();
            });
        });
    }
    
    async shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('');
        this.log.warning('ChatBot Sage を停止中...');
        
        // 全プロセス停止
        for (const { name, process } of this.processes) {
            try {
                if (!process.killed) {
                    this.log.info(`${name}を停止中...`);
                    process.kill('SIGTERM');
                    
                    // 3秒待って強制終了
                    setTimeout(() => {
                        if (!process.killed) {
                            process.kill('SIGKILL');
                        }
                    }, 3000);
                }
            } catch (error) {
                this.log.error(`${name}の停止に失敗: ${error.message}`);
            }
        }
        
        // 少し待機
        await this.sleep(2000);
        
        this.cleanup();
        this.log.success('ChatBot Sage を停止しました');
        process.exit(0);
    }
    
    cleanup() {
        // PIDファイル削除
        if (fs.existsSync(this.pidsFile)) {
            fs.unlinkSync(this.pidsFile);
        }
    }
    
    // ユーティリティメソッド
    runCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            exec(command, options, (error, stdout, stderr) => {
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
    
    async waitForPort(port, timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                await this.runCommand(`nc -z localhost ${port}`);
                return; // ポートが利用可能
            } catch (e) {
                await this.sleep(500);
            }
        }
        
        throw new Error(`ポート${port}の起動タイムアウト`);
    }
}

// メイン実行
const starter = new ChatBotSageStarter();
starter.start().catch(error => {
    console.error(chalk.red('Fatal Error:'), error.message);
    process.exit(1);
});
