/**
 * 测试修复功能
 */

// 模拟测试数据 - 根据用户提供的截图
const testEmailContent = `交易日期   入账日期   交易摘要                    交易金额   交易货币   入账金额   入账货币
2026/02/27  2026/02/27  (消费)支付宝-重庆马登服饰有限公司  79.90  人民币  79.90  人民币
2026/02/25  2026/02/26  (消费)支付宝-上海拉扎斯信息科技有限公司  75.11  人民币  75.11  人民币
2026/02/24  2026/02/24  (消费)财付通-广九客运段  579.88  人民币  579.88  人民币
2026/02/24  2026/02/25  (消费)(特约)滴滴出行科技有限公司  10.40  人民币  10.40  人民币
2026/02/23  2026/02/23  (消费)财付通-祁东县新和加油站  79.88  人民币  79.88  人民币
2026/02/23  2026/02/23  (消费)支付宝-云上艾珀(贵州)技术有限公司  6.00  人民币  6.00  人民币
2026/02/21  2026/02/21  (退款)网银在线-上海一嗨汽车租赁有限公司(京东支  -711.98  人民币  -711.98  人民币
2026/02/19  2026/02/19  (消费)支付宝-中山市麦饰德商贸有限公司  40.12  人民币  40.12  人民币
2026/02/19  2026/02/19  (消费)支付宝-衣新亮  51.80  人民币  51.80  人民币
2026/02/19  2026/02/19  (消费)支付宝-衣新亮  76.93  人民币  76.93  人民币
2026/02/16  2026/02/16  (消费)财付通-江南佳美零食工厂  77.20  人民币  77.20  人民币
2026/02/15  2026/02/16  (还款)银联便民自助终端还款(云闪付)  -4,424.41  人民币  -4,424.41  人民币
2026/02/15  2026/02/16  (消费)财付通-祁东县步云桥镇戴永红零食量贩  65.17  人民币  65.17  人民币
2026/02/14  2026/02/15  (消费)网银在线-腾达智能网络京东自营旗舰店  61.00  人民币  61.00  人民币
2026/02/14  2026/02/14  (消费)财付通-中国妇女发展基金会  30.00  人民币  30.00  人民币
2026/02/13  2026/02/14  (退款)(特约)中国铁路网络有限公司  -624.00  人民币  -624.00  人民币
2026/02/13  2026/02/13  (消费)财付通-广九客运段  290.00  人民币  290.00  人民币`;

// 测试函数
function testParser() {
    console.log('开始测试EmailParser...');

    // 创建解析器实例
    const parser = new EmailParser();

    // 添加适应用户格式的规则
    parser.addRule({
        name: 'user_transaction_line',
        pattern: /(\d{4}\/\d{2}\/\d{2})\s+\d{4}\/\d{2}\/\d{2}\s+\((.+?)\)(.+?)\s+(-?[\d,]+\.?\d*)/,
        groups: { date: 1, type: 2, description: 3, amount: 4 }
    });

    // 测试解析
    const transactions = parser.parse(testEmailContent);

    console.log('解析到的交易记录数量:', transactions.length);

    // 输出每个交易的详细信息
    console.log('\n交易详情:');
    let totalExpense = 0;
    let totalRefund = 0;

    transactions.forEach((tx, index) => {
        const isRefund = tx.isRefund;
        const amount = Math.abs(tx.amount);

        if (isRefund) {
            totalRefund += amount;
            console.log(`${index + 1}. [退款] ${tx.getFormattedDate('YYYY-MM-DD')} ${tx.description} -¥${amount}`);
        } else {
            totalExpense += amount;
            console.log(`${index + 1}. [支出] ${tx.getFormattedDate('YYYY-MM-DD')} ${tx.description} ¥${amount}`);
        }
    });

    console.log('\n统计:');
    console.log(`总支出: ¥${totalExpense.toFixed(2)}`);
    console.log(`总退款: ¥${totalRefund.toFixed(2)}`);
    console.log(`净支出: ¥${(totalExpense - totalRefund).toFixed(2)}`);

    // 验证退款识别
    const refundCount = transactions.filter(tx => tx.isRefund).length;
    console.log(`\n识别到退款/还款笔数: ${refundCount} (期望: 3笔)`);

    return transactions;
}

// 运行测试
if (typeof EmailParser !== 'undefined') {
    testParser();
} else {
    console.log('请在浏览器中打开index.html后，在控制台运行此测试');
}
