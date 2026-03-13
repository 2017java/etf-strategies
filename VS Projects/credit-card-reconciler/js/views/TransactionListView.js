/**
 * 交易列表视图 - TransactionListView
 */
class TransactionListView {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.isHidden = false;
        this.filterCategory = 'all';
        this.sortOrder = 'date-desc';
        this.searchQuery = '';
    }

    render() {
        if (!this.container) {
            this.container = document.getElementById('transactions-view');
        }

        if (!this.container) return;

        const bill = this.app.currentBill;
        const transactions = this.filterAndSortTransactions(bill?.transactions || []);

        this.container.innerHTML = `
            <div class="list-header">
                <div class="list-title">
                    <h2>${bill?.getFormattedName() || '交易列表'}</h2>
                    <span class="transaction-count">${transactions.length} 笔交易</span>
                </div>

                <div class="list-controls">
                    <div class="search-box">
                        <input type="text" id="search-input" placeholder="搜索交易..."
                            value="${this.searchQuery}">
                        <span class="search-icon">🔍</span>
                    </div>

                    <select id="category-filter">
                        <option value="all" ${this.filterCategory === 'all' ? 'selected' : ''}>全部分类</option>
                        ${this.app.categories.map(cat => `
                            <option value="${cat.id}" ${this.filterCategory === cat.id ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>
                        `).join('')}
                    </select>

                    <select id="sort-order">
                        <option value="date-desc" ${this.sortOrder === 'date-desc' ? 'selected' : ''}>日期（最新）</option>
                        <option value="date-asc" ${this.sortOrder === 'date-asc' ? 'selected' : ''}>日期（最早）</option>
                        <option value="amount-desc" ${this.sortOrder === 'amount-desc' ? 'selected' : ''}>金额（高→低）</option>
                        <option value="amount-asc" ${this.sortOrder === 'amount-asc' ? 'selected' : ''}>金额（低→高）</option>
                    </select>
                </div>
            </div>

            <div class="transaction-list">
                ${this.renderTransactions(transactions)}
            </div>

            ${transactions.length === 0 ? this.renderEmptyState() : ''}
        `;

        this.bindEvents();
    }

    filterAndSortTransactions(transactions) {
        let filtered = [...transactions];

        // 搜索过滤
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(tx =>
                tx.description.toLowerCase().includes(query) ||
                tx.getCategoryName().toLowerCase().includes(query)
            );
        }

        // 分类过滤
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(tx => {
                const finalCat = tx.getFinalCategory();
                return finalCat && finalCat.id === this.filterCategory;
            });
        }

        // 排序
        switch (this.sortOrder) {
            case 'date-desc':
                filtered.sort((a, b) => b.date - a.date);
                break;
            case 'date-asc':
                filtered.sort((a, b) => a.date - b.date);
                break;
            case 'amount-desc':
                filtered.sort((a, b) => b.getNetAmount() - a.getNetAmount());
                break;
            case 'amount-asc':
                filtered.sort((a, b) => a.getNetAmount() - b.getNetAmount());
                break;
        }

        return filtered;
    }

    renderTransactions(transactions) {
        if (transactions.length === 0) {
            return '';
        }

        return `
            <table class="transaction-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>描述</th>
                        <th>分类</th>
                        <th>类型</th>
                        <th class="amount-col">金额</th>
                        <th class="actions-col">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(tx => this.renderTransactionRow(tx)).join('')}
                </tbody>
            </table>
        `;
    }

    renderTransactionRow(tx) {
        const finalCategory = tx.getFinalCategory();
        const isRefund = tx.isRefund;

        return `
            <tr class="transaction-row ${isRefund ? 'refund-row' : ''}">
                <td class="date-cell">${tx.getFormattedDate('YYYY-MM-DD')}</td>
                <td class="desc-cell">${Utils.truncate(tx.description, 30)}</td>
                <td class="category-cell">
                    <select class="category-select" data-tx-id="${tx.id}">
                        ${this.app.categories.map(cat => `
                            <option value="${cat.id}"
                                ${finalCategory && finalCategory.id === cat.id ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td class="type-cell">
                    <span class="type-badge ${isRefund ? 'badge-refund' : 'badge-expense'}">
                        ${isRefund ? '退款' : '支出'}
                    </span>
                </td>
                <td class="amount-cell ${isRefund ? 'amount-refund' : 'amount-expense'}">
                    ${isRefund ? '+' : '-'}${Utils.formatAmount(Math.abs(tx.getNetAmount()))}
                </td>
                <td class="actions-cell">
                    <button class="btn-icon delete-btn" data-tx-id="${tx.id}" title="删除">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>暂无交易记录</h3>
                <p>还没有找到符合条件的交易</p>
            </div>
        `;
    }

    bindEvents() {
        // 搜索事件
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchQuery = e.target.value;
                this.render();
            }, 300));
        }

        // 分类过滤事件
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterCategory = e.target.value;
                this.render();
            });
        }

        // 排序事件
        const sortOrder = document.getElementById('sort-order');
        if (sortOrder) {
            sortOrder.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.render();
            });
        }

        // 分类选择事件
        const categorySelects = document.querySelectorAll('.category-select');
        categorySelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const txId = e.target.dataset.txId;
                const categoryId = e.target.value;
                this.app.updateTransactionCategory(txId, categoryId);
            });
        });

        // 删除事件
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('确定要删除这笔交易吗？')) {
                    const txId = e.target.dataset.txId;
                    this.app.removeTransaction(txId);
                    this.render();
                }
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