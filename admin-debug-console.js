// 管理画面デバッグ用スクリプト
// ブラウザのコンソールで実行してください

console.log('🔍 管理画面デバッグ診断開始');

// 1. DOM要素の存在確認
const elements = {
    loginScreen: document.getElementById('login-screen'),
    adminScreen: document.getElementById('admin-screen'),
    userInfo: document.getElementById('user-info'),
    loginForm: document.getElementById('login-form')
};

console.log('📋 DOM要素確認:');
Object.entries(elements).forEach(([key, element]) => {
    console.log(`${key}: ${element ? '✅ 存在' : '❌ 見つからない'}`);
    if (element) {
        console.log(`  - style.display: "${element.style.display}"`);
        console.log(`  - computed display: "${getComputedStyle(element).display}"`);
    }
});

// 2. AdminAppインスタンスの確認
console.log('\n🔧 AdminAppインスタンス確認:');
if (window.adminApp) {
    console.log('✅ window.adminApp が存在');
    console.log(`  - isAuthenticated: ${window.adminApp.isAuthenticated}`);
    console.log(`  - currentUser:`, window.adminApp.currentUser);
    console.log(`  - apiBase: ${window.adminApp.apiBase}`);
} else {
    console.log('❌ window.adminApp が見つからない');
}

// 3. セッション状態確認
console.log('\n🍪 セッション状態確認:');
fetch('http://localhost:3001/api/auth/status', {
    method: 'GET',
    credentials: 'include'
})
.then(response => {
    console.log(`HTTP Status: ${response.status}`);
    return response.json();
})
.then(data => {
    console.log('認証状態レスポンス:', data);
})
.catch(error => {
    console.error('認証状態確認エラー:', error);
});

// 4. WebSocketクライアント確認
console.log('\n🔌 WebSocketクライアント確認:');
if (window.adminWsClient) {
    console.log('✅ window.adminWsClient が存在');
    console.log(`  - 接続状態: ${window.adminWsClient.isConnected()}`);
} else {
    console.log('❌ window.adminWsClient が見つからない');
}

// 5. 手動で画面切り替えをテスト
console.log('\n🎭 手動画面切り替えテスト:');
const testShowAdmin = () => {
    const loginScreen = document.getElementById('login-screen');
    const adminScreen = document.getElementById('admin-screen');
    
    if (loginScreen && adminScreen) {
        loginScreen.style.display = 'none';
        adminScreen.style.display = 'flex';
        console.log('✅ 手動で管理画面を表示しました');
        
        // 5秒後に元に戻す
        setTimeout(() => {
            loginScreen.style.display = 'flex';
            adminScreen.style.display = 'none';
            console.log('🔄 ログイン画面に戻しました');
        }, 5000);
    } else {
        console.log('❌ DOM要素が見つからないため、手動切り替えができません');
    }
};

console.log('手動切り替えテストを実行するには: testShowAdmin()');
window.testShowAdmin = testShowAdmin;
