/**
 * 图表视图 - ChartView
 */
class ChartView {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.isHidden = false;
        this.timeRange = '6months';
    }

    render() {
        if (!this.container) {
            this.container = document.getElementById('analytics-view');
        }

        if (!this.container) return;

        const bill = this.app.currentBill;
        const startDate = this.getStartDate();
        const endDate = new Date();

        const monthlyTrend = this.app.getMonthlyTrend(startDate, endDate);
        const categoryTrend = bill ? this.app.getCategoryTrend(bill.year, bill.month) : [];
        const yoY = bill ? this.app.getYoYAnalysis(bill.year, bill.month) : null;
        const moM = bill ? this.app.getMoMAnalysis(bill.year, bill.month) : null;

        this.container.innerHTML = `
            <div class="analytics-header">
                <h2>数据分析</h2>
                <div class="time-range-selector">
                    <button class="range-btn ${this.timeRange === '3months' ? 'active' : ''}"
                        data-range="3months">3个月</button>
                    <button class="range-btn ${this.timeRange === '6months' ? 'active' : ''}"
                        data-range="6months">6个月</button>
                    <button class="range-btn ${this.timeRange === '12months' ? 'active' : ''}"
                        data-range="12months">12个月</button>
                </div>
            </div>

            <div class="analytics-grid">
                <div class="card trend-card">
                    <h3>月度趋势</h3>
                    <canvas id="trend-chart" class="chart-canvas" width="500" height="200"></canvas>
                </div>

                <div class="card comp-cards">
                    <div class="comp-card yoy">
                        <div class="comp-label">同比 (YoY)</div>
                        <div class="comp-value">
                            ${yoY ? (yoY.isIncrease ? '⬆️' : '⬇️') : '-'}
                            ${yoY ? yoY.change.toFixed(1) + '%' : '-'}
                        </div>
                        <div class="comp-detail">
                            ${yoY ? `去年同期: ${Utils.formatAmount(yoY.previous)}` : '无数据'}
                        </div>
                    </div>

                    <div class="comp-card mom">
                        <div class="comp-label">环比 (MoM)</div>
                        <div class="comp-value">
                            ${moM ? (moM.isIncrease ? '⬆️' : '⬇️') : '-'}
                            ${moM ? moM.change.toFixed(1) + '%' : '-'}
                        </div>
                        <div class="comp-detail">
                            ${moM ? `上月: ${Utils.formatAmount(moM.previous)}` : '无数据'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-section">
                <div class="card category-card">
                    <h3>分类分布</h3>
                    <div class="category-chart-container">
                        <canvas id="category-bar-chart" class="chart-canvas" width="500" height="250"></canvas>
                    </div>
                </div>

                <div class="card summary-card">
                    <h3>数据摘要</h3>
                    ${this.renderSummaryStats(monthlyTrend)}
                </div>
            </div>
        `;

        this.bindEvents();
        this.drawTrendChart(monthlyTrend);
        this.drawCategoryBarChart(categoryTrend);
    }

    getStartDate() {
        const now = new Date();
        let months = 6;

        switch (this.timeRange) {
            case '3months': months = 3; break;
            case '6months': months = 6; break;
            case '12months': months = 12; break;
        }

        return new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    }

    renderSummaryStats(trend) {
        const validMonths = trend.filter(t => t.expense > 0);
        if (validMonths.length === 0) {
            return '<div class="no-stats">暂无数据</div>';
        }

        const totalExpense = validMonths.reduce((sum, t) => sum + t.expense, 0);
        const avgExpense = totalExpense / validMonths.length;
        const maxMonth = validMonths.reduce((max, t) => t.expense > max.expense ? t : max, validMonths[0]);
        const minMonth = validMonths.reduce((min, t) => t.expense < min.expense ? t : min, validMonths[0]);

        return `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">总支出</div>
                    <div class="summary-value">${Utils.formatAmount(totalExpense)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">月均支出</div>
                    <div class="summary-value">${Utils.formatAmount(avgExpense)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">最高消费月</div>
                    <div class="summary-value">${maxMonth.monthName}</div>
                    <div class="summary-sub">${Utils.formatAmount(maxMonth.expense)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">最低消费月</div>
                    <div class="summary-value">${minMonth.monthName}</div>
                    <div class="summary-sub">${Utils.formatAmount(minMonth.expense)}</div>
                </div>
            </div>
        `;
    }

    drawTrendChart(trend) {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const padding = 40;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (trend.length === 0) {
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }

        const maxValue = Math.max(...trend.map(t => Math.max(t.expense, 1)));
        const stepX = width / Math.max(trend.length - 1, 1);

        // 绘制坐标轴
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // 绘制网格线
        const gridLines = 4;
        ctx.strokeStyle = '#f0f0f0';
        ctx.setLineDash([5, 5]);
        for (let i = 1; i <= gridLines; i++) {
            const y = padding + (height / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();

            // Y轴标签
            ctx.fillStyle = '#999';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(
                Utils.formatAmount(maxValue * (1 - i / gridLines)),
                padding - 5,
                y
            );
        }
        ctx.setLineDash([]);

        // 绘制折线
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        trend.forEach((item, index) => {
            const x = padding + index * stepX;
            const y = canvas.height - padding - (item.expense / maxValue) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // 绘制数据点
        trend.forEach((item, index) => {
            const x = padding + index * stepX;
            const y = canvas.height - padding - (item.expense / maxValue) * height;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
        });

        // 绘制X轴标签
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        trend.forEach((item, index) => {
            const x = padding + index * stepX;
            ctx.fillText(item.monthName.slice(0, 2), x, canvas.height - padding + 15);
        });
    }

    drawCategoryBarChart(categoryData) {
        const canvas = document.getElementById('category-bar-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const padding = 60;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (categoryData.length === 0) {
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }

        const maxValue = Math.max(...categoryData.map(c => c.amount));
        const barWidth = Math.min(40, width / categoryData.length - 10);
        const gap = (width - barWidth * categoryData.length) / categoryData.length;

        categoryData.forEach((item, index) => {
            const x = padding + index * (barWidth + gap) + gap / 2;
            const barHeight = (item.amount / maxValue) * height;
            const y = canvas.height - padding - barHeight;

            // 绘制柱状
            ctx.fillStyle = item.category?.color || '#999';
            ctx.fillRect(x, y, barWidth, barHeight);

            // 绘制标签
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                item.category?.name?.slice(0, 2) || '未分',
                x + barWidth / 2,
                canvas.height - padding + 15
            );
        });
    }

    bindEvents() {
        const rangeBtns = document.querySelectorAll('.range-btn');
        rangeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.timeRange = e.target.dataset.range;
                this.render();
            });
        });
    }

    show() {
        this.isHidden = false;
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }

    hide() {
        this.isHidden = true;
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }
}