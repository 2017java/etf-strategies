/**
 * 仪表板视图 - DashboardView
 */
class DashboardView {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.isHidden = false;
    }

    render() {
        if (!this.container) {
            this.container = document.getElementById('dashboard-view');
        }

        if (!this.container) return;

        const bill = this.app.currentBill;

        if (!bill || !bill.hasTransactions()) {
            this.container.innerHTML = this.renderEmptyState();
            return;
        }

        const categoryBreakdown = bill.getCategoryPercentage();
        const recentTransactions = [...bill.transactions]
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);

        this.container.innerHTML = `
            <div class="dashboard-header">
                <h2>${bill.getFormattedName()}</h2>
                <span class="badge ${bill.getStatusClass()}">
                    ${bill.getStatusText()}
                </span>
            </div>

            <div class="stats-grid">
                <div class="stat-card expense">
                    <div class="stat-icon">💳</div>
                    <div class="stat-content">
                        <div class="stat-label">总支出</div>
                        <div class="stat-value">${bill.getFormattedAmount('expense')}</div>
                    </div>
                </div>

                <div class="stat-card refund">
                    <div class="stat-icon">↩️</div>
                    <div class="stat-content">
                        <div class="stat-label">退款</div>
                        <div class="stat-value">${bill.getFormattedAmount('refund')}</div>
                    </div>
                </div>

                <div class="stat-card net">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-label">净支出</div>
                        <div class="stat-value">${bill.getFormattedAmount('net')}</div>
                    </div>
                </div>

                <div class="stat-card average">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-label">平均单笔消费</div>
                        <div class="stat-value">${bill.getFormattedAmount('average')}</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="section category-section">
                    <h3>分类占比</h3>
                    <div class="category-chart">
                        <canvas id="pie-chart" width="200" height="200"></canvas>
                        <div class="category-legend">
                            ${this.renderCategoryLegend(categoryBreakdown)}
                        </div>
                    </div>
                </div>

                <div class="section transactions-section">
                    <h3>最近交易</h3>
                    <div class="recent-transactions">
                        ${this.renderRecentTransactions(recentTransactions)}
                    </div>
                </div>
            </div>

            <div class="dashboard-actions">
                <button class="btn-primary" id="mark-reconciled-btn">
                    ✅ 标记为已对账
                </button>
            </div>
        `;

        this.bindEvents();
        this.drawPieChart(categoryBreakdown);
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>还没有交易记录</h3>
                <p>导入信用卡账单邮件开始记账吧</p>
                <button class="btn-primary" id="go-to-import">
                    📝 导入账单
                </button>
            </div>
        `;
    }

    renderCategoryLegend(breakdown) {
        return breakdown.map(item => `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${item.category?.color || '#999'}"></span>
                <span class="legend-name">${item.category?.name || '未分类'}</span>
                <span class="legend-percentage">${item.percentage.toFixed(1)}%</span>
            </div>
        `).join('');
    }

    renderRecentTransactions(transactions) {
        if (transactions.length === 0) {
            return '<div class="no-transactions">暂无交易</div>';
        }

        return transactions.map(tx => `
            <div class="transaction-item ${tx.isRefund ? 'refund' : ''}">
                <div class="transaction-left">
                    <span class="transaction-icon">${tx.getCategoryIcon()}</span>
                    <div class="transaction-info">
                        <div class="transaction-desc">${Utils.truncate(tx.description, 20)}</div>
                        <div class="transaction-meta">
                            ${tx.getFormattedDate('MM-DD')} · ${tx.getCategoryName()}
                        </div>
                    </div>
                </div>
                <div class="transaction-amount">
                    ${tx.isRefund ? '+' : '-'}${Utils.formatAmount(Math.abs(tx.getNetAmount()))}
                </div>
            </div>
        `).join('');
    }

    drawPieChart(breakdown) {
        const canvas = document.getElementById('pie-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        let currentAngle = -Math.PI / 2;

        if (total === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#e0e0e0';
            ctx.fill();
            return;
        }

        breakdown.forEach(item => {
            const sliceAngle = (item.amount / total) * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.category?.color || '#999';
            ctx.fill();

            currentAngle += sliceAngle;
        });

        // 中心空心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    bindEvents() {
        const markReconciledBtn = document.getElementById('mark-reconciled-btn');
        if (markReconciledBtn) {
            markReconciledBtn.addEventListener('click', () => {
                this.app.markCurrentBillAsReconciled();
                this.render();
            });
        }

        const goToImportBtn = document.getElementById('go-to-import');
        if (goToImportBtn) {
            goToImportBtn.addEventListener('click', () => {
                this.app.switchView?.('import');
            });
        }
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