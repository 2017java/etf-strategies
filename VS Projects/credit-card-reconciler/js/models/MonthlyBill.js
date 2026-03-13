/**
 * 月度账单数据模型 - MonthlyBill
 */
class MonthlyBill {
    constructor(year, month) {
        this.year = year;
        this.month = month;
        this.transactions = [];
        this.isReconciled = false;
        this.reconciledAt = null;
        this.notes = '';
    }

    // 添加交易
    addTransaction(transaction) {
        this.transactions.push(transaction);
    }

    // 删除交易
    removeTransaction(transactionId) {
        this.transactions = this.transactions.filter(t => t.id !== transactionId);
    }

    // 获取总支出（不包含退款）
    getTotalExpense() {
        return this.transactions
            .filter(t => t.isExpense())
            .reduce((sum, t) => sum + t.getNetAmount(), 0);
    }

    // 获取总退款（退款金额的绝对值）
    getTotalRefund() {
        return this.transactions
            .filter(t => t.isRefund)
            .reduce((sum, t) => sum + Math.abs(t.getNetAmount()), 0);
    }

    // 获取净支出（总支出 - 总退款）
    getNetTotal() {
        return this.getTotalExpense() - this.getTotalRefund();
    }

    // 获取交易笔数
    getTransactionCount() {
        return this.transactions.length;
    }

    // 获取支出笔数
    getExpenseCount() {
        return this.transactions.filter(t => t.isExpense()).length;
    }

    // 获取退款笔数
    getRefundCount() {
        return this.transactions.filter(t => t.isRefund).length;
    }

    // 获取平均单笔消费
    getAverageTransactionAmount() {
        const expenseCount = this.getExpenseCount();
        return expenseCount > 0 ? this.getTotalExpense() / expenseCount : 0;
    }

    // 获取分类支出明细
    getCategoryBreakdown() {
        const breakdown = {};
        this.transactions.forEach(tx => {
            const cat = tx.getFinalCategory();
            const catId = cat ? cat.id : 'uncategorized';
            if (!breakdown[catId]) {
                breakdown[catId] = {
                    category: cat,
                    amount: 0,
                    count: 0
                };
            }
            breakdown[catId].amount += tx.isExpense() ? tx.getNetAmount() : 0;
            breakdown[catId].count++;
        });
        return breakdown;
    }

    // 获取分类占比（按支出金额）
    getCategoryPercentage() {
        const breakdown = this.getCategoryBreakdown();
        const total = this.getTotalExpense();

        if (total === 0) {
            return Object.entries(breakdown).map(([catId, data]) => ({
                category: data.category,
                amount: data.amount,
                count: data.count,
                percentage: 0
            }));
        }

        return Object.entries(breakdown).map(([catId, data]) => ({
            category: data.category,
            amount: data.amount,
            count: data.count,
            percentage: (data.amount / total) * 100
        })).sort((a, b) => b.amount - a.amount);
    }

    // 获取每日支出统计
    getDailyBreakdown() {
        const breakdown = {};
        this.transactions.forEach(tx => {
            const dateStr = tx.getFormattedDate('YYYY-MM-DD');
            if (!breakdown[dateStr]) {
                breakdown[dateStr] = {
                    date: tx.date,
                    expense: 0,
                    refund: 0,
                    transactionCount: 0,
                    transactions: []
                };
            }
            if (tx.isExpense()) {
                breakdown[dateStr].expense += tx.getNetAmount();
            } else {
                breakdown[dateStr].refund += Math.abs(tx.getNetAmount());
            }
            breakdown[dateStr].transactionCount++;
            breakdown[dateStr].transactions.push(tx);
        });

        return Object.values(breakdown).sort((a, b) => a.date - b.date);
    }

    // 获取周支出统计
    getWeeklyBreakdown() {
        const breakdown = Array(5).fill(null).map(() => ({
            weekNumber: 0,
            startDate: null,
            endDate: null,
            expense: 0,
            refund: 0,
            transactionCount: 0
        }));

        this.transactions.forEach(tx => {
            const date = new Date(tx.date);
            const weekNumber = this.getWeekNumber(date);
            if (weekNumber >= 0 && weekNumber < 5) {
                breakdown[weekNumber].expense += tx.isExpense() ? tx.getNetAmount() : 0;
                breakdown[weekNumber].refund += tx.isRefund ? Math.abs(tx.getNetAmount()) : 0;
                breakdown[weekNumber].transactionCount++;
            }
        });

        return breakdown;
    }

    // 获取月份字符串
    getMonthName(lang = 'zh') {
        return Utils.getMonthName(this.month, lang);
    }

    // 格式化显示名称
    getFormattedName() {
        return `${this.year}年${this.getMonthName()}账单`;
    }

    // 获取月份简写
    getShortMonth() {
        return `${this.year}-${String(this.month + 1).padStart(2, '0')}`;
    }

    // 标记为已对账
    markAsReconciled() {
        this.isReconciled = true;
        this.reconciledAt = new Date();
    }

    // 标记为未对账
    markAsUnreconciled() {
        this.isReconciled = false;
        this.reconciledAt = null;
    }

    // 获取账单状态文字
    getStatusText() {
        return this.isReconciled ? '已对账' : '未对账';
    }

    // 获取状态样式类
    getStatusClass() {
        return this.isReconciled ? 'status-reconciled' : 'status-unreconciled';
    }

    // 获取对账日期
    getReconciledDate() {
        return this.reconciledAt ? Utils.formatDate(this.reconciledAt, 'YYYY-MM-DD HH:mm:ss') : '未对账';
    }

    // 检查是否有交易
    hasTransactions() {
        return this.transactions.length > 0;
    }

    // 获取金额格式化显示
    getFormattedAmount(type = 'net', currency = 'CNY') {
        let amount = 0;
        if (type === 'net') {
            amount = this.getNetTotal();
        } else if (type === 'expense') {
            amount = this.getTotalExpense();
        } else if (type === 'refund') {
            amount = this.getTotalRefund();
        } else if (type === 'average') {
            amount = this.getAverageTransactionAmount();
        }

        return Utils.formatAmount(amount, currency);
    }

    // 获取百分比格式化
    getPercentageString(value) {
        return `${value.toFixed(1)}%`;
    }

    // 计算周数（根据日期获取当月第几周）
    getWeekNumber(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfWeek = firstDay.getDay(); // 0 = Sunday
        const dayOfMonth = date.getDate();
        return Math.floor((dayOfMonth + dayOfWeek - 1) / 7);
    }

    // 转换为可存储的对象格式
    toJSON() {
        return {
            year: this.year,
            month: this.month,
            transactions: this.transactions.map(tx => tx.toJSON()),
            isReconciled: this.isReconciled,
            reconciledAt: this.reconciledAt ? this.reconciledAt.toISOString() : null,
            notes: this.notes
        };
    }

    // 从JSON数据创建MonthlyBill实例
    static fromJSON(data) {
        const bill = new MonthlyBill(data.year, data.month);
        bill.transactions = data.transactions.map(tx => Transaction.fromJSON(tx));
        bill.isReconciled = data.isReconciled;
        bill.reconciledAt = data.reconciledAt ? new Date(data.reconciledAt) : null;
        bill.notes = data.notes || '';
        return bill;
    }

    // 创建空的月度账单
    static createEmpty(year, month) {
        return new MonthlyBill(year, month);
    }

    // 克隆账单
    clone() {
        const cloned = new MonthlyBill(this.year, this.month);
        cloned.transactions = this.transactions.map(tx => {
            const txClone = Transaction.fromJSON(tx.toJSON());
            return txClone;
        });
        cloned.isReconciled = this.isReconciled;
        cloned.reconciledAt = this.reconciledAt ? new Date(this.reconciledAt) : null;
        cloned.notes = this.notes;
        return cloned;
    }
}