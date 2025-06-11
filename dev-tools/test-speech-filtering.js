// 音声読み上げフィルタリング機能のテスト
// ブラウザのコンソールで実行するテストスクリプト

console.log('🎯 音声読み上げフィルタリング機能テスト開始');

// テスト用のremoveEmojis関数（メインのscript.jsと同じ実装）
function testRemoveEmojis(text) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{2934}-\u{2935}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;
    
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})(\/[^\s]*)?/gi;
    
    const asteriskRegex = /\*/g;
    
    let cleanText = text;
    cleanText = cleanText.replace(emojiRegex, '');
    cleanText = cleanText.replace(urlRegex, '');
    cleanText = cleanText.replace(asteriskRegex, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
}

// テストケース
const testCases = [
    {
        name: 'アスタリスク除去テスト',
        input: 'こんにちは！* これは重要な*メッセージです。*',
        expected: 'こんにちは！ これは重要なメッセージです。'
    },
    {
        name: 'URL除去テスト（https）',
        input: 'こちらのサイトをチェック: https://www.example.com をご覧ください。',
        expected: 'こちらのサイトをチェック: をご覧ください。'
    },
    {
        name: 'URL除去テスト（www）',
        input: '詳細は www.google.com で確認できます。',
        expected: '詳細は で確認できます。'
    },
    {
        name: 'URL除去テスト（ドメイン形式）',
        input: 'example.com と test.org を参照してください。',
        expected: 'と を参照してください。'
    },
    {
        name: '絵文字除去テスト',
        input: 'こんにちは😊 今日はいい天気ですね🌞',
        expected: 'こんにちは 今日はいい天気ですね'
    },
    {
        name: '複合テスト（全要素含む）',
        input: 'こんにちは😊 *重要* https://example.com をチェック！🎉',
        expected: 'こんにちは 重要 をチェック！'
    },
    {
        name: 'アスタリスクのみ',
        input: '***',
        expected: ''
    },
    {
        name: 'URLのみ',
        input: 'https://www.example.com',
        expected: ''
    },
    {
        name: '正常なテキスト',
        input: 'これは普通のメッセージです。',
        expected: 'これは普通のメッセージです。'
    }
];

// テスト実行
let passedTests = 0;
let totalTests = testCases.length;

console.log(`\n📋 ${totalTests}個のテストケースを実行します...\n`);

testCases.forEach((testCase, index) => {
    const result = testRemoveEmojis(testCase.input);
    const passed = result === testCase.expected;
    
    if (passed) {
        passedTests++;
        console.log(`✅ Test ${index + 1}: ${testCase.name}`);
    } else {
        console.error(`❌ Test ${index + 1}: ${testCase.name}`);
        console.error(`   入力: "${testCase.input}"`);
        console.error(`   期待: "${testCase.expected}"`);
        console.error(`   結果: "${result}"`);
    }
});

console.log(`\n🎯 テスト結果: ${passedTests}/${totalTests} 通過`);

if (passedTests === totalTests) {
    console.log('🎉 全てのテストが通過しました！');
} else {
    console.error('⚠️  一部のテストが失敗しました。');
}

// 実際の音声システムとの連携テスト
console.log('\n🔊 実際の音声システムテスト...');

if (typeof removeEmojis === 'function') {
    console.log('✅ removeEmojis関数が見つかりました');
    
    // 実際の関数でテスト
    const testText = '*こんにちは*！https://example.com を見てください😊';
    const cleaned = removeEmojis(testText);
    console.log(`入力: "${testText}"`);
    console.log(`出力: "${cleaned}"`);
    
    if (typeof speakText === 'function') {
        console.log('✅ speakText関数が見つかりました');
        console.log('💡 実際のテストは音声がONの状態で以下を実行してください:');
        console.log(`speakText("*テスト*メッセージです https://example.com 😊")`);
    } else {
        console.warn('⚠️ speakText関数が見つかりません（まだ読み込まれていない可能性）');
    }
} else {
    console.warn('⚠️ removeEmojis関数が見つかりません（script.jsが読み込まれていない可能性）');
}

console.log('\n🏁 テスト完了');
