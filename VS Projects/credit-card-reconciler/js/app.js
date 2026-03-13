/**
 * 信用卡对账应用 - 入口文件
 */

document.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器支持
    if (!window.localStorage) {
        alert('您的浏览器不支持本地存储功能，请使用现代浏览器');
        return;
    }

    // 初始化应用控制器
    const app = new AppController();

    // 初始化视图
    app.views.dashboard = new DashboardView(app);
    app.views.transactionList = new TransactionListView(app);
    app.views.chart = new ChartView(app);

    // 绑定事件
    bindEvents(app);

    // 初始化页面
    initializePage(app);

    // 暴露全局引用（用于调试）
    window.creditCardApp = app;

    console.log('信用卡对账系统启动成功');
});

/**
 * 绑定事件
 * @param {AppController} app 应用控制器实例
 */
function bindEvents(app) {
    // 导航菜单事件
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(app, view);
        });
    });

    // 月份选择器事件
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
        monthSelector.addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            app.currentBill = app.getOrCreateBill(year, month);
            renderCurrentView(app);
            updateStorageStats(app);
        });
    }

    // 侧边栏开关（移动端）
    const sidebarToggle = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('hidden');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // 导出按钮
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            app.exportData();
        });
    }

    // 导入按钮
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file');

    if (importBtn) {
        importBtn.addEventListener('click', () => {
            importFileInput.click();
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                app.importData(e.target.files[0]).then(() => {
                    e.target.value = '';
                    renderCurrentView(app);
                    initializeMonthsDropdown(app);
                });
            }
        });
    }

    // 导入页面事件
    bindImportEvents(app);
}

/**
 * 绑定导入页面事件
 * @param {AppController} app 应用控制器实例
 */
function bindImportEvents(app) {
    // 粘贴区域事件
    const pasteArea = document.getElementById('paste-area');
    if (pasteArea) {
        pasteArea.addEventListener('paste', (e) => {
            const text = e.clipboardData.getData('text');
            if (text && text.length > 0) {
                document.getElementById('email-input').value = '';
                parseAndPreview(app, text);
            }
        });
    }

    // 解析按钮事件
    const processPasteBtn = document.getElementById('process-paste-btn');
    if (processPasteBtn) {
        processPasteBtn.addEventListener('click', () => {
            const text = pasteArea.value.trim();
            if (text) {
                parseAndPreview(app, text);
            }
        });
    }

    // 文件上传事件
    const emailInput = document.getElementById('email-input');
    if (emailInput) {
        emailInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target.result;
                    parseAndPreview(app, text);
                };
                reader.readAsText(file);
            }
        });
    }

    // 预览确认事件
    const confirmImportBtn = document.getElementById('confirm-import-btn');
    if (confirmImportBtn) {
        confirmImportBtn.addEventListener('click', () => {
            confirmImport(app);
        });
    }

    // 预览取消事件
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', () => {
            cancelImport(app);
        });
    }

    // 进入导入页面事件（导航时）
    document.getElementById('import-view').addEventListener('DOMNodeInserted', (e) => {
        if (!document.getElementById('import-view').classList.contains('hidden')) {
            app.previewTransactions = [];
        }
    });
}

/**
 * 切换视图
 * @param {AppController} app 应用控制器实例
 * @param {string} view 视图名称
 */
function switchView(app, view) {
    // 更新导航菜单状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // 隐藏所有视图
    document.querySelectorAll('.view').forEach(el => {
        el.classList.add('hidden');
    });

    // 显示目标视图
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // 渲染视图
    switch (view) {
        case 'dashboard':
            app.views.dashboard.render();
            break;
        case 'transactions':
            app.views.transactionList.render();
            break;
        case 'analytics':
            app.views.chart.render();
            break;
        case 'import':
            // 导入页面不需要额外渲染
            break;
    }

    // 关闭移动端侧边栏
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('open');
    sidebarOverlay.classList.add('hidden');
}

/**
 * 渲染当前视图
 * @param {AppController} app 应用控制器实例
 */
function renderCurrentView(app) {
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
        const view = activeNav.dataset.view;
        switch (view) {
            case 'dashboard':
                app.views.dashboard.render();
                break;
            case 'transactions':
                app.views.transactionList.render();
                break;
            case 'analytics':
                app.views.chart.render();
                break;
        }
    }
}

/**
 * 初始化页面
 * @param {AppController} app 应用控制器实例
 */
function initializePage(app) {
    // 初始化月份选择器
    initializeMonthsDropdown(app);

    // 渲染默认视图
    switchView(app, 'dashboard');

    // 更新存储统计
    updateStorageStats(app);
}

/**
 * 初始化月份选择器
 * @param {AppController} app 应用控制器实例
 */
function initializeMonthsDropdown(app) {
    const monthSelector = document.getElementById('month-selector');
    if (!monthSelector) return;

    monthSelector.innerHTML = '';

    const availableMonths = app.getAvailableMonths();

    // 生成月份选项
    availableMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = `${month.year}-${month.month}`;
        option.textContent = `${month.year}年${Utils.getMonthName(month.month)}`;
        monthSelector.appendChild(option);
    });

    // 默认选中当前账单的月份
    const currentBillOption = `${app.currentBill.year}-${app.currentBill.month}`;
    if (monthSelector.querySelector(`option[value="${currentBillOption}"]`)) {
        monthSelector.value = currentBillOption;
    }
}

/**
 * 解析并预览账单
 * @param {AppController} app 应用控制器实例
 * @param {string} text 账单文本
 */
function parseAndPreview(app, text) {
    try {
        const transactions = app.emailParser.parse(text);
        app.previewTransactions = transactions;

        const previewContent = document.getElementById('preview-content');
        if (previewContent) {
            previewContent.innerHTML = renderTransactionPreview(transactions);
        }

        document.getElementById('preview-area').classList.remove('hidden');
        document.getElementById('confirm-import-btn').textContent =
            `✅ 确认导入 (${transactions.length}笔)`;
    } catch (error) {
        app.showNotification('解析失败: ' + error.message, 'error');
        console.error(error);
    }
}

/**
 * 渲染交易预览
 * @param {Array} transactions 交易数组
 * @returns {string} HTML字符串
 */
function renderTransactionPreview(transactions) {
    if (transactions.length === 0) {
        return '<p class="no-transactions">未识别到有效的交易记录</p>';
    }

    let html = '<table class="preview-table">';
    html += '<thead><tr><th>日期</th><th>描述</th><th>分类</th><th>金额</th></tr></thead>';
    html += '<tbody>';

    transactions.forEach(tx => {
        const finalCategory = tx.getFinalCategory();
        html += `
            <tr>
                <td>${tx.getFormattedDate('YYYY-MM-DD')}</td>
                <td>${Utils.truncate(tx.description, 25)}</td>
                <td>${finalCategory ? finalCategory.name : '未分类'}</td>
                <td class="${tx.isRefund ? 'refund' : 'expense'}">
                    ${tx.isRefund ? '+' : '-'}${Utils.formatAmount(Math.abs(tx.amount))}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    return html;
}

/**
 * 确认导入
 * @param {AppController} app 应用控制器实例
 */
function confirmImport(app) {
    if (!app.previewTransactions || app.previewTransactions.length === 0) {
        app.showNotification('没有可导入的交易记录', 'warning');
        return;
    }

    try {
        const addedCount = app.addTransactionsToCurrentBill(app.previewTransactions);
        app.saveAllData();
        app.showNotification(`成功导入 ${addedCount} 笔交易`, 'success');

        cancelImport(app);
        switchView(app, 'dashboard');
        renderCurrentView(app);
        updateStorageStats(app);
    } catch (error) {
        app.showNotification('导入失败: ' + error.message, 'error');
        console.error(error);
    }
}

/**
 * 取消导入
 * @param {AppController} app 应用控制器实例
 */
function cancelImport(app) {
    document.getElementById('paste-area').value = '';
    document.getElementById('email-input').value = '';
    document.getElementById('preview-area').classList.add('hidden');
    app.previewTransactions = [];
}

/**
 * 更新存储统计
 * @param {AppController} app 应用控制器实例
 */
function updateStorageStats(app) {
    const storageFill = document.getElementById('storage-fill');
    if (storageFill) {
        const usage = app.storage.getStorageUsagePercent();
        storageFill.style.width = `${usage}%`;
    }
}

/**
 * 添加到导入页面的样式
 */
function addImportStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .preview-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .preview-table th,
        .preview-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .preview-table th {
            background: var(--bg-tertiary);
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        .preview-table td {
            font-size: 0.9rem;
        }

        .no-transactions {
            text-align: center;
            color: var(--text-muted);
            padding: 40px;
            font-style: italic;
        }

        .preview-table .expense {
            color: var(--danger-color);
            font-weight: 600;
        }

        .preview-table .refund {
            color: var(--success-color);
            font-weight: 600;
        }

        #import-view.hidden {
            display: none;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 工具函数
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * 页面加载完成后的清理
 */
window.addEventListener('load', () => {
    // 添加导入页面的样式
    addImportStyles();
});

/**
 * 页面可见性变化事件（优化资源使用）
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        console.log('页面不可见，可暂停一些动画或请求');
    }
});