/**
 * 邮件文本解析器 - EmailParser
 * 负责解析信用卡邮件文本为交易记录
 */
class EmailParser {
    constructor() {
        // 预设解析规则（基于常见银行邮件格式）
        this.rules = [
            {
                name: 'transaction_line',
                pattern: /(\d{4}[-/]\d{2}[-/]\d{2})\s+(.+?)\s+([¥$]?[\d,]+\.?\d*)\s*(退款)?/,
                groups: { date: 1, description: 2, amount: 3, refund: 4 }
            },
            {
                name: 'amount_only',
                pattern: /交易金额[：:]\s*([¥$]?[\d,]+\.?\d*)/,
                groups: { amount: 1 }
            },
            {
                name: 'date_only',
                pattern: /交易日期[：:]\s*(\d{4}[-/]\d{2}[-/]\d{2})/,
                groups: { date: 1 }
            },
            {
                name: 'merchant',
                pattern: /商户名称[：:]\s*(.+)/,
                groups: { description: 1 }
            },
            {
                name: 'simple_transaction',
                pattern: /(\d{2}[-/]\d{2})\s+([^\d]+)\s*([¥$]?[\d,]+\.?\d*)/,
                groups: { date: 1, description: 2, amount: 3, year: new Date().getFullYear() }
            }
        ];
    }

    /**
     * 解析邮件文本为交易记录
     * @param {string} emailText 邮件文本内容
     * @returns {Array<Transaction>} 交易记录数组
     */
    parse(emailText) {
        const transactions = [];
        const lines = emailText.split('\n');

        let currentTransaction = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // 尝试匹配交易行
            const transactionMatch = this.matchRule('transaction_line', trimmed);
            if (transactionMatch) {
                if (currentTransaction) {
                    const tx = this.createTransaction(currentTransaction);
                    if (tx) transactions.push(tx);
                }
                currentTransaction = transactionMatch;
            } else {
                // 尝试补充当前交易信息
                if (currentTransaction) {
                    const amountMatch = this.matchRule('amount_only', trimmed);
                    const dateMatch = this.matchRule('date_only', trimmed);
                    const merchantMatch = this.matchRule('merchant', trimmed);

                    if (amountMatch && !currentTransaction.amount) {
                        currentTransaction.amount = amountMatch.amount;
                    }
                    if (dateMatch && !currentTransaction.date) {
                        currentTransaction.date = dateMatch.date;
                    }
                    if (merchantMatch && !currentTransaction.description) {
                        currentTransaction.description = merchantMatch.description;
                    }
                } else {
                    // 尝试匹配简单交易格式
                    const simpleMatch = this.matchRule('simple_transaction', trimmed);
                    if (simpleMatch) {
                        const tx = this.createTransaction(simpleMatch);
                        if (tx) transactions.push(tx);
                    }
                }
            }
        }

        if (currentTransaction) {
            const tx = this.createTransaction(currentTransaction);
            if (tx) transactions.push(tx);
        }

        return this.deduplicate(transactions);
    }

    /**
     * 规则匹配
     * @param {string} ruleName 规则名称
     * @param {string} text 文本
     * @returns {Object|null} 匹配结果
     */
    matchRule(ruleName, text) {
        const rule = this.rules.find(r => r.name === ruleName);
        if (!rule) return null;

        const match = text.match(rule.pattern);
        if (!match) return null;

        const result = {};
        for (const [key, groupIndex] of Object.entries(rule.groups)) {
            if (typeof groupIndex === 'number' && match[groupIndex]) {
                result[key] = match[groupIndex].trim();
            } else if (typeof groupIndex === 'string') {
                result[key] = groupIndex;
            }
        }
        return Object.keys(result).length > 0 ? result : null;
    }

    /**
     * 创建交易对象
     * @param {Object} data 交易数据
     * @returns {Transaction|null} 交易对象
     */
    createTransaction(data) {
        try {
            // 解析日期
            let date = null;
            if (data.date) {
                if (data.date.length === 5 || data.date.length === 8) {
                    // 格式为 MM/DD 或 MM-DD，需要添加年份
                    const year = data.year || new Date().getFullYear();
                    date = this.parseDate(data.date, year);
                } else {
                    date = this.parseDate(data.date);
                }
            } else {
                date = new Date();
            }

            // 解析金额
            let amount = 0;
            if (data.amount) {
                amount = this.parseAmount(data.amount);
            }

            // 解析退款标记
            const isRefund = !!data.refund || (data.description && data.description.includes('退款'));

            // 解析描述
            let description = data.description || '未知交易';
            description = description.replace(/[\n\r]/g, '').trim();

            // 创建交易ID
            const id = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            return new Transaction(id, date, description, amount, isRefund ? 'income' : 'expense', null, isRefund);
        } catch (error) {
            console.error('Transaction creation error:', error, data);
            return null;
        }
    }

    /**
     * 解析日期字符串
     * @param {string} dateStr 日期字符串
     * @param {number} year 年份（可选）
     * @returns {Date} Date对象
     */
    parseDate(dateStr, year = null) {
        // 支持多种日期格式
        const formats = [
            /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
            /(\d{4})\/(\d{2})\/(\d{2})/, // YYYY/MM/DD
            /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
            /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{2})-(\d{2})/, // MM-DD or DD-MM
            /(\d{2})\/(\d{2})/  // MM/DD or DD/MM
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let parsedYear, parsedMonth, parsedDay;

                if (match[3]) {
                    // 包含年份的格式
                    [parsedYear, parsedMonth, parsedDay] = [match[1], match[2], match[3]];
                } else {
                    // 只包含月日的格式
                    [parsedMonth, parsedDay] = [match[1], match[2]];
                    parsedYear = year || new Date().getFullYear();
                }

                // 确保数值类型
                parsedYear = parseInt(parsedYear, 10);
                parsedMonth = parseInt(parsedMonth, 10) - 1; // 转换为0-11
                parsedDay = parseInt(parsedDay, 10);

                // 验证日期合理性
                if (parsedYear >= 2000 && parsedYear <= 2100 &&
                    parsedMonth >= 0 && parsedMonth < 12 &&
                    parsedDay >= 1 && parsedDay <= 31) {
                    const date = new Date(parsedYear, parsedMonth, parsedDay);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
        }

        return new Date();
    }

    /**
     * 解析金额字符串
     * @param {string} amountStr 金额字符串
     * @returns {number} 金额数值
     */
    parseAmount(amountStr) {
        try {
            // 移除货币符号和千位分隔符
            const cleaned = amountStr
                .replace(/[¥$,]/g, '')
                .replace(/\s+/g, '')
                .trim();

            const amount = parseFloat(cleaned);
            return isNaN(amount) ? 0 : amount;
        } catch (error) {
            console.error('Amount parse error:', error);
            return 0;
        }
    }

    /**
     * 交易去重
     * @param {Array<Transaction>} transactions 交易数组
     * @returns {Array<Transaction>} 去重后的交易数组
     */
    deduplicate(transactions) {
        const seen = new Set();
        const deduplicated = [];

        for (const tx of transactions) {
            const key = this.getTransactionKey(tx);
            if (!seen.has(key)) {
                seen.add(key);
                deduplicated.push(tx);
            }
        }

        return deduplicated;
    }

    /**
     * 生成交易的唯一键（用于去重）
     * @param {Transaction} transaction 交易对象
     * @returns {string} 唯一键
     */
    getTransactionKey(transaction) {
        const date = transaction.getFormattedDate('YYYY-MM-DD');
        const amount = Math.round(transaction.amount * 100); // 四舍五入到分
        const description = transaction.description
            .replace(/\s+/g, '')
            .toLowerCase()
            .replace(/[\d.]/g, '');

        return `${date}_${amount}_${description}`;
    }

    /**
     * 添加自定义解析规则
     * @param {Object} rule 规则对象
     */
    addRule(rule) {
        if (rule.name && rule.pattern && rule.groups) {
            this.rules.push(rule);
        }
    }

    /**
     * 移除解析规则
     * @param {string} ruleName 规则名称
     * @returns {boolean} 是否成功
     */
    removeRule(ruleName) {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(r => r.name !== ruleName);
        return this.rules.length < initialLength;
    }

    /**
     * 列出所有解析规则
     * @returns {Array<Object>} 规则数组
     */
    listRules() {
        return [...this.rules];
    }

    /**
     * 获取解析统计信息
     * @param {string} emailText 邮件文本
     * @returns {Object} 统计信息
     */
    getParsingStats(emailText) {
        const startTime = performance.now();
        const transactions = this.parse(emailText);
        const endTime = performance.now();

        return {
            lines: emailText.split('\n').length,
            transactions: transactions.length,
            duplicatesRemoved: 0,
            processingTime: endTime - startTime,
            successful: transactions.length > 0
        };
    }
}