// 简单的演示和测试脚本
console.log('=== 信用卡对账系统演示 ===');

// 1. 初始化应用（模拟）
console.log('1. 应用初始化...');
const storage = new StorageManager();
const parser = new EmailParser();
const classifier = new AutoClassifier(Category.getDefaultCategories());
const analyzer = new TrendAnalyzer();

console.log('📊 应用初始化完成');
console.log(`🏷️  分类数量: ${classifier.categories.length}`);
console.log(`💾 存储状态: ${storage.getStorageUsage().formatted.total}`);

// 2. 测试解析器
console.log('\n2. 测试邮件解析器...');

const testEmailText = `
招商银行信用卡对账单

尊敬的客户：

您的招商银行信用卡最新对账单已出，请查收。

【本月账单明细】
2024-03-01  美团外卖       ¥38.50
2024-03-02  滴滴出行       ¥25.80
2024-03-03  淘宝购物       ¥199.00
2024-03-04  星巴克咖啡      ¥42.00
2024-03-05  超市购物        ¥86.70
2024-03-06  滴滴出行       ¥18.60
2024-03-07  美团外卖       ¥45.00
2024-03-08  餐厅消费       ¥268.00

祝您用卡愉快！
招商银行信用卡中心
`;

console.log('📨 解析邮件内容...');
const parsedTransactions = parser.parse(testEmailText);

console.log(`✅ 解析成功! 识别到 ${parsedTransactions.length} 笔交易`);

parsedTransactions.forEach(tx => {
    console.log(`- ${tx.getFormattedDate()}: ${tx.description} (${tx.isRefund ? '退款' : '支出'}) ${Utils.formatAmount(tx.amount)}`);
});

// 3. 测试分类
console.log('\n3. 测试自动分类...');
const classifiedTransactions = classifier.batchClassify(parsedTransactions);

classifiedTransactions.forEach(tx => {
    console.log(`- ${Utils.truncate(tx.description, 20)}: ${tx.getCategoryName()}`);
});

// 4. 测试统计分析
console.log('\n4. 测试统计分析...');

const testBill = MonthlyBill.createEmpty(2024, 2); // 3月 (0-based)
classifiedTransactions.forEach(tx => {
    testBill.addTransaction(tx);
});

console.log('📈 账单统计:');
console.log(`   总支出: ${Utils.formatAmount(testBill.getTotalExpense())}`);
console.log(`   总退款: ${Utils.formatAmount(testBill.getTotalRefund())}`);
console.log(`   净支出: ${Utils.formatAmount(testBill.getNetTotal())}`);
console.log(`   交易笔数: ${testBill.transactions.length}`);
console.log(`   平均单笔: ${Utils.formatAmount(testBill.getAverageTransactionAmount())}`);

// 分类占比
console.log('\n📊 分类占比:');
const categoryBreakdown = testBill.getCategoryPercentage();
categoryBreakdown.forEach(item => {
    console.log(`   ${item.category?.name || '未分类'}: ${item.amount.toFixed(2)} (${item.percentage.toFixed(1)}%)`);
});

// 5. 存储测试
console.log('\n5. 测试本地存储...');
if (storage.saveTransactions(classifiedTransactions)) {
    console.log('✅ 交易数据保存成功');
}
if (storage.saveMonthlyBills([testBill])) {
    console.log('✅ 账单数据保存成功');
}

console.log(`💾 存储使用: ${storage.getStorageUsage().formatted.total}`);

// 6. 展示模拟界面
console.log('\n=== 🎉 演示完成 ===');
console.log('');
console.log('📝 说明:');
console.log('1. 实际使用时请在浏览器中打开 index.html');
console.log('2. 在"账单导入"页面粘贴银行邮件内容');
console.log('3. 系统会自动解析并分类交易');
console.log('4. 在"数据分析"页面查看统计图表');
console.log('');
console.log('💡 支持的银行:');
console.log('   - 招商银行 (默认)');
console.log('   - 工商银行');
console.log('   - 建设银行');
console.log('   - 中国银行');
console.log('');
console.log('🔧 如需添加其他银行格式');
console.log('   可修改 EmailParser.js 中的解析规则');