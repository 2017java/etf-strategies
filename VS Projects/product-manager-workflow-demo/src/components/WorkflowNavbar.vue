<template>
  <div class="workflow-navbar">
    <div class="navbar-header">
      <h3>工作流进度</h3>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <span class="progress-text">{{ progress }}%</span>
    </div>
    <nav class="navbar-items">
      <div
        v-for="(config, stage) in stageConfig"
        :key="stage"
        class="navbar-item"
        :class="{
          'active': currentStage === stage,
          'completed': completedStages.includes(stage),
          'clickable': canClickStage(stage)
        }"
        @click="handleStageClick(stage)"
      >
        <div class="item-icon" :style="{ background: config.color + '20', color: config.color }">
          {{ config.icon }}
        </div>
        <div class="item-content">
          <div class="item-title">{{ config.name }}</div>
          <div class="item-status">
            <span v-if="completedStages.includes(stage)">已完成</span>
            <span v-else-if="currentStage === stage">进行中</span>
            <span v-else>待处理</span>
          </div>
        </div>
        <div class="item-status-icon">
          <span v-if="completedStages.includes(stage)">✓</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWorkflowStore, WORKFLOW_STAGES, STAGE_CONFIG } from '../store/workflow'

const props = defineProps({
  showProgress: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['stage-change'])

const store = useWorkflowStore()

const currentStage = computed(() => store.currentStage)
const completedStages = computed(() => store.completedStages)
const progress = computed(() => store.progress)
const stageConfig = computed(() => {
  const stages = [
    WORKFLOW_STAGES.BRAINSTORMING,
    WORKFLOW_STAGES.WRITE_PRD,
    WORKFLOW_STAGES.WRITING_PLANS,
    WORKFLOW_STAGES.AB_TEST,
    WORKFLOW_STAGES.ANALYTICS,
    WORKFLOW_STAGES.ONBOARDING
  ]
  const config = {}
  stages.forEach(stage => {
    config[stage] = STAGE_CONFIG[stage]
  })
  return config
})

function canClickStage(stage) {
  const currentIndex = Object.keys(stageConfig.value).indexOf(currentStage.value)
  const stageIndex = Object.keys(stageConfig.value).indexOf(stage)
  return completedStages.value.includes(stage) || stageIndex <= currentIndex
}

function handleStageClick(stage) {
  if (canClickStage(stage)) {
    store.goToStage(stage)
    emit('stage-change', stage)
  }
}
</script>

<style scoped>
.workflow-navbar {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 80px;
}

.navbar-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.navbar-header h3 {
  font-size: var(--font-lg);
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width var(--transition-normal);
  border-radius: var(--radius-sm);
}

.progress-text {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.navbar-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.navbar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: default;
}

.navbar-item.clickable {
  cursor: pointer;
}

.navbar-item.clickable:hover {
  background: var(--background-color);
}

.navbar-item.active {
  background: var(--primary-light);
  border-left: 3px solid var(--primary-color);
}

.navbar-item.completed {
  opacity: 0.8;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.item-status {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.navbar-item.active .item-status {
  color: var(--primary-color);
  font-weight: 500;
}

.navbar-item.completed .item-status {
  color: var(--secondary-color);
}

.item-status-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--secondary-color);
  font-size: var(--font-sm);
}

@media (max-width: 1024px) {
  .workflow-navbar {
    position: static;
    margin-bottom: var(--spacing-lg);
  }

  .navbar-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-sm);
  }
}

@media (max-width: 768px) {
  .navbar-items {
    grid-template-columns: 1fr;
  }
}
</style>
