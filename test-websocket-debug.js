#!/usr/bin/env node
/**
 * WebSocketデバッグ機能のテストスクリプト
 * Chloe作成 - ChatBot Sage WebSocket システムテスト
 */

const io = require('socket.io-client');
const chalk = require('chalk');

class WebSocketDebugTester {
    constructor() {
        this.backendUrl = 'http://localhost:3001';
        this.adminToken = 'admin-debug-token-2024';
        this.socket = null;
        this.testResults = [];
    }

    async runTests() {
        console.log(chalk.blue('🧪 WebSocketデバッグ機能テスト開始\n'));
        
        try {
            await this.connectAsAdmin();
            await this.testBasicConnectivity();
            await this.testFrontendExecution();
            await this.testEmotionControls();
            await this.testLive2DControls();
            await this.testErrorHandling();
            
            this.printTestResults();
        } catch (error) {
            console.error(chalk.red('❌ テスト実行中にエラーが発生しました:'), error.message);
        } finally {
            if (this.socket) {
                this.socket.disconnect();
            }
        }
    }

    async connectAsAdmin() {
        return new Promise((resolve, reject) => {
            this.socket = io(this.backendUrl);
            
            this.socket.on('connect', () => {
                console.log(chalk.green('✅ WebSocketサーバーに接続しました'));
                
                // 管理者として認証
                this.socket.emit('authenticate', {
                    role: 'admin',
                    token: this.adminToken
                });
            });

            this.socket.on('authenticated', (data) => {
                console.log(chalk.green('✅ 管理者認証が完了しました'));
                this.addTestResult('管理者認証', true, '認証成功');
                resolve();
            });

            this.socket.on('authentication_failed', (error) => {
                this.addTestResult('管理者認証', false, error.message);
                reject(new Error(`認証失敗: ${error.message}`));
            });

            this.socket.on('connect_error', (error) => {
                this.addTestResult('WebSocket接続', false, error.message);
                reject(new Error(`接続失敗: ${error.message}`));
            });

            // タイムアウト設定
            setTimeout(() => {
                reject(new Error('接続タイムアウト'));
            }, 5000);
        });
    }

    async testBasicConnectivity() {
        console.log(chalk.yellow('\n📡 基本接続テスト実行中...'));
        
        return new Promise((resolve) => {
            this.socket.emit('ping', { timestamp: Date.now() });
            
            this.socket.on('pong', (data) => {
                const latency = Date.now() - data.timestamp;
                console.log(chalk.green(`✅ Ping応答: ${latency}ms`));
                this.addTestResult('Ping/Pong', true, `レイテンシ: ${latency}ms`);
                resolve();
            });

            // タイムアウト処理
            setTimeout(() => {
                this.addTestResult('Ping/Pong', false, 'タイムアウト');
                resolve();
            }, 3000);
        });
    }

    async testFrontendExecution() {
        console.log(chalk.yellow('\n🎯 フロントエンド実行テスト...'));
        
        const testCommands = [
            {
                name: 'コンソールログテスト',
                code: 'console.log("📞 アドミンパネルからのWebSocketテスト成功!");'
            },
            {
                name: 'DOM要素確認',
                code: 'document.querySelector("#chat-history") ? "chat-history要素が存在します" : "chat-history要素が見つかりません"'
            },
            {
                name: '感情分析器確認',
                code: 'window.EmotionAnalyzer ? "EmotionAnalyzerが利用可能です" : "EmotionAnalyzerが見つかりません"'
            }
        ];

        for (const test of testCommands) {
            await this.executeFrontendCommand(test.name, test.code);
            await this.delay(1000); // 1秒待機
        }
    }

    async executeFrontendCommand(testName, code) {
        return new Promise((resolve) => {
            console.log(chalk.blue(`  📤 実行中: ${testName}`));
            
            this.socket.emit('execute_on_frontend', {
                code: code,
                requestId: `test-${Date.now()}`
            });

            this.socket.on('frontend_execution_result', (data) => {
                if (data.success) {
                    console.log(chalk.green(`  ✅ ${testName}: 成功`));
                    if (data.result) {
                        console.log(chalk.gray(`     結果: ${data.result}`));
                    }
                    this.addTestResult(testName, true, data.result || '実行成功');
                } else {
                    console.log(chalk.red(`  ❌ ${testName}: 失敗`));
                    console.log(chalk.red(`     エラー: ${data.error}`));
                    this.addTestResult(testName, false, data.error);
                }
                resolve();
            });

            // タイムアウト処理
            setTimeout(() => {
                this.addTestResult(testName, false, 'タイムアウト');
                resolve();
            }, 5000);
        });
    }

    async testEmotionControls() {
        console.log(chalk.yellow('\n😊 感情制御テスト...'));
        
        const emotions = ['happy', 'surprised', 'sad', 'neutral'];
        
        for (const emotion of emotions) {
            const code = `
                if (window.EmotionAnalyzer && window.EmotionAnalyzer.testEmotion) {
                    window.EmotionAnalyzer.testEmotion('${emotion}');
                    "感情'${emotion}'をテストしました";
                } else {
                    "EmotionAnalyzerが利用できません";
                }
            `;
            
            await this.executeFrontendCommand(`感情テスト: ${emotion}`, code);
            await this.delay(500);
        }
    }

    async testLive2DControls() {
        console.log(chalk.yellow('\n🎭 Live2D制御テスト...'));
        
        const testCode = `
            if (window.live2dManager) {
                window.live2dManager.setExpression && window.live2dManager.setExpression('happy');
                "Live2D表情を変更しました";
            } else {
                "Live2Dマネージャーが利用できません";
            }
        `;
        
        await this.executeFrontendCommand('Live2D表情変更', testCode);
    }

    async testErrorHandling() {
        console.log(chalk.yellow('\n🚨 エラーハンドリングテスト...'));
        
        const errorCode = 'throw new Error("テスト用エラー");';
        await this.executeFrontendCommand('エラーハンドリング', errorCode);
    }

    addTestResult(testName, success, details) {
        this.testResults.push({
            name: testName,
            success: success,
            details: details,
            timestamp: new Date().toLocaleTimeString()
        });
    }

    printTestResults() {
        console.log(chalk.blue('\n📊 テスト結果サマリー\n'));
        console.log('━'.repeat(60));
        
        let passedTests = 0;
        let failedTests = 0;

        this.testResults.forEach((result, index) => {
            const status = result.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
            const details = result.details ? chalk.gray(` - ${result.details}`) : '';
            
            console.log(`${index + 1}. ${result.name} ${status}${details}`);
            
            if (result.success) {
                passedTests++;
            } else {
                failedTests++;
            }
        });

        console.log('━'.repeat(60));
        console.log(`合計: ${this.testResults.length} | 成功: ${chalk.green(passedTests)} | 失敗: ${chalk.red(failedTests)}`);
        
        if (failedTests === 0) {
            console.log(chalk.green('\n🎉 全てのテストが成功しました！WebSocketデバッグ機能は正常に動作しています。'));
        } else {
            console.log(chalk.yellow(`\n⚠️ ${failedTests}個のテストが失敗しました。詳細を確認してください。`));
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// テスト実行
if (require.main === module) {
    const tester = new WebSocketDebugTester();
    tester.runTests().catch(console.error);
}

module.exports = WebSocketDebugTester;
