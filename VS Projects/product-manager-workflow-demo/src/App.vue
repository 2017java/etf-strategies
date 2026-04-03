<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="container flex items-center justify-between">
        <div class="app-logo flex items-center gap-md">
          <div class="logo-icon">🎯</div>
          <h1 class="logo-title">产品经理工作流助手</h1>
        </div>
        <nav class="app-nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/summary" class="nav-link">成果概览</router-link>
        </nav>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="container text-center">
        <p>© 2024 产品经理工作流助手 · Coze 平台演示</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--card-background);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-logo {
  cursor: pointer;
}

.logo-icon {
  font-size: var(--font-2xl);
}

.logo-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.app-nav {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-link {
  color: var(--text-secondary);
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary-color);
  background: var(--primary-light);
}

.app-main {
  flex: 1;
  padding: var(--spacing-xl) 0;
}

.app-footer {
  background: var(--card-background);
  padding: var(--spacing-lg) 0;
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-2xl);
}

.app-footer p {
  margin: 0;
  color: var(--text-tertiary);
  font-size: var(--font-sm);
}

@media (max-width: 768px) {
  .app-header {
    padding: var(--spacing-sm) 0;
  }

  .logo-title {
    font-size: var(--font-base);
  }

  .app-nav {
    display: none;
  }
}
</style>
