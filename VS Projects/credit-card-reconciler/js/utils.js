/**
 * 信用卡对账应用 - 工具函数库
 * 提供通用的工具方法，类似贪吃蛇游戏的 utils.js
 */

const Utils = {
    // ================= 数学工具 =================

    /**
     * 生成随机整数
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {number} 随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 格式化金额显示
     * @param {number} amount 金额
     * @param {string} currency 货币符号
     * @returns {string} 格式化后的金额字符串
     */
    formatAmount(amount, currency = 'CNY') {
        const absAmount = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';

        const currencySymbols = {
            CNY: '¥',
            USD: '$',
            EUR: '€',
            GBP: '£'
        };

        const symbol = currencySymbols[currency] || '¥';

        // 保留两位小数，添加千位分隔符
        return `${sign}${symbol}${absAmount.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    },

    // ================= 日期工具 =================

    /**
     * 格式化日期
     * @param {Date|string} date 日期对象或字符串
     * @param {string} format 格式化字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = date instanceof Date ? date : new Date(date);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 获取月份名称
     * @param {number} month 月份 (0-11)
     * @param {string} lang 语言 'zh' 或 'en'
     * @returns {string} 月份名称
     */
    getMonthName(month, lang = 'zh') {
        const monthsZh = [
            '一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'
        ];

        const monthsEn = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return lang === 'zh' ? monthsZh[month] : monthsEn[month];
    },

    /**
     * 获取星期几名称
     * @param {number} day 星期几 (0-6)
     * @param {string} lang 语言
     * @returns {string} 星期几名称
     */
    getDayName(day, lang = 'zh') {
        const daysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return lang === 'zh' ? daysZh[day] : daysEn[day];
    },

    /**
     * 计算两个日期之间的月份数
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {number} 月份数
     */
    getMonthDiff(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    },

    /**
     * 获取指定年月的第一天和最后一天
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {{start: Date, end: Date}} 第一天和最后一天
     */
    getMonthRange(year, month) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);

        return { start, end };
    },

    // ================= 字符串工具 =================

    /**
     * 字符串截断
     * @param {string} str 原字符串
     * @param {number} length 最大长度
     * @param {string} suffix 后缀
     * @returns {string} 截断后的字符串
     */
    truncate(str, length = 20, suffix = '...') {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.slice(0, length - suffix.length) + suffix;
    },

    /**
     * 去除字符串中所有非字母数字字符
     * @param {string} str 原字符串
     * @returns {string} 处理后的字符串
     */
    removeSpecialChars(str) {
        return str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
    },

    /**
     * 提取字符串中的数字
     * @param {string} str 原字符串
     * @returns {string} 提取到的数字字符串
     */
    extractNumbers(str) {
        return str.replace(/[^0-9.]/g, '');
    },

    // ================= DOM工具 =================

    /**
     * 创建DOM元素
     * @param {string} tag 标签名
     * @param {Object} attributes 属性对象
     * @param {Array<HTMLElement|string>} children 子元素
     * @returns {HTMLElement} 创建的DOM元素
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);

        // 设置属性
        Object.entries(attributes).forEach(([key, value]) => {
            if (key.startsWith('on')) {
                // 事件监听
                const eventName = key.toLowerCase().slice(2);
                element.addEventListener(eventName, value);
            } else if (key === 'class') {
                element.className = value;
            } else if (key === 'style') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        // 添加子元素
        children.forEach(child => {
            if (typeof child === 'string') {
                element.textContent = child;
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });

        return element;
    },

    /**
     * 防抖函数
     * @param {Function} func 要执行的函数
     * @param {number} wait 延迟时间
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func 要执行的函数
     * @param {number} limit 时间限制
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ================= 验证工具 =================

    /**
     * 验证邮箱格式
     * @param {string} email 邮箱地址
     * @returns {boolean} 是否有效
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * 验证金额格式
     * @param {string} amount 金额字符串
     * @returns {boolean} 是否有效
     */
    isValidAmount(amount) {
        const amountRegex = /^[¥$]?\d+(\.\d{1,2})?$/;
        return amountRegex.test(amount);
    },

    /**
     * 验证日期格式
     * @param {string} dateStr 日期字符串
     * @param {string} format 格式 (YYYY-MM-DD, MM/DD/YYYY, etc.)
     * @returns {boolean} 是否有效
     */
    isValidDate(dateStr, format = 'YYYY-MM-DD') {
        if (format === 'YYYY-MM-DD') {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(dateStr)) return false;
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 10) === dateStr;
        }
        return false;
    },

    // ================= 存储工具 =================

    /**
     * 深度复制对象
     * @param {any} obj 要复制的对象
     * @returns {any} 复制后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },

    /**
     * 合并对象（深度合并）
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     * @returns {Object} 合并后的对象
     */
    mergeObjects(target, source) {
        const result = this.deepClone(target);

        Object.keys(source).forEach(key => {
            const targetValue = result[key];
            const sourceValue = source[key];

            if (typeof targetValue === 'object' && typeof sourceValue === 'object' && targetValue !== null && sourceValue !== null) {
                result[key] = this.mergeObjects(targetValue, sourceValue);
            } else {
                result[key] = sourceValue;
            }
        });

        return result;
    },

    // ================= 颜色工具 =================

    /**
     * 随机颜色
     * @param {boolean} isDark 是否深色
     * @returns {string} 颜色代码
     */
    randomColor(isDark = false) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
            '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8',
            '#fdcb6e', '#e17055', '#00b894', '#0984e3'
        ];

        return isDark ? colors.slice(0, 6)[Math.floor(Math.random() * 6)] : colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * 浅色/深色主题颜色
     * @param {string} color 原颜色
     * @param {number} percent 调整百分比
     * @returns {string} 调整后的颜色
     */
    lightenDarkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;

        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    },

    // ================= 性能工具 =================

    /**
     * 测量函数执行时间
     * @param {Function} func 要测量的函数
     * @param {Array} args 参数数组
     * @returns {Array} [执行结果, 执行时间(ms)]
     */
    measureExecutionTime(func, args = []) {
        const startTime = performance.now();
        const result = func(...args);
        const endTime = performance.now();
        return [result, endTime - startTime];
    },

    // ================= 导出工具 =================

    /**
     * 下载文件
     * @param {string} content 文件内容
     * @param {string} filename 文件名
     * @param {string} mimeType MIME类型
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 读取文件
     * @param {File} file 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsText(file);
        });
    },

    // ================= 其他工具 =================

    /**
     * 格式化字节数为可读格式
     * @param {number} bytes 字节数
     * @param {number} decimals 小数位数
     * @returns {string} 格式化后的字符串
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * 生成唯一ID
     * @param {string} prefix 前缀
     * @returns {string} 唯一ID
     */
    generateId(prefix = 'id') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 休眠函数
     * @param {number} ms 毫秒数
     * @returns {Promise} 延迟后的Promise
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}