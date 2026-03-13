/**
 * 应用控制器 - AppController
 * 负责应用的整体逻辑协调
 */
class AppController {
    constructor() {
        this.storage = new StorageManager();
        this.emailParser = new EmailParser();
        this.autoClassifier = null;
        this.trendAnalyzer = null;

        this.transactions = [];
        this.categories = [];
        this.monthlyBills = [];
        this.currentBill = null;
        this.currentView = 'dashboard';

        this.views = {};
        this.notificationContainer = null;

        this.init();
    }

    init() {
        // 1. 加载数据
        this.loadData();

        // 2. 初始化分类器
        this.autoClassifier = new AutoClassifier(this.categories);

        // 3. 初始化分析器
        this.trendAnalyzer = new TrendAnalyzer(this.monthlyBills);

        // 4. 初始化通知容器
        this.initNotificationContainer();

        // 5. 加载分类历史
        const history = this.storage.loadClassificationHistory();
        this.autoClassifier.setClassificationHistory(history);

        // 6. 设置当前账单（默认为本月）
        const now = new Date();
        this.currentBill = this.getOrCreateBill(now.getFullYear(), now.getMonth());

        console.log('信用卡对账系统初始化完成');
    }

    loadData() {
        this.transactions = this.storage.loadTransactions();
        this.categories = this.storage.loadCategories();
        this.monthlyBills = this.storage.loadMonthlyBills();
    }

    initNotificationContainer() {
        this.notificationContainer = document.getElementById('notification-container');
        if (!this.notificationContainer) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.id = 'notification-container';
            document.body.appendChild(this.notificationContainer);
        }
    }

    getOrCreateBill(year, month) {
        let bill = this.monthlyBills.find(b => b.year === year && b.month === month);
        if (!bill) {
            bill = MonthlyBill.createEmpty(year, month);
            this.monthlyBills.push(bill);
        }
        return bill;
    }

    parseAndProcessEmail(emailText) {
        try {
            // 1. 解析交易
            const parsedTransactions = this.emailParser.parse(emailText);

            if (parsedTransactions.length === 0) {
                this.showNotification('未识别到交易信息', 'warning');
                return { success: false, transactions: [] };
            }

            // 2. 自动分类
            const classifiedTransactions = this.autoClassifier.batchClassify(parsedTransactions);

            // 3. 添加到当前账单
            const addedCount = this.addTransactionsToCurrentBill(classifiedTransactions);

            // 4. 保存数据
            this.saveAllData();

            this.showNotification(`成功添加 ${addedCount} 笔交易`, 'success');

            return { success: true, transactions: classifiedTransactions, addedCount };

        } catch (error) {
            console.error('Processing error:', error);
            this.showNotification('处理失败: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    addTransactionsToCurrentBill(transactions) {
        // 确定账单月份（使用第一笔交易的日期）
        if (transactions.length > 0) {
            const firstTx = transactions[0];
            const date = new Date(firstTx.date);
            this.currentBill = this.getOrCreateBill(date.getFullYear(), date.getMonth());
        } else if (!this.currentBill) {
            const now = new Date();
            this.currentBill = this.getOrCreateBill(now.getFullYear(), now.getMonth());
        }

        let addedCount = 0;
        for (const tx of transactions) {
            // 检查是否已存在（避免重复）
            const exists = this.currentBill.transactions.some(
                existing => this.isDuplicateTransaction(existing, tx)
            );

            if (!exists) {
                this.currentBill.addTransaction(tx);
                this.transactions.push(tx);
                addedCount++;
            }
        }

        return addedCount;
    }

    isDuplicateTransaction(tx1, tx2) {
        if (!tx1 || !tx2) return false;

        const sameDay = new Date(tx1.date).toDateString() === new Date(tx2.date).toDateString();
        const sameDesc = tx1.description === tx2.description;
        const similarAmount = Math.abs(tx1.amount - tx2.amount) < 0.01;

        return sameDay && sameDesc && similarAmount;
    }

    updateTransactionCategory(transactionId, categoryId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        const category = this.categories.find(c => c.id === categoryId);

        if (transaction && category) {
            transaction.setManualCategory(category);
            this.autoClassifier.learnFromManualClassification(transaction);
            this.saveAllData();
            return true;
        }

        return false;
    }

    removeTransaction(transactionId) {
        const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
            this.transactions.splice(transactionIndex, 1);

            // 从账单中也移除
            if (this.currentBill) {
                this.currentBill.removeTransaction(transactionId);
            }

            this.saveAllData();
            return true;
        }

        return false;
    }

    changeCurrentMonth(year, month) {
        this.currentBill = this.getOrCreateBill(year, month);
        return this.currentBill;
    }

    getNextMonth() {
        if (!this.currentBill) return null;

        let nextYear = this.currentBill.year;
        let nextMonth = this.currentBill.month + 1;

        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear++;
        }

        return this.getOrCreateBill(nextYear, nextMonth);
    }

    getPreviousMonth() {
        if (!this.currentBill) return null;

        let prevYear = this.currentBill.year;
        let prevMonth = this.currentBill.month - 1;

        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }

        return this.getOrCreateBill(prevYear, prevMonth);
    }

    markCurrentBillAsReconciled() {
        if (this.currentBill) {
            this.currentBill.markAsReconciled();
            this.saveAllData();
            this.showNotification('账单已标记为已对账', 'success');
        }
    }

    markCurrentBillAsUnreconciled() {
        if (this.currentBill) {
            this.currentBill.markAsUnreconciled();
            this.saveAllData();
            this.showNotification('账单已标记为未对账', 'info');
        }
    }

    saveAllData() {
        this.storage.saveTransactions(this.transactions);
        this.storage.saveMonthlyBills(this.monthlyBills);
        this.storage.saveCategories(this.categories);
        this.storage.saveClassificationHistory(
            this.autoClassifier.getClassificationHistory()
        );
    }

    exportData() {
        this.storage.downloadData();
        this.showNotification('数据导出成功', 'success');
    }

    async importData(file) {
        const success = await this.storage.importDataFromFile(file);
        if (success) {
            this.loadData();
            this.autoClassifier.updateCategories(this.categories);
            this.trendAnalyzer = new TrendAnalyzer(this.monthlyBills);

            const history = this.storage.loadClassificationHistory();
            this.autoClassifier.setClassificationHistory(history);

            const now = new Date();
            this.currentBill = this.getOrCreateBill(now.getFullYear(), now.getMonth());

            this.showNotification('数据导入成功', 'success');
            return true;
        } else {
            this.showNotification('导入失败：文件格式不正确', 'error');
            return false;
        }
    }

    showNotification(message, type = 'info') {
        if (!this.notificationContainer) {
            alert(message);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        this.notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getReport(year, month) {
        return this.trendAnalyzer.generateReport(year, month);
    }

    getCategoryTrend(year, month) {
        return this.trendAnalyzer.getCategoryTrend(year, month);
    }

    getMonthlyTrend(startDate, endDate) {
        return this.trendAnalyzer.getMonthlyTrend(startDate, endDate);
    }

    getYoYAnalysis(year, month) {
        return this.trendAnalyzer.getYoYAnalysis(year, month);
    }

    getMoMAnalysis(year, month) {
        return this.trendAnalyzer.getMoMAnalysis(year, month);
    }

    getMonthlyBillsList() {
        return [...this.monthlyBills]
            .sort((a, b) => {
                const dateA = new Date(a.year, a.month);
                const dateB = new Date(b.year, b.month);
                return dateB - dateA;
            });
    }

    addCategory(name, icon) {
        const id = 'category_' + Date.now();
        const category = new Category(
            id,
            name,
            icon || Category.generateRandomIcon(),
            Category.generateRandomColor()
        );

        this.categories.push(category);
        this.autoClassifier.updateCategories(this.categories);
        this.storage.saveCategories(this.categories);

        return category;
    }

    updateCategory(categoryId, updates) {
        const categoryIndex = this.categories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1) {
            Object.assign(this.categories[categoryIndex], updates);
            this.autoClassifier.updateCategories(this.categories);
            this.storage.saveCategories(this.categories);
            return true;
        }
        return false;
    }

    deleteCategory(categoryId) {
        const categoryIndex = this.categories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1 && categoryId !== 'other') {
            this.categories.splice(categoryIndex, 1);
            this.autoClassifier.updateCategories(this.categories);
            this.storage.saveCategories(this.categories);
            return true;
        }
        return false;
    }

    clearAllData() {
        this.transactions = [];
        this.monthlyBills = [];
        this.categories = Category.getDefaultCategories();

        const now = new Date();
        this.currentBill = this.getOrCreateBill(now.getFullYear(), now.getMonth());

        this.storage.clearAll();
        this.autoClassifier = new AutoClassifier(this.categories);
        this.trendAnalyzer = new TrendAnalyzer(this.monthlyBills);

        this.saveAllData();

        this.showNotification('所有数据已清除', 'info');
    }

    getStorageStats() {
        return this.storage.getStorageUsage();
    }

    optimizeClassifier() {
        this.autoClassifier.optimize(this.transactions);
        this.showNotification('分类器优化完成', 'success');
    }

    resetClassifier() {
        this.autoClassifier.reset();
        this.storage.clearClassificationHistory();
        this.showNotification('分类器已重置', 'info');
    }

    getAvailableMonths() {
        const months = [];

        if (this.monthlyBills.length === 0) {
            const now = new Date();
            return [{ year: now.getFullYear(), month: now.getMonth(), label: Utils.getMonthName(now.getMonth()) }];
        }

        // 获取最早和最晚的月份
        const sortedBills = [...this.monthlyBills].sort((a, b) => {
            const dateA = new Date(a.year, a.month);
            const dateB = new Date(b.year, b.month);
            return dateA - dateB;
        });

        const first = sortedBills[0];
        const last = sortedBills[sortedBills.length - 1];

        // 生成中间所有月份
        let currentYear = first.year;
        let currentMonth = first.month;

        while (currentYear < last.year || (currentYear === last.year && currentMonth <= last.month)) {
            months.push({
                year: currentYear,
                month: currentMonth,
                label: `${currentYear}年${Utils.getMonthName(currentMonth)}`
            });

            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        // 倒序返回（最新的在前）
        return months.reverse();
    }
}