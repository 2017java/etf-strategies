# 信用卡对账系统 - 项目架构和开发约定

## 项目概述

这是一个纯前端的信用卡账单对账和分析Web应用，帮助用户自动解析信用卡账单邮件文本，智能分类交易，并提供详细的数据分析和可视化功能。

## 架构风格

### 核心架构原则

项目采用**模块化面向对象设计**，遵循以下架构原则：

1. **单一职责原则** - 每个模块负责单一功能
2. **依赖倒置** - 依赖抽象而不是具体实现
3. **开闭原则** - 对扩展开放，对修改封闭
4. **分离关注点** - 清晰的分层架构

### 技术栈

#### 前端技术
```
HTML5 + CSS3 + JavaScript (ES6+)
```

#### 存储方案
```
localStorage (浏览器本地存储)
```

#### 视觉方案
```
响应式设计 + 现代CSS布局 (Flexbox, Grid)
```

## 系统架构

### 架构图

```
┌─────────────────────────────────────────────────────┐
│         用户界面层 (UI Layer)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │  Dashboard   │ │ Transactions │ │  Analytics   │ │
│  │  View        │ │  View        │ │  View        │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│         应用控制器层 (Controller Layer)             │
│          ┌───────────────────────┐                  │
│          │   AppController       │                  │
│          │                       │                  │
│          └───────────────────────┘                  │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│         业务逻辑层 (Business Logic Layer)             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │  EmailParser │ │ Classifiers  │ │   Analyzer   │ │
│  │              │ │              │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│         数据模型层 (Data Model Layer)                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Transaction  │ │  Category    │ │ MonthlyBill  │ │
│  │              │ │              │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│         数据存储层 (Storage Layer)                   │
│         ┌───────────────────────┐                   │
│         │  StorageManager       │                   │
│         │  (localStorage)       │                   │
│         └───────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

## 文件结构

```
credit-card-reconciler/
├── index.html                    # 主HTML文件
├── css/
│   └── style.css                 # 响应式样式文件
├── js/
│   ├── utils.js                  # 工具函数库
│   ├── models/                   # 数据模型类
│   │   ├── Transaction.js
│   │   ├── Category.js
│   │   └── MonthlyBill.js
│   ├── parsers/                  # 解析器类
│   │   └── EmailParser.js
│   ├── classifiers/              # 分类器类
│   │   ├── AutoClassifier.js
│   │   └── RuleEngine.js
│   ├── storage/                  # 存储管理
│   │   └── StorageManager.js
│   ├── analytics/                # 分析器类
│   │   ├── TrendAnalyzer.js
│   │   └── Statistics.js
│   ├── views/                    # 视图组件
│   │   ├── DashboardView.js
│   │   ├── TransactionListView.js
│   │   └── ChartView.js
│   ├── controllers/              # 控制器
│   │   └── AppController.js
│   └── app.js                    # 应用入口
├── test/                         # 测试文件
│   └── demo.js
├── README.md                     # 项目说明
└── CLAUDE.md                     # 本文档
```

## 类设计规范

### 数据模型类

```javascript
// 基本结构
class Model {
    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // 转换为JSON可序列化对象
    toJSON() {
        return {
            // 包含所有属性的序列化版本
        };
    }

    // 从JSON数据创建实例
    static fromJSON(data) {
        return new Model(data);
    }
}
```

### 视图类

```javascript
class View {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.isHidden = false;
    }

    render() { /* 渲染视图 */ }
    show() { /* 显示视图 */ }
    hide() { /* 隐藏视图 */ }
    bindEvents() { /* 绑定事件 */ }
}
```

### 控制器类

```javascript
class Controller {
    constructor() {
        this.data = [];
        this.loadData();
    }

    loadData() { /* 加载数据 */ }
    saveData() { /* 保存数据 */ }
    updateState() { /* 更新状态 */ }
}
```

## 代码风格约定

### 变量命名

```javascript
// 常量 - 大写蛇形
const MAX_LIMIT = 100;

// 变量 - 驼峰命名
let userName = '张三';

// 类 - 帕斯卡命名
class UserProfile {
}

// 方法 - 动词开头
function getUserName() {
}

// 私有变量 - 下划线前缀
let _internalState = 0;
```

### 注释风格

```javascript
/**
 * 函数说明
 * @param {类型} 参数名 参数说明
 * @returns {类型} 返回值说明
 */
function add(a, b) {
    return a + b;
}

// 单行注释
const value = 0;
```

## 邮件解析规则

### 解析优先级

```javascript
// 优先级顺序
1. 交易行匹配 (YYYY-MM-DD 描述 金额)
2. 金额匹配 (交易金额: xxx)
3. 日期匹配 (交易日期: YYYY-MM-DD)
4. 商户匹配 (商户名称: 名称)
```

### 支持的格式

```
2024-01-15  美团外卖       ¥32.50
2024-01-14  滴滴出行       ¥28.00
2024-01-13  淘宝购物       ¥199.00
```

## 分类策略

### 分类优先级

```javascript
// 分类优先级
1. 历史分类检查 (学习用户行为)
2. 规则引擎匹配 (高优先级)
3. 关键词匹配 (分类关键词库)
4. 默认分类 (归入"其他")
```

### 分类数据结构

```javascript
// 分类对象
{
    id: "food",
    name: "餐饮",
    icon: "🍜",
    color: "#ff6b6b",
    keywords: ["美团", "饿了么", "肯德基", "麦当劳"]
}
```

## 数据存储规范

### localStorage 存储结构

```javascript
// 键名前缀
const STORAGE_PREFIX = 'cc_reconciler_';

// 存储内容
{
    "cc_reconciler_transactions": [...],       // 交易记录
    "cc_reconciler_categories": [...],         // 分类信息
    "cc_reconciler_monthly_bills": [...],      // 月度账单
    "cc_reconciler_settings": {...},           // 用户设置
    "cc_reconciler_classification_history": [...] // 分类历史
}
```

### 数据导出格式

```json
{
    "version": "1.0",
    "exportedAt": "2024-01-01T00:00:00.000Z",
    "transactions": [...],
    "categories": [...],
    "monthlyBills": [...],
    "settings": {...}
}
```

## 响应式设计规范

### 断点设计

```css
/* 移动端 */
@media (max-width: 480px) {
}

/* 平板端 */
@media (min-width: 481px) and (max-width: 768px) {
}

/* 桌面端 */
@media (min-width: 769px) {
}
```

### 布局策略

```css
/* 移动端 */
.container {
    grid-template-columns: 1fr;
}

/* 平板端 */
@media (min-width: 768px) {
    .container {
        grid-template-columns: 1fr 1fr;
    }
}

/* 桌面端 */
@media (min-width: 1024px) {
    .container {
        grid-template-columns: 1fr 1fr 1fr;
    }
}
```

## 错误处理约定

```javascript
try {
    // 可能出错的代码
} catch (error) {
    console.error('错误描述:', error);
    showNotification('操作失败', 'error');
}

// 使用Promise.catch()
somePromise()
    .then(result => /* 处理结果 */)
    .catch(error => {
        console.error('错误:', error);
        showNotification('操作失败', 'error');
    });
```

## 性能优化约定

### 加载优化

```javascript
// 使用 defer 或 async
<script src="script.js" defer></script>

// 按需加载
if (condition) {
    import('module').then(module => {
        module.doSomething();
    });
}
```

### 渲染优化

```javascript
// 使用事件委托
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        // 处理删除
    }
});

// 使用 requestAnimationFrame
function animate() {
    requestAnimationFrame(animate);
}
```

## 开发流程

### 功能开发流程

```
1. 创建项目目录结构
2. 实现工具函数库 utils.js
3. 开发数据模型类
4. 实现核心功能类
5. 开发视图组件
6. 实现主页面和样式
7. 测试和优化功能
8. 提交代码
```

### Git 提交规范

```
feat: 添加新功能
fix: 修复bug
refactor: 重构代码
docs: 文档变更
style: 格式化代码
test: 测试相关
```

---

本文档仅适用于信用卡对账系统项目。所有开发工作应遵循这些约定，以确保代码质量和一致性。