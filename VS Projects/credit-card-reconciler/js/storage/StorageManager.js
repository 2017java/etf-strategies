/**
 * 存储管理器 - StorageManager
 * 负责数据的本地存储和管理
 */
class StorageManager {
    constructor() {
        this.PREFIX = 'cc_reconciler_';
        this.KEYS = {
            TRANSACTIONS: 'transactions',
            CATEGORIES: 'categories',
            MONTHLY_BILLS: 'monthly_bills',
            RULES: 'classification_rules',
            SETTINGS: 'settings',
            CLASSIFICATION_HISTORY: 'classification_history'
        };
    }

    // 通用存储方法

    /**
     * 保存数据到localStorage
     * @param {string} key 存储键名
     * @param {any} data 要保存的数据
     * @returns {boolean} 保存是否成功
     */
    save(key, data) {
        try {
            const prefixedKey = this.PREFIX + key;
            const serialized = JSON.stringify(data);
            localStorage.setItem(prefixedKey, serialized);
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    }

    /**
     * 从localStorage加载数据
     * @param {string} key 存储键名
     * @param {any} defaultValue 默认值
     * @returns {any} 加载的数据
     */
    load(key, defaultValue = null) {
        try {
            const prefixedKey = this.PREFIX + key;
            const serialized = localStorage.getItem(prefixedKey);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    }

    /**
     * 从localStorage中删除数据
     * @param {string} key 存储键名
     */
    remove(key) {
        const prefixedKey = this.PREFIX + key;
        localStorage.removeItem(prefixedKey);
    }

    /**
     * 清空所有存储数据
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => this.remove(key));
    }

    // 交易管理方法

    /**
     * 保存交易记录
     * @param {Array<Transaction>} transactions 交易数组
     * @returns {boolean} 是否成功
     */
    saveTransactions(transactions) {
        const data = transactions.map(tx => tx.toJSON());
        return this.save(this.KEYS.TRANSACTIONS, data);
    }

    /**
     * 加载交易记录
     * @returns {Array<Transaction>} 交易数组
     */
    loadTransactions() {
        const data = this.load(this.KEYS.TRANSACTIONS, []);
        return data.map(tx => Transaction.fromJSON(tx));
    }

    /**
     * 添加单个交易
     * @param {Transaction} transaction 交易对象
     * @returns {boolean} 是否成功
     */
    addTransaction(transaction) {
        const transactions = this.loadTransactions();
        transactions.push(transaction);
        return this.saveTransactions(transactions);
    }

    /**
     * 删除交易
     * @param {string} transactionId 交易ID
     * @returns {boolean} 是否成功
     */
    removeTransaction(transactionId) {
        const transactions = this.loadTransactions().filter(tx => tx.id !== transactionId);
        return this.saveTransactions(transactions);
    }

    // 分类管理方法

    /**
     * 保存分类
     * @param {Array<Category>} categories 分类数组
     * @returns {boolean} 是否成功
     */
    saveCategories(categories) {
        const data = categories.map(category => category.toJSON());
        return this.save(this.KEYS.CATEGORIES, data);
    }

    /**
     * 加载分类
     * @returns {Array<Category>} 分类数组
     */
    loadCategories() {
        const data = this.load(this.KEYS.CATEGORIES, null);
        if (data) {
            return data.map(category => Category.fromJSON(category));
        }
        // 如果没有存储的分类，使用默认分类
        const defaultCategories = Category.getDefaultCategories();
        this.saveCategories(defaultCategories);
        return defaultCategories;
    }

    /**
     * 添加分类
     * @param {Category} category 分类对象
     * @returns {boolean} 是否成功
     */
    addCategory(category) {
        const categories = this.loadCategories();
        const exists = categories.find(c => c.id === category.id);
        if (!exists) {
            categories.push(category);
            return this.saveCategories(categories);
        }
        return false;
    }

    /**
     * 更新分类
     * @param {string} categoryId 分类ID
     * @param {Category} updatedCategory 更新后的分类
     * @returns {boolean} 是否成功
     */
    updateCategory(categoryId, updatedCategory) {
        const categories = this.loadCategories();
        const index = categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            categories[index] = updatedCategory;
            return this.saveCategories(categories);
        }
        return false;
    }

    /**
     * 删除分类
     * @param {string} categoryId 分类ID
     * @returns {boolean} 是否成功
     */
    deleteCategory(categoryId) {
        // 不能删除默认分类 'other'
        if (categoryId === 'other') return false;

        const categories = this.loadCategories().filter(c => c.id !== categoryId);
        return this.saveCategories(categories);
    }

    // 月度账单管理方法

    /**
     * 保存月度账单
     * @param {MonthlyBill} bill 月度账单对象
     * @returns {boolean} 是否成功
     */
    saveMonthlyBill(bill) {
        const bills = this.loadMonthlyBills();
        const existingIndex = bills.findIndex(b =>
            b.year === bill.year && b.month === bill.month
        );

        if (existingIndex >= 0) {
            bills[existingIndex] = bill;
        } else {
            bills.push(bill);
        }

        return this.saveMonthlyBills(bills);
    }

    /**
     * 保存所有月度账单
     * @param {Array<MonthlyBill>} bills 账单数组
     * @returns {boolean} 是否成功
     */
    saveMonthlyBills(bills) {
        const data = bills.map(bill => bill.toJSON());
        return this.save(this.KEYS.MONTHLY_BILLS, data);
    }

    /**
     * 加载所有月度账单
     * @returns {Array<MonthlyBill>} 账单数组
     */
    loadMonthlyBills() {
        const data = this.load(this.KEYS.MONTHLY_BILLS, []);
        return data.map(bill => MonthlyBill.fromJSON(bill));
    }

    /**
     * 加载指定年月的账单
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {MonthlyBill|null} 账单对象
     */
    loadMonthlyBill(year, month) {
        const bills = this.loadMonthlyBills();
        return bills.find(b => b.year === year && b.month === month);
    }

    /**
     * 删除指定年月的账单
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {boolean} 是否成功
     */
    deleteMonthlyBill(year, month) {
        const bills = this.loadMonthlyBills().filter(b =>
            b.year !== year || b.month !== month
        );
        return this.saveMonthlyBills(bills);
    }

    // 分类历史管理方法

    /**
     * 保存分类历史
     * @param {Map} history 分类历史记录
     * @returns {boolean} 是否成功
     */
    saveClassificationHistory(history) {
        const data = Array.from(history.entries());
        return this.save(this.KEYS.CLASSIFICATION_HISTORY, data);
    }

    /**
     * 加载分类历史
     * @returns {Map} 分类历史记录
     */
    loadClassificationHistory() {
        const data = this.load(this.KEYS.CLASSIFICATION_HISTORY, []);
        return new Map(data);
    }

    /**
     * 清除分类历史
     * @returns {boolean} 是否成功
     */
    clearClassificationHistory() {
        return this.save(this.KEYS.CLASSIFICATION_HISTORY, []);
    }

    // 设置管理方法

    /**
     * 保存用户设置
     * @param {Object} settings 设置对象
     * @returns {boolean} 是否成功
     */
    saveSettings(settings) {
        return this.save(this.KEYS.SETTINGS, settings);
    }

    /**
     * 加载用户设置
     * @returns {Object} 设置对象
     */
    loadSettings() {
        const defaults = {
            currency: 'CNY',
            defaultCategory: 'other',
            showRefunds: true,
            theme: 'light',
            emailParsingRules: [],
            classificationRules: []
        };
        return { ...defaults, ...this.load(this.KEYS.SETTINGS, {}) };
    }

    /**
     * 获取特定设置
     * @param {string} key 设置键名
     * @param {any} defaultValue 默认值
     * @returns {any} 设置值
     */
    getSetting(key, defaultValue = null) {
        const settings = this.loadSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    /**
     * 设置特定设置
     * @param {string} key 设置键名
     * @param {any} value 设置值
     * @returns {boolean} 是否成功
     */
    setSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }

    // 数据导出/导入方法

    /**
     * 导出所有数据为JSON字符串
     * @returns {string} JSON字符串
     */
    exportData() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            transactions: this.loadTransactions().map(tx => tx.toJSON()),
            categories: this.loadCategories().map(cat => cat.toJSON()),
            monthlyBills: this.loadMonthlyBills().map(bill => bill.toJSON()),
            settings: this.loadSettings()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * 导入数据
     * @param {string} jsonString JSON字符串
     * @returns {boolean} 是否成功
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // 验证数据格式
            if (!data.version || !data.transactions) {
                throw new Error('无效的数据格式');
            }

            // 导入分类
            if (data.categories) {
                const categories = data.categories.map(cat => Category.fromJSON(cat));
                this.saveCategories(categories);
            }

            // 导入交易
            if (data.transactions) {
                const transactions = data.transactions.map(tx => Transaction.fromJSON(tx));
                this.saveTransactions(transactions);
            }

            // 导入月度账单
            if (data.monthlyBills) {
                const monthlyBills = data.monthlyBills.map(bill => MonthlyBill.fromJSON(bill));
                this.saveMonthlyBills(monthlyBills);
            }

            // 导入设置
            if (data.settings) {
                this.saveSettings(data.settings);
            }

            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }

    /**
     * 下载数据文件
     */
    downloadData() {
        const json = this.exportData();
        Utils.downloadFile(json, `cc_reconciler_data_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }

    /**
     * 从文件导入数据
     * @param {File} file 文件对象
     * @returns {Promise<boolean>} 是否成功
     */
    async importDataFromFile(file) {
        try {
            const content = await Utils.readFile(file);
            return this.importData(content);
        } catch (error) {
            console.error('File import error:', error);
            return false;
        }
    }

    // 数据统计方法

    /**
     * 获取存储使用情况
     * @returns {Object} 存储使用情况
     */
    getStorageUsage() {
        const sizes = {};
        Object.values(this.KEYS).forEach(key => {
            const data = localStorage.getItem(this.PREFIX + key);
            sizes[key] = data ? data.length : 0;
        });

        const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);

        return {
            sizes,
            total,
            formatted: {
                ...Object.keys(sizes).reduce((result, key) => {
                    result[key] = Utils.formatBytes(sizes[key]);
                    return result;
                }, {}),
                total: Utils.formatBytes(total)
            }
        };
    }

    /**
     * 获取存储使用百分比
     * @returns {number} 使用百分比 (0-100)
     */
    getStorageUsagePercent() {
        const maxStorage = 5 * 1024 * 1024; // 5MB (localStorage通常限制为5MB)
        const usage = this.getStorageUsage().total;
        return Math.min((usage / maxStorage) * 100, 100);
    }

    /**
     * 检查存储是否已满
     * @returns {boolean} 是否已满
     */
    isStorageFull() {
        return this.getStorageUsagePercent() >= 95;
    }

    /**
     * 清除旧数据（保留最近N个月）
     * @param {number} monthsToKeep 保留的月份数
     * @returns {boolean} 是否成功
     */
    clearOldData(monthsToKeep = 12) {
        const now = new Date();
        const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsToKeep, 1);

        // 清除旧的交易
        const currentTransactions = this.loadTransactions();
        const keepTransactions = currentTransactions.filter(tx => new Date(tx.date) >= cutoffDate);
        this.saveTransactions(keepTransactions);

        // 清除旧的月度账单
        const currentBills = this.loadMonthlyBills();
        const keepBills = currentBills.filter(bill => {
            const billDate = new Date(bill.year, bill.month, 1);
            return billDate >= cutoffDate;
        });
        this.saveMonthlyBills(keepBills);

        return true;
    }

    // 备份和恢复方法

    /**
     * 创建备份
     * @returns {string} 备份数据的JSON字符串
     */
    createBackup() {
        return this.exportData();
    }

    /**
     * 恢复备份
     * @param {string} backupData 备份数据的JSON字符串
     * @param {boolean} overwrite 是否覆盖现有数据 (default: true)
     * @returns {boolean} 是否成功
     */
    restoreBackup(backupData, overwrite = true) {
        try {
            const data = JSON.parse(backupData);

            if (!overwrite) {
                // 合并数据而不是覆盖
                const existingData = this.exportData();
                // 简单的合并逻辑，需要更复杂的实现
            }

            return this.importData(backupData);
        } catch (error) {
            console.error('Backup restore error:', error);
            return false;
        }
    }
}