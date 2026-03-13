/**
 * 交易数据模型 - Transaction
 */
class Transaction {
    constructor(id, date, description, amount, type = 'expense', category = null, isRefund = false) {
        this.id = id;
        this.date = date;           // Date对象
        this.description = description;
        this.amount = amount;       // 正数表示支出，负数表示退款
        this.type = type;           // 'expense' | 'income'
        this.category = category;   // 分类对象
        this.isRefund = isRefund;   // 是否为退款
        this.manualCategory = null; // 手动调整的分类
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // 获取最终分类（手动优先）
    getFinalCategory() {
        return this.manualCategory || this.category;
    }

    // 手动设置分类
    setManualCategory(category) {
        this.manualCategory = category;
        this.updatedAt = new Date();
    }

    // 计算实际金额（退款为负）
    getNetAmount() {
        return this.isRefund ? -Math.abs(this.amount) : Math.abs(this.amount);
    }

    // 判断是否为收入
    isIncome() {
        return this.type === 'income' || this.isRefund;
    }

    // 判断是否为支出
    isExpense() {
        return this.type === 'expense' && !this.isRefund;
    }

    // 获取格式化后的日期字符串
    getFormattedDate(format = 'YYYY-MM-DD') {
        return Utils.formatDate(this.date, format);
    }

    // 获取格式化后的金额
    getFormattedAmount(currency = 'CNY') {
        return Utils.formatAmount(this.getNetAmount(), currency);
    }

    // 获取分类名称
    getCategoryName() {
        const category = this.getFinalCategory();
        return category ? category.name : '未分类';
    }

    // 获取分类颜色
    getCategoryColor() {
        const category = this.getFinalCategory();
        return category ? category.color : '#6c757d';
    }

    // 获取分类图标
    getCategoryIcon() {
        const category = this.getFinalCategory();
        return category ? category.icon : '📦';
    }

    // 转换为可存储的对象格式
    toJSON() {
        return {
            id: this.id,
            date: this.date.toISOString(),
            description: this.description,
            amount: this.amount,
            type: this.type,
            category: this.category,
            isRefund: this.isRefund,
            manualCategory: this.manualCategory,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    // 从JSON数据创建Transaction实例
    static fromJSON(data) {
        const transaction = new Transaction(
            data.id,
            new Date(data.date),
            data.description,
            data.amount,
            data.type,
            data.category,
            data.isRefund
        );
        transaction.manualCategory = data.manualCategory;
        transaction.createdAt = new Date(data.createdAt);
        transaction.updatedAt = new Date(data.updatedAt);
        return transaction;
    }

    // 判断是否与另一笔交易重复（基于日期、描述和金额）
    isDuplicate(other) {
        if (!other) return false;

        const sameDay = this.getFormattedDate('YYYY-MM-DD') === other.getFormattedDate('YYYY-MM-DD');
        const sameDescription = this.description === other.description;
        const similarAmount = Math.abs(this.amount - other.amount) < 0.01;

        return sameDay && sameDescription && similarAmount;
    }
}