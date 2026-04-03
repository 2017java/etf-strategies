<template>
  <div class="home">
    <!-- 英雄区 -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">产品经理工作流助手</h1>
          <p class="hero-subtitle">从模糊想法到产品落地的完整工作流解决方案</p>
          <div class="hero-actions">
            <router-link to="/requirement" class="btn btn-primary">
              开始新需求
            </router-link>
            <button @click="loadExample" class="btn btn-secondary">
              查看示例需求
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="workflow-diagram">
            <div class="diagram-item">
              <div class="diagram-icon">💡</div>
              <div class="diagram-label">需求探索</div>
            </div>
            <div class="diagram-arrow">→</div>
            <div class="diagram-item">
              <div class="diagram-icon">📋</div>
              <div class="diagram-label">PRD 撰写</div>
            </div>
            <div class="diagram-arrow">→</div>
            <div class="diagram-item">
              <div class="diagram-icon">📝</div>
              <div class="diagram-label">计划拆分</div>
            </div>
            <div class="diagram-arrow">→</div>
            <div class="diagram-item">
              <div class="diagram-icon">🧪</div>
              <div class="diagram-label">实验验证</div>
            </div>
            <div class="diagram-arrow">→</div>
            <div class="diagram-item">
              <div class="diagram-icon">📊</div>
              <div class="diagram-label">数据埋点</div>
            </div>
            <div class="diagram-arrow">→</div>
            <div class="diagram-item">
              <div class="diagram-icon">🚀</div>
              <div class="diagram-label">用户激活</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能特性 -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>方案头脑风暴</h3>
            <p>将模糊的业务需求转化为清晰的产品方案，提供多种可选方案对比</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📋</div>
            <h3>专业 PRD 撰写</h3>
            <p>生成符合行业标准的 PRD 文档，包含用户故事、验收标准和架构设计</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3>实施计划拆分</h3>
            <p>将大需求拆解为可执行的任务清单，支持任务分配和进度跟踪</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🧪</div>
            <h3>A/B 实验设计</h3>
            <p>设计科学的实验方案，计算样本量和实验周期，确保结果可信</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>数据埋点设计</h3>
            <p>规划完整的用户行为追踪方案，配置事件规范和数据分析计划</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>新用户激活</h3>
            <p>优化用户激活流程，设计多渠道触达策略，提升用户留存率</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 使用场景 -->
    <section class="use-cases">
      <div class="container">
        <h2 class="section-title">适用场景</h2>
        <div class="use-cases-list">
          <div class="use-case">
            <h3>💼 新功能需求设计</h3>
            <p>从模糊想法出发，通过结构化流程逐步形成完整的产品方案</p>
          </div>
          <div class="use-case">
            <h3>🎯 产品优化项目</h3>
            <p>对现有产品进行分析和优化，设计验证实验和追踪方案</p>
          </div>
          <div class="use-case">
            <h3>📈 增长优化</h3>
            <p>通过 A/B 实验和数据驱动，提升产品指标和用户体验</p>
          </div>
          <div class="use-case">
            <h3>🔄 产品迭代</h3>
            <p>持续优化产品，设计迭代方案和验证计划</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 用户评价 -->
    <section class="testimonials">
      <div class="container">
        <h2 class="section-title">用户评价</h2>
        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>「这个工具帮我将产品需求从模糊到落地的过程标准化，大幅提升了工作效率。」</p>
            </div>
            <div class="testimonial-author">
              <div class="author-avatar">PM</div>
              <div class="author-info">
                <div class="author-name">产品经理李</div>
                <div class="author-company">互联网公司</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>「工作流设计非常贴合产品经理的思维方式，每个阶段的输出都很专业。」</p>
            </div>
            <div class="testimonial-author">
              <div class="author-avatar">PO</div>
              <div class="author-info">
                <div class="author-name">产品负责人王</div>
                <div class="author-company">科技公司</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>「PRD 撰写功能让我从繁琐的文档工作中解脱出来，专注于产品思考。」</p>
            </div>
            <div class="testimonial-author">
              <div class="author-avatar">PD</div>
              <div class="author-info">
                <div class="author-name">产品设计师张</div>
                <div class="author-company">创业公司</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useWorkflowStore } from '../store/workflow'
import { useRouter } from 'vue-router'

const store = useWorkflowStore()
const router = useRouter()

const loadExample = () => {
  store.loadExampleData()
  router.push('/requirement')
}
</script>

<style scoped>
.home {
  padding: var(--spacing-xl) 0;
}

/* 英雄区 */
.hero {
  background: linear-gradient(135deg, var(--primary-light) 0%, white 100%);
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-2xl);
}

.hero-content {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.hero-title {
  font-size: var(--font-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.hero-subtitle {
  font-size: var(--font-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.hero-visual {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-xl);
}

.workflow-diagram {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

.diagram-item {
  background: var(--card-background);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.diagram-icon {
  font-size: var(--font-xl);
}

.diagram-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.diagram-arrow {
  color: var(--text-tertiary);
  font-weight: 700;
}

/* 功能特性 */
.features {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  text-align: center;
  font-size: var(--font-2xl);
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.feature-card {
  background: var(--card-background);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: all var(--transition-normal);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.feature-icon {
  font-size: var(--font-3xl);
  margin-bottom: var(--spacing-md);
}

.feature-card h3 {
  font-size: var(--font-xl);
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin: 0;
}

/* 使用场景 */
.use-cases {
  background: var(--primary-light);
  padding: var(--spacing-2xl) 0;
  margin-bottom: var(--spacing-2xl);
}

.use-cases-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.use-case {
  background: var(--card-background);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.use-case h3 {
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-lg);
}

.use-case p {
  color: var(--text-secondary);
  margin: 0;
  font-size: var(--font-sm);
}

/* 用户评价 */
.testimonials {
  margin-bottom: var(--spacing-2xl);
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.testimonial-card {
  background: var(--card-background);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.testimonial-card:hover {
  box-shadow: var(--shadow-md);
}

.testimonial-content {
  margin-bottom: var(--spacing-lg);
}

.testimonial-content p {
  color: var(--text-primary);
  font-style: italic;
  margin: 0;
  line-height: 1.8;
}

.testimonial-author {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.author-info {
  flex: 1;
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
}

.author-company {
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: var(--font-2xl);
  }

  .hero-subtitle {
    font-size: var(--font-base);
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .workflow-diagram {
    flex-direction: column;
  }

  .features-grid,
  .use-cases-list,
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
}
</style>
