/**
 * 统计计算器 - Statistics
 * 提供各种统计计算方法
 */
class Statistics {
    /**
     * 计算总和
     * @param {Array} values 数值数组
     * @returns {number} 总和
     */
    static sum(values) {
        return values.reduce((sum, v) => sum + v, 0);
    }

    /**
     * 计算平均值
     * @param {Array} values 数值数组
     * @returns {number} 平均值
     */
    static mean(values) {
        if (values.length === 0) return 0;
        return this.sum(values) / values.length;
    }

    /**
     * 计算中位数
     * @param {Array} values 数值数组
     * @returns {number} 中位数
     */
    static median(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * 计算众数
     * @param {Array} values 数值数组
     * @returns {number|Array} 众数
     */
    static mode(values) {
        const counts = {};
        values.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(counts));
        const modes = Object.keys(counts)
            .map(Number)
            .filter(value => counts[value] === maxCount);

        return modes.length === 1 ? modes[0] : modes;
    }

    /**
     * 计算方差
     * @param {Array} values 数值数组
     * @returns {number} 方差
     */
    static variance(values) {
        const avg = this.mean(values);
        const sumOfSquares = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0);
        return sumOfSquares / values.length;
    }

    /**
     * 计算标准差
     * @param {Array} values 数值数组
     * @returns {number} 标准差
     */
    static standardDeviation(values) {
        return Math.sqrt(this.variance(values));
    }

    /**
     * 计算变异系数
     * @param {Array} values 数值数组
     * @returns {number} 变异系数
     */
    static coefficientOfVariation(values) {
        const mean = this.mean(values);
        if (mean === 0) return 0;
        return (this.standardDeviation(values) / mean) * 100;
    }

    /**
     * 计算最小值
     * @param {Array} values 数值数组
     * @returns {number} 最小值
     */
    static min(values) {
        return Math.min(...values);
    }

    /**
     * 计算最大值
     * @param {Array} values 数值数组
     * @returns {number} 最大值
     */
    static max(values) {
        return Math.max(...values);
    }

    /**
     * 计算范围（最大值-最小值）
     * @param {Array} values 数值数组
     * @returns {number} 范围
     */
    static range(values) {
        return this.max(values) - this.min(values);
    }

    /**
     * 计算百分位数
     * @param {Array} values 数值数组
     * @param {number} percentile 百分位数 (0-100)
     * @returns {number} 百分位数
     */
    static percentile(values, percentile) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(percentile / 100 * sorted.length);
        return sorted[Math.min(index - 1, sorted.length - 1)];
    }

    /**
     * 计算四分位数
     * @param {Array} values 数值数组
     * @returns {Object} 四分位数 {Q1, Q2, Q3}
     */
    static quartiles(values) {
        if (values.length === 0) return { Q1: 0, Q2: 0, Q3: 0 };

        const sorted = [...values].sort((a, b) => a - b);
        const len = sorted.length;

        return {
            Q1: this.percentile(sorted, 25),
            Q2: this.percentile(sorted, 50),
            Q3: this.percentile(sorted, 75)
        };
    }

    /**
     * 计算偏度
     * @param {Array} values 数值数组
     * @returns {number} 偏度
     */
    static skewness(values) {
        const mean = this.mean(values);
        const std = this.standardDeviation(values);
        const n = values.length;

        const sum = values.reduce((acc, value) =>
            acc + Math.pow((value - mean) / std, 3), 0);

        return n * sum / ((n - 1) * (n - 2));
    }

    /**
     * 计算峰度
     * @param {Array} values 数值数组
     * @returns {number} 峰度
     */
    static kurtosis(values) {
        const mean = this.mean(values);
        const std = this.standardDeviation(values);
        const n = values.length;

        const sum = values.reduce((acc, value) =>
            acc + Math.pow((value - mean) / std, 4), 0);

        return (n * (n + 1) * sum / ((n - 1) * (n - 2) * (n - 3))) - (3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3)));
    }

    /**
     * 计算协方差
     * @param {Array} x 数组x
     * @param {Array} y 数组y
     * @returns {number} 协方差
     */
    static covariance(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;

        const meanX = this.mean(x);
        const meanY = this.mean(y);
        const n = x.length;

        return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / n;
    }

    /**
     * 计算相关系数（Pearson相关系数）
     * @param {Array} x 数组x
     * @param {Array} y 数组y
     * @returns {number} 相关系数
     */
    static correlation(x, y) {
        const cov = this.covariance(x, y);
        const stdX = this.standardDeviation(x);
        const stdY = this.standardDeviation(y);

        if (stdX === 0 || stdY === 0) return 0;

        return cov / (stdX * stdY);
    }

    /**
     * 线性回归
     * @param {Array} x 自变量数组
     * @param {Array} y 因变量数组
     * @returns {Object} 回归结果 {slope, intercept, r}
     */
    static linearRegression(x, y) {
        if (x.length !== y.length || x.length === 0) {
            return { slope: 0, intercept: 0, r: 0 };
        }

        const n = x.length;
        const sumX = this.sum(x);
        const sumY = this.sum(y);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = this.sum(x.map(xi => xi * xi));
        const sumYY = this.sum(y.map(yi => yi * yi));

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        const r = denominator !== 0 ? numerator / denominator : 0;

        return {
            slope,
            intercept,
            r,
            rSquared: r * r
        };
    }

    /**
     * 计算频率分布
     * @param {Array} values 数值数组
     * @param {number} numBins 分组数
     * @returns {Array} 频率分布
     */
    static frequencyDistribution(values, numBins = 10) {
        if (values.length === 0) return [];

        const min = this.min(values);
        const max = this.max(values);
        const binWidth = (max - min) / numBins;

        const bins = Array(numBins).fill(null).map(() => ({
            lower: 0, upper: 0, count: 0
        }));

        bins.forEach((bin, index) => {
            bin.lower = min + index * binWidth;
            bin.upper = min + (index + 1) * binWidth;
        });

        values.forEach(value => {
            const binIndex = Math.floor((value - min) / binWidth);
            if (binIndex >= 0 && binIndex < numBins) {
                bins[binIndex].count++;
            }
        });

        return bins;
    }

    /**
     * 计算累计分布
     * @param {Array} values 数值数组
     * @param {number} numBins 分组数
     * @returns {Array} 累计分布
     */
    static cumulativeDistribution(values, numBins = 10) {
        const frequency = this.frequencyDistribution(values, numBins);
        let cumulativeCount = 0;
        const totalCount = values.length;

        return frequency.map(bin => {
            cumulativeCount += bin.count;
            return {
                ...bin,
                cumulativeCount,
                cumulativeFrequency: cumulativeCount / totalCount
            };
        });
    }

    /**
     * 计算基尼系数（衡量不平等程度）
     * @param {Array} values 数值数组
     * @returns {number} 基尼系数 (0-1)
     */
    static giniCoefficient(values) {
        if (values.length === 0) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        const sum = this.sum(sorted);
        const cumulativeSum = [];
        let tempSum = 0;

        sorted.forEach(value => {
            tempSum += value;
            cumulativeSum.push(tempSum);
        });

        const areaUnderCurve = cumulativeSum.reduce((sum, value, index) => {
            return sum + value;
        }, 0) / sum;

        const perfectEquality = n / 2;

        return (areaUnderCurve / n - perfectEquality) / perfectEquality;
    }

    /**
     * 获取完整的描述性统计
     * @param {Array} values 数值数组
     * @returns {Object} 描述性统计结果
     */
    static describe(values) {
        return {
            count: values.length,
            mean: this.mean(values),
            median: this.median(values),
            mode: this.mode(values),
            variance: this.variance(values),
            standardDeviation: this.standardDeviation(values),
            coefficientOfVariation: this.coefficientOfVariation(values),
            min: this.min(values),
            max: this.max(values),
            range: this.range(values),
            quartiles: this.quartiles(values),
            skewness: this.skewness(values),
            kurtosis: this.kurtosis(values)
        };
    }

    /**
     * 格式化统计结果（用于显示）
     * @param {Object} stats 统计对象
     * @returns {Object} 格式化后的对象
     */
    static format(stats) {
        return {
            ...Object.keys(stats).reduce((result, key) => {
                const value = stats[key];

                if (typeof value === 'number') {
                    result[key] = value.toFixed(2);
                } else if (Array.isArray(value)) {
                    result[key] = value.map(v => typeof v === 'number' ? v.toFixed(2) : v);
                } else if (typeof value === 'object' && value !== null) {
                    result[key] = this.format(value);
                } else {
                    result[key] = value;
                }

                return result;
            }, {})
        };
    }

    /**
     * 计算百分比
     * @param {number} value 数值
     * @param {number} total 总计
     * @returns {number} 百分比
     */
    static percentage(value, total) {
        return total === 0 ? 0 : (value / total) * 100;
    }

    /**
     * 计算变化率
     * @param {number} current 当前值
     * @param {number} previous 之前值
     * @returns {number} 变化率
     */
    static changeRate(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }

    /**
     * 安全除法
     * @param {number} numerator 分子
     * @param {number} denominator 分母
     * @param {number} defaultValue 默认值
     * @returns {number} 结果
     */
    static safeDivide(numerator, denominator, defaultValue = 0) {
        return denominator === 0 ? defaultValue : numerator / denominator;
    }
}