/**
 * 自动分类器 - AutoClassifier
 * 负责交易的自动分类和学习
 */
class AutoClassifier {
    constructor(categories = []) {
        this.categories = categories;
        this.ruleEngine = new RuleEngine();
        this.classificationHistory = new Map(); // 历史分类记录
    }

    /**
     * 分类单个交易
     * @param {Transaction} transaction 交易对象
     * @returns {Category|null} 分类对象
     */
    classify(transaction) {
        // 1. 首先检查历史分类（学习用户行为）
        const historicalCategory = this.getHistoricalCategory(transaction);
        if (historicalCategory) {
            return historicalCategory;
        }

        // 2. 检查规则引擎
        const ruleCategoryId = this.ruleEngine.match(transaction);
        if (ruleCategoryId) {
            const category = this.categories.find(c => c.id === ruleCategoryId);
            if (category) {
                return category;
            }
        }

        // 3. 关键词匹配
        const keywordCategory = this.matchByKeywords(transaction);
        if (keywordCategory) {
            return keywordCategory;
        }

        // 4. 默认分类
        return this.getDefaultCategory();
    }

    /**
     * 获取历史分类
     * @param {Transaction} transaction 交易对象
     * @returns {Category|null} 分类对象
     */
    getHistoricalCategory(transaction) {
        const key = this.getDescriptionKey(transaction.description);
        const categoryId = this.classificationHistory.get(key);

        if (categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            if (category) {
                return category;
            }
        }

        return null;
    }

    /**
     * 学习用户的手动分类
     * @param {Transaction} transaction 交易对象
     */
    learnFromManualClassification(transaction) {
        if (transaction.manualCategory) {
            const key = this.getDescriptionKey(transaction.description);
            this.classificationHistory.set(key, transaction.manualCategory.id);

            // 同时更新关键词
            transaction.manualCategory.addKeyword(transaction.description);
        }
    }

    /**
     * 获取描述的标准化键（用于历史记录匹配）
     * @param {string} description 原始描述
     * @returns {string} 标准化键
     */
    getDescriptionKey(description) {
        return description.toLowerCase()
            .replace(/\d{4}[-/]\d{2}[-/]\d{2}/g, '')
            .replace(/[\d,.]+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 关键词匹配
     * @param {Transaction} transaction 交易对象
     * @returns {Category|null} 匹配到的分类
     */
    matchByKeywords(transaction) {
        for (const category of this.categories) {
            if (category.matchesDescription(transaction.description)) {
                return category;
            }
        }
        return null;
    }

    /**
     * 获取默认分类
     * @returns {Category} 默认分类
     */
    getDefaultCategory() {
        return this.categories.find(c => c.id === 'other') || this.categories[0];
    }

    /**
     * 批量分类
     * @param {Array<Transaction>} transactions 交易数组
     * @returns {Array<Transaction>} 分类后的交易数组
     */
    batchClassify(transactions) {
        return transactions.map(tx => {
            if (!tx.category) {
                tx.category = this.classify(tx);
            }
            return tx;
        });
    }

    /**
     * 更新分类列表
     * @param {Array<Category>} categories 新的分类列表
     */
    updateCategories(categories) {
        this.categories = categories;
    }

    /**
     * 获取分类历史记录
     * @returns {Map} 分类历史
     */
    getClassificationHistory() {
        return this.classificationHistory;
    }

    /**
     * 设置分类历史记录
     * @param {Map} history 分类历史
     */
    setClassificationHistory(history) {
        this.classificationHistory = new Map(history);
    }

    /**
     * 清除分类历史
     */
    clearClassificationHistory() {
        this.classificationHistory.clear();
    }

    /**
     * 获取分类历史统计
     * @returns {Object} 统计信息
     */
    getHistoryStats() {
        return {
            totalEntries: this.classificationHistory.size,
            categories: Array.from(this.classificationHistory.values()).reduce((stats, catId) => {
                stats[catId] = (stats[catId] || 0) + 1;
                return stats;
            }, {})
        };
    }

    /**
     * 导出分类历史
     * @returns {string} JSON字符串
     */
    exportHistory() {
        const historyArray = Array.from(this.classificationHistory.entries());
        return JSON.stringify(historyArray, null, 2);
    }

    /**
     * 导入分类历史
     * @param {string} jsonString JSON字符串
     * @returns {boolean} 是否成功
     */
    importHistory(jsonString) {
        try {
            const historyData = JSON.parse(jsonString);
            this.classificationHistory = new Map(historyData);
            return true;
        } catch (error) {
            console.error('History import error:', error);
            return false;
        }
    }

    /**
     * 获取分类器性能统计
     * @param {Array<Transaction>} sampleTransactions 样本交易
     * @returns {Object} 统计信息
     */
    getPerformanceStats(sampleTransactions) {
        const classified = this.batchClassify([...sampleTransactions]);
        const correctlyClassified = classified.filter(tx => tx.category);

        return {
            totalTransactions: sampleTransactions.length,
            classifiedTransactions: correctlyClassified.length,
            unclassifiedTransactions: sampleTransactions.length - correctlyClassified.length,
            classificationRate: sampleTransactions.length > 0
                ? (correctlyClassified.length / sampleTransactions.length) * 100
                : 0,
            byCategory: this.getCategoryDistribution(classified),
            avgConfidence: this.getAverageConfidence(classified)
        };
    }

    /**
     * 获取分类分布
     * @param {Array<Transaction>} transactions 交易数组
     * @returns {Object} 分类分布
     */
    getCategoryDistribution(transactions) {
        const distribution = {};

        transactions.forEach(tx => {
            const categoryId = tx.getFinalCategory()?.id || 'uncategorized';
            distribution[categoryId] = (distribution[categoryId] || 0) + 1;
        });

        return distribution;
    }

    /**
     * 评估置信度（根据匹配方式）
     * @param {Transaction} transaction 交易对象
     * @returns {number} 置信度 (0-100)
     */
    evaluateConfidence(transaction) {
        if (this.getHistoricalCategory(transaction)) {
            return 95; // 历史分类有很高的置信度
        }

        const ruleCategoryId = this.ruleEngine.match(transaction);
        if (ruleCategoryId) {
            return 85; // 规则匹配置信度
        }

        const keywordCategory = this.matchByKeywords(transaction);
        if (keywordCategory) {
            return 75; // 关键词匹配置信度
        }

        return 50; // 默认分类置信度较低
    }

    /**
     * 获取平均置信度
     * @param {Array<Transaction>} transactions 交易数组
     * @returns {number} 平均置信度
     */
    getAverageConfidence(transactions) {
        if (transactions.length === 0) return 0;

        const totalConfidence = transactions.reduce((sum, tx) => sum + this.evaluateConfidence(tx), 0);
        return totalConfidence / transactions.length;
    }

    /**
     * 优化分类器（自动调整关键词）
     * @param {Array<Transaction>} transactions 训练数据
     */
    optimize(transactions) {
        const transactionsWithManualCategory = transactions.filter(tx => tx.manualCategory);

        transactionsWithManualCategory.forEach(tx => {
            const category = tx.manualCategory;
            const description = tx.description;

            // 自动提取关键词
            const words = this.extractKeywordsFromDescription(description);
            words.forEach(word => {
                category.addKeyword(word);
            });
        });
    }

    /**
     * 从描述中提取潜在关键词
     * @param {string} description 原始描述
     * @returns {Array} 关键词数组
     */
    extractKeywordsFromDescription(description) {
        const words = description.split(/[^\u4e00-\u9fa5a-zA-Z]+/).filter(word => word.length > 2);
        return Array.from(new Set(words)); // 去重
    }

    /**
     * 重置分类器
     */
    reset() {
        this.classificationHistory.clear();
        this.categories.forEach(category => {
            category.setDefaultKeywords();
        });
    }
}