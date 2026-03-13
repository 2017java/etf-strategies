/**
 * 分类数据模型 - Category
 */
class Category {
    constructor(id, name, icon, color, parentId = null) {
        this.id = id;
        this.name = name;
        this.icon = icon;           // emoji或图标类名
        this.color = color;         // 颜色代码
        this.parentId = parentId;   // 父分类ID（支持层级）
        this.keywords = [];         // 自动分类关键词
    }

    // 添加关键词
    addKeyword(keyword) {
        if (!this.keywords.includes(keyword.toLowerCase())) {
            this.keywords.push(keyword.toLowerCase());
        }
    }

    // 删除关键词
    removeKeyword(keyword) {
        const index = this.keywords.indexOf(keyword.toLowerCase());
        if (index > -1) {
            this.keywords.splice(index, 1);
        }
    }

    // 清空所有关键词
    clearKeywords() {
        this.keywords = [];
    }

    // 匹配交易描述
    matchesDescription(description) {
        const desc = description.toLowerCase();
        return this.keywords.some(keyword => desc.includes(keyword));
    }

    // 设置默认关键词（根据分类名称）
    setDefaultKeywords() {
        const defaultKeywords = {
            food: ['美团', '饿了么', '肯德基', '麦当劳', '餐厅', '外卖', '吃饭', '餐饮'],
            transport: ['滴滴', '地铁', '公交', '打车', '加油', '停车', '交通'],
            shopping: ['淘宝', '京东', '拼多多', '商场', '超市', '购物', '电商'],
            entertainment: ['电影', '音乐', '游戏', '娱乐', 'KTV', '旅游', '酒店'],
            bills: ['水电费', '煤气费', '物业费', '房租', '账单', '缴费'],
            health: ['医院', '药房', '挂号', '体检', '医疗', '药店'],
            education: ['培训', '课程', '学费', '书本', '教育'],
            other: ['其他', '未知', '杂项']
        };

        const keywords = defaultKeywords[this.id] || [];
        this.keywords = keywords;
    }

    // 检查是否为顶层分类
    isTopLevel() {
        return this.parentId === null;
    }

    // 获取分类层级路径
    getPath(categories = []) {
        const path = [];
        let current = this;

        while (current) {
            path.unshift(current);
            if (current.isTopLevel()) {
                break;
            }
            current = categories.find(c => c.id === current.parentId);
        }

        return path;
    }

    // 获取完整路径字符串
    getPathString(categories = []) {
        return this.getPath(categories).map(c => c.name).join(' > ');
    }

    // 检查是否为子分类
    isChildCategory() {
        return this.parentId !== null;
    }

    // 转换为可存储的对象格式
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            color: this.color,
            parentId: this.parentId,
            keywords: [...this.keywords]
        };
    }

    // 从JSON数据创建Category实例
    static fromJSON(data) {
        const category = new Category(
            data.id,
            data.name,
            data.icon,
            data.color,
            data.parentId
        );
        category.keywords = data.keywords || [];
        return category;
    }

    // 创建默认分类列表
    static getDefaultCategories() {
        return [
            new Category('food', '餐饮', '🍜', '#ff6b6b'),
            new Category('transport', '交通', '🚗', '#4ecdc4'),
            new Category('shopping', '购物', '🛍️', '#45b7d1'),
            new Category('entertainment', '娱乐', '🎮', '#96ceb4'),
            new Category('bills', '账单', '📄', '#ffeaa7'),
            new Category('health', '医疗', '💊', '#dfe6e9'),
            new Category('education', '教育', '📚', '#a29bfe'),
            new Category('other', '其他', '📦', '#636e72')
        ].map(category => {
            category.setDefaultKeywords();
            return category;
        });
    }

    // 生成随机颜色（用于创建新分类）
    static generateRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
            '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
            '#fdcb6e', '#e17055', '#00b894', '#0984e3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 生成随机图标（用于创建新分类）
    static generateRandomIcon() {
        const icons = ['🍔', '🍕', '🍱', '🍜', '🍛', '🍚', '🍙', '🍘', '🍢', '🍣',
                      '🍤', '🍥', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🍫',
                      '🍬', '🍭', '🍮', '🍯', '🍼', '🍵', '🍶', '🍷', '🍸', '🍹',
                      '🍺', '🍻', '🍼', '🎁', '🎀', '🎉', '🎊', '🎈', '⚽', '🏀',
                      '🏈', '⚾', '🎾', '🏐', '🏉', '🎿', '🏂', '🏃', '🏊', '🚣',
                      '🚴', '🚵', '🚶', '🚗', '🚕', '🚙', '🚌', '🚎', '🚓', '🚑',
                      '🚒', '🚀', '✈️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈',
                      '🚉', '🚊', '🚝', '🚞', '🚠', '🚡', '🚢', '🎠', '🎡', '🎢'];
        return icons[Math.floor(Math.random() * icons.length)];
    }
}