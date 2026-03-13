/**
 * 趋势分析器 - TrendAnalyzer
 * 负责消费数据的趋势分析和统计
 */
class TrendAnalyzer {
    constructor(monthlyBills = []) {
        this.monthlyBills = monthlyBills;
    }

    /**
     * 获取月度趋势数据
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {Array} 趋势数据数组
     */
    getMonthlyTrend(startDate, endDate) {
        const trend = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            const bill = this.monthlyBills.find(b =>
                b.year === current.getFullYear() &&
                b.month === current.getMonth()
            );

            trend.push({
                year: current.getFullYear(),
                month: current.getMonth(),
                monthName: this.getMonthName(current.getMonth()),
                expense: bill ? bill.getTotalExpense() : 0,
                refund: bill ? bill.getTotalRefund() : 0,
                net: bill ? bill.getNetTotal() : 0,
                transactionCount: bill ? bill.transactions.length : 0
            });

            current.setMonth(current.getMonth() + 1);
        }

        return trend;
    }

    /**
     * 获取同比分析（Year-over-Year）
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Object} 同比分析数据
     */
    getYoYAnalysis(year, month) {
        const current = this.monthlyBills.find(b =>
            b.year === year && b.month === month
        );
        const previous = this.monthlyBills.find(b =>
            b.year === year - 1 && b.month === month
        );

        if (!current) return null;

        return {
            current: current ? current.getNetTotal() : 0,
            previous: previous ? previous.getNetTotal() : 0,
            change: current && previous ?
                ((current.getNetTotal() - previous.getNetTotal()) / previous.getNetTotal() * 100) : 0,
            isIncrease: !previous || current.getNetTotal() > previous.getNetTotal()
        };
    }

    /**
     * 获取环比分析（Month-over-Month）
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Object} 环比分析数据
     */
    getMoMAnalysis(year, month) {
        const current = this.monthlyBills.find(b =>
            b.year === year && b.month === month
        );

        // 计算上月
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }

        const previous = this.monthlyBills.find(b =>
            b.year === prevYear && b.month === prevMonth
        );

        if (!current) return null;

        return {
            current: current ? current.getNetTotal() : 0,
            previous: previous ? previous.getNetTotal() : 0,
            change: current && previous ?
                ((current.getNetTotal() - previous.getNetTotal()) / previous.getNetTotal() * 100) : 0,
            isIncrease: !previous || current.getNetTotal() > previous.getNetTotal()
        };
    }

    /**
     * 获取分类趋势数据
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Array} 分类趋势数据
     */
    getCategoryTrend(year, month) {
        const bill = this.monthlyBills.find(b =>
            b.year === year && b.month === month
        );

        if (!bill) return [];

        const breakdown = bill.getCategoryBreakdown();
        const total = bill.getNetTotal();

        return Object.values(breakdown).map(item => ({
            category: item.category,
            amount: item.amount,
            count: item.count,
            percentage: total > 0 ? (item.amount / total * 100) : 0
        })).sort((a, b) => b.amount - a.amount);
    }

    /**
     * 获取平均消费分析
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {Object} 平均消费数据
     */
    getAverageAnalysis(startDate, endDate) {
        const trend = this.getMonthlyTrend(startDate, endDate);
        const validMonths = trend.filter(t => t.expense > 0);

        if (validMonths.length === 0) {
            return { averageExpense: 0, averageRefund: 0, monthCount: 0 };
        }

        const totalExpense = validMonths.reduce((sum, t) => sum + t.expense, 0);
        const totalRefund = validMonths.reduce((sum, t) => sum + t.refund, 0);

        return {
            averageExpense: totalExpense / validMonths.length,
            averageRefund: totalRefund / validMonths.length,
            monthCount: validMonths.length,
            totalExpense,
            totalRefund
        };
    }

    /**
     * 获取消费最高的月份
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {Object|null} 最高消费月份
     */
    getHighestSpendingMonth(startDate, endDate) {
        const trend = this.getMonthlyTrend(startDate, endDate);
        return trend.reduce((max, current) =>
            (!max || current.expense > max.expense) ? current : max, null);
    }

    /**
     * 获取消费最低的月份
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {Object|null} 最低消费月份
     */
    getLowestSpendingMonth(startDate, endDate) {
        const trend = this.getMonthlyTrend(startDate, endDate);
        const validMonths = trend.filter(t => t.expense > 0);
        return validMonths.reduce((min, current) =>
            (!min || current.expense < min.expense) ? current : min, null);
    }

    /**
     * 获取每周分析数据
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Array} 每周数据
     */
    getWeeklyAnalysis(year, month) {
        const bill = this.monthlyBills.find(b =>
            b.year === year && b.month === month
        );

        if (!bill) return [];

        const weeks = Array(5).fill(null).map(() => ({
            weekNumber: 0,
            startDate: null,
            endDate: null,
            expense: 0,
            refund: 0,
            transactionCount: 0
        }));

        bill.transactions.forEach(tx => {
            const date = new Date(tx.date);
            const weekNumber = this.getWeekNumber(date);
            if (weekNumber >= 0 && weekNumber < 5) {
                weeks[weekNumber].expense += tx.isRefund ? 0 : tx.getNetAmount();
                weeks[weekNumber].refund += tx.isRefund ? Math.abs(tx.getNetAmount()) : 0;
                weeks[weekNumber].transactionCount++;
            }
        });

        return weeks;
    }

    /**
     * 获取每日分析数据
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Array} 每日数据
     */
    getDailyAnalysis(year, month) {
        const bill = this.monthlyBills.find(b =>
            b.year === year && b.month === month
        );

        if (!bill) return [];

        const days = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: new Date(year, month, day),
                expense: 0,
                refund: 0,
                transactionCount: 0
            });
        }

        bill.transactions.forEach(tx => {
            const day = tx.date.getDate() - 1;
            if (day >= 0 && day < days.length) {
                days[day].expense += tx.isRefund ? 0 : tx.getNetAmount();
                days[day].refund += tx.isRefund ? Math.abs(tx.getNetAmount()) : 0;
                days[day].transactionCount++;
            }
        });

        return days.filter(day => day.transactionCount > 0);
    }

    /**
     * 获取消费高峰时间分析
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Object} 高峰时间分析
     */
    getPeakTimeAnalysis(year, month) {
        const bill = this.monthlyBills.find(b =>
            b.year === year && b.month === month
        );

        if (!bill) return {};

        const hourlyStats = Array(24).fill(0).map(() => ({ count: 0, amount: 0 }));

        bill.transactions.forEach(tx => {
            const hour = tx.date.getHours();
            hourlyStats[hour].count++;
            hourlyStats[hour].amount += tx.isRefund ? 0 : tx.getNetAmount();
        });

        const peakHour = hourlyStats.reduce((max, stat, index) => {
            if (stat.count > max.count || (stat.count === max.count && stat.amount > max.amount)) {
                return { hour: index, ...stat };
            }
            return max;
        }, { hour: 0, count: 0, amount: 0 });

        const busyHours = hourlyStats
            .map((stat, index) => ({ hour: index, ...stat }))
            .filter(stat => stat.count > 0)
            .sort((a, b) => b.count - a.count);

        return {
            hourlyStats,
            peakHour,
            busyHours
        };
    }

    /**
     * 获取消费稳定性分析
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @returns {Object} 稳定性分析
     */
    getStabilityAnalysis(startDate, endDate) {
        const trend = this.getMonthlyTrend(startDate, endDate).filter(t => t.transactionCount > 0);

        if (trend.length < 3) {
            return {
                variance: 0,
                standardDeviation: 0,
                coefficientOfVariation: 0
            };
        }

        const values = trend.map(t => t.net);
        const average = values.reduce((sum, v) => sum + v, 0) / values.length;
        const sumOfSquares = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0);
        const variance = sumOfSquares / values.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = average !== 0 ? (standardDeviation / average) * 100 : 0;

        return {
            average,
            variance,
            standardDeviation,
            coefficientOfVariation
        };
    }

    /**
     * 获取预测分析（基于历史数据）
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @param {number} monthsToPredict 预测月份数
     * @returns {Array} 预测数据
     */
    getPrediction(startDate, endDate, monthsToPredict = 3) {
        const trend = this.getMonthlyTrend(startDate, endDate).filter(t => t.transactionCount > 0);
        const predictions = [];

        if (trend.length < 3) {
            return predictions;
        }

        // 简单线性回归预测
        const x = trend.map((_, index) => index);
        const y = trend.map(t => t.net);
        const n = trend.length;

        const sumX = x.reduce((sum, v) => sum + v, 0);
        const sumY = y.reduce((sum, v) => sum + v, 0);
        const sumXY = trend.reduce((sum, t, index) => sum + index * t.net, 0);
        const sumXX = x.reduce((sum, v) => sum + v * v, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 生成预测
        for (let i = 0; i < monthsToPredict; i++) {
            const nextMonthIndex = trend.length + i;
            const predictedNet = slope * nextMonthIndex + intercept;
            const lastMonth = trend[trend.length - 1];
            const predictedDate = new Date(lastMonth.year, lastMonth.month + i + 1);

            predictions.push({
                year: predictedDate.getFullYear(),
                month: predictedDate.getMonth(),
                monthName: this.getMonthName(predictedDate.getMonth()),
                net: Math.max(0, predictedNet),
                prediction: true
            });
        }

        return predictions;
    }

    /**
     * 获取周数（根据日期获取当月第几周）
     * @param {Date} date Date对象
     * @returns {number} 周数 (0-4)
     */
    getWeekNumber(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfWeek = firstDay.getDay(); // 0 = Sunday
        const dayOfMonth = date.getDate();
        return Math.floor((dayOfMonth + dayOfWeek - 1) / 7);
    }

    /**
     * 获取月份名称
     * @param {number} month 月份 (0-11)
     * @param {string} lang 语言 'zh' 或 'en'
     * @returns {string} 月份名称
     */
    getMonthName(month, lang = 'zh') {
        const names = {
            zh: ['一月', '二月', '三月', '四月', '五月', '六月',
                '七月', '八月', '九月', '十月', '十一月', '十二月'],
            en: ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
        };
        return names[lang][month];
    }

    /**
     * 获取数据分析报告
     * @param {number} year 年份
     * @param {number} month 月份 (0-11)
     * @returns {Object} 分析报告
     */
    generateReport(year, month) {
        const bill = this.monthlyBills.find(b => b.year === year && b.month === month);

        if (!bill) {
            return null;
        }

        const currentTrend = this.getMonthlyTrend(
            new Date(year - 1, month, 1),
            new Date(year, month + 1, 0)
        );

        return {
            month: {
                year,
                month,
                name: this.getMonthName(month),
                bill
            },
            summary: {
                totalExpense: bill.getTotalExpense(),
                totalRefund: bill.getTotalRefund(),
                netExpense: bill.getNetTotal(),
                transactionCount: bill.transactions.length,
                averagePerTransaction: bill.getAverageTransactionAmount()
            },
            trend: {
                monthly: currentTrend,
                yoY: this.getYoYAnalysis(year, month),
                moM: this.getMoMAnalysis(year, month),
                categoryBreakdown: bill.getCategoryPercentage(),
                weeklyBreakdown: this.getWeeklyAnalysis(year, month),
                dailyBreakdown: this.getDailyAnalysis(year, month),
                peakTimeAnalysis: this.getPeakTimeAnalysis(year, month)
            },
            recommendations: this.getRecommendations(year, month)
        };
    }

    /**
     * 生成消费建议
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Array} 建议列表
     */
    getRecommendations(year, month) {
        const bill = this.monthlyBills.find(b => b.year === year && b.month === month);
        if (!bill) return [];

        const recommendations = [];
        const avgExpense = this.getAverageAnalysis(
            new Date(year - 1, 0, 1),
            new Date(year, 11, 31)
        ).averageExpense;

        // 高消费月份提醒
        if (bill.getTotalExpense() > avgExpense * 1.5) {
            recommendations.push({
                level: 'warning',
                message: '本月消费明显高于平均水平',
                suggestion: '建议检查大额消费项目，寻找节省空间'
            });
        }

        // 退款率异常提醒
        const refundRatio = bill.getTotalRefund() / bill.getTotalExpense();
        if (refundRatio > 0.2) {
            recommendations.push({
                level: 'info',
                message: '本月退款比例较高',
                suggestion: '确认退款是否处理完毕'
            });
        }

        // 交易频率异常
        const avgTransactionCount = this.getMonthlyTrend(
            new Date(year - 1, 0, 1),
            new Date(year, 11, 31)
        ).map(t => t.transactionCount).filter(c => c > 0).reduce((a, b) => a + b, 0) / 12;

        if (bill.transactions.length > avgTransactionCount * 2) {
            recommendations.push({
                level: 'info',
                message: '本月交易频率较高',
                suggestion: '检查是否有重复消费'
            });
        }

        return recommendations;
    }
}