/**
 * 规则引擎 - RuleEngine
 * 基于规则的交易分类系统
 */
class RuleEngine {
    constructor() {
        this.rules = this.getDefaultRules();
    }

    /**
     * 获取默认分类规则
     * @returns {Array} 默认规则数组
     */
    getDefaultRules() {
        return [
            {
                id: 'food_meituan',
                name: '美团相关消费',
                conditions: [
                    { field: 'description', operator: 'contains', value: '美团' }
                ],
                categoryId: 'food',
                priority: 10
            },
            {
                id: 'food_eleme',
                name: '饿了么相关消费',
                conditions: [
                    { field: 'description', operator: 'contains', value: '饿了么' }
                ],
                categoryId: 'food',
                priority: 10
            },
            {
                id: 'transport_didi',
                name: '滴滴出行',
                conditions: [
                    { field: 'description', operator: 'contains', value: '滴滴' }
                ],
                categoryId: 'transport',
                priority: 10
            },
            {
                id: 'transport_subway',
                name: '地铁交通',
                conditions: [
                    { field: 'description', operator: 'contains', value: '地铁' }
                ],
                categoryId: 'transport',
                priority: 10
            },
            {
                id: 'shopping_taobao',
                name: '淘宝购物',
                conditions: [
                    { field: 'description', operator: 'contains', value: '淘宝' }
                ],
                categoryId: 'shopping',
                priority: 10
            },
            {
                id: 'shopping_jd',
                name: '京东购物',
                conditions: [
                    { field: 'description', operator: 'contains', value: '京东' }
                ],
                categoryId: 'shopping',
                priority: 10
            },
            {
                id: 'entertainment_movie',
                name: '电影娱乐',
                conditions: [
                    { field: 'description', operator: 'contains', value: '电影' }
                ],
                categoryId: 'entertainment',
                priority: 9
            },
            {
                id: 'health_hospital',
                name: '医疗支出',
                conditions: [
                    { field: 'description', operator: 'contains', value: '医院' }
                ],
                categoryId: 'health',
                priority: 10
            },
            {
                id: 'education_training',
                name: '教育培训',
                conditions: [
                    { field: 'description', operator: 'contains', value: '培训' }
                ],
                categoryId: 'education',
                priority: 9
            },
            {
                id: 'bills_water',
                name: '水电费',
                conditions: [
                    { field: 'description', operator: 'contains', value: '水电' }
                ],
                categoryId: 'bills',
                priority: 10
            },
            {
                id: 'large_amount',
                name: '大额消费',
                conditions: [
                    { field: 'amount', operator: 'greater_than', value: 1000 },
                    { field: 'isRefund', operator: 'equals', value: false }
                ],
                categoryId: 'other',
                priority: 8
            },
            {
                id: 'small_amount',
                name: '小额消费',
                conditions: [
                    { field: 'amount', operator: 'less_than', value: 10 },
                    { field: 'isRefund', operator: 'equals', value: false }
                ],
                categoryId: 'food',
                priority: 7
            }
        ];
    }

    /**
     * 添加规则
     * @param {Object} rule 规则对象
     */
    addRule(rule) {
        this.rules.push(rule);
        this.rules.sort((a, b) => b.priority - a.priority);
    }

    /**
     * 移除规则
     * @param {string} ruleId 规则ID
     * @returns {boolean} 是否成功
     */
    removeRule(ruleId) {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(r => r.id !== ruleId);
        return this.rules.length < initialLength;
    }

    /**
     * 更新规则
     * @param {string} ruleId 规则ID
     * @param {Object} updates 更新内容
     * @returns {boolean} 是否成功
     */
    updateRule(ruleId, updates) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            Object.assign(rule, updates);
            this.rules.sort((a, b) => b.priority - a.priority);
            return true;
        }
        return false;
    }

    /**
     * 查找规则
     * @param {string} ruleId 规则ID
     * @returns {Object|null} 规则对象
     */
    findRule(ruleId) {
        return this.rules.find(r => r.id === ruleId);
    }

    /**
     * 列出所有规则
     * @returns {Array} 规则数组
     */
    listRules() {
        return [...this.rules];
    }

    /**
     * 清空所有规则
     */
    clearRules() {
        this.rules = [];
    }

    /**
     * 重置为默认规则
     */
    resetToDefaults() {
        this.rules = this.getDefaultRules();
    }

    /**
     * 匹配交易到规则
     * @param {Transaction} transaction 交易对象
     * @returns {string|null} 匹配到的分类ID
     */
    match(transaction) {
        // 遍历规则（按优先级降序）
        for (const rule of this.rules) {
            if (this.evaluateRule(rule, transaction)) {
                return rule.categoryId;
            }
        }

        return null;
    }

    /**
     * 评估规则是否匹配
     * @param {Object} rule 规则
     * @param {Transaction} transaction 交易
     * @returns {boolean} 是否匹配
     */
    evaluateRule(rule, transaction) {
        return rule.conditions.every(condition =>
            this.evaluateCondition(condition, transaction)
        );
    }

    /**
     * 评估单个条件
     * @param {Object} condition 条件
     * @param {Transaction} transaction 交易
     * @returns {boolean} 是否满足条件
     */
    evaluateCondition(condition, transaction) {
        const { field, operator, value } = condition;
        const txValue = transaction[field];

        switch (operator) {
            case 'contains':
                return txValue && txValue.toLowerCase().includes(value.toLowerCase());
            case 'equals':
                if (typeof txValue === 'boolean' && typeof value === 'boolean') {
                    return txValue === value;
                }
                return txValue === value;
            case 'greater_than':
                return txValue > value;
            case 'less_than':
                return txValue < value;
            case 'greater_than_or_equal':
                return txValue >= value;
            case 'less_than_or_equal':
                return txValue <= value;
            case 'starts_with':
                return txValue && txValue.toLowerCase().startsWith(value.toLowerCase());
            case 'ends_with':
                return txValue && txValue.toLowerCase().endsWith(value.toLowerCase());
            case 'regex':
                return new RegExp(value).test(txValue);
            default:
                return false;
        }
    }

    /**
     * 获取匹配到的所有规则
     * @param {Transaction} transaction 交易
     * @returns {Array} 匹配到的规则数组
     */
    getMatchingRules(transaction) {
        return this.rules.filter(rule => this.evaluateRule(rule, transaction));
    }

    /**
     * 规则验证
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];

        this.rules.forEach(rule => {
            if (!rule.id) {
                errors.push('规则缺少ID');
            }
            if (!rule.conditions || !Array.isArray(rule.conditions)) {
                errors.push(`规则 ${rule.id} 条件格式不正确`);
            } else {
                rule.conditions.forEach((cond, index) => {
                    if (!cond.field || !cond.operator || cond.value === undefined) {
                        errors.push(`规则 ${rule.id} 条件 ${index} 格式不正确`);
                    }
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            summary: {
                totalRules: this.rules.length,
                errorCount: errors.length,
                validRules: this.rules.length - errors.length
            }
        };
    }

    /**
     * 规则统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            totalRules: this.rules.length,
            byCategory: this.getRulesByCategory(),
            byPriority: this.getRulesByPriority(),
            averageConditions: this.rules.length > 0
                ? this.rules.reduce((sum, rule) => sum + rule.conditions.length, 0) / this.rules.length
                : 0
        };
    }

    /**
     * 按分类统计规则
     * @returns {Object} 分类统计
     */
    getRulesByCategory() {
        const stats = {};
        this.rules.forEach(rule => {
            if (!stats[rule.categoryId]) {
                stats[rule.categoryId] = 0;
            }
            stats[rule.categoryId]++;
        });
        return stats;
    }

    /**
     * 按优先级统计规则
     * @returns {Object} 优先级统计
     */
    getRulesByPriority() {
        const stats = {};
        this.rules.forEach(rule => {
            if (!stats[rule.priority]) {
                stats[rule.priority] = 0;
            }
            stats[rule.priority]++;
        });
        return stats;
    }

    /**
     * 导出规则为JSON
     * @returns {string} JSON字符串
     */
    exportRules() {
        return JSON.stringify(this.rules, null, 2);
    }

    /**
     * 从JSON导入规则
     * @param {string} jsonString JSON字符串
     * @returns {boolean} 是否成功
     */
    importRules(jsonString) {
        try {
            const rules = JSON.parse(jsonString);
            if (Array.isArray(rules)) {
                this.rules = rules;
                this.rules.sort((a, b) => b.priority - a.priority);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Rule import error:', error);
            return false;
        }
    }
}