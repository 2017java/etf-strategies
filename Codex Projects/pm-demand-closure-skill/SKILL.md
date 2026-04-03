---
name: pm-demand-closure
description: 面向软件产品经理的闭环技能。当用户有模糊业务需求或产品改进想法，需要做需求澄清、产出 PRD、实施计划、A/B 测试方案和埋点追踪方案时触发。关键词包括：模糊需求、需求讨论、写PRD、写计划、AB测试、实验设计、埋点、追踪验证、方案评审、需求闭环。
---

# PM Demand Closure Skill

## 目标

将模糊需求变成可执行、可验证、可追踪的完整交付包，覆盖：

1. 需求澄清纪要
2. PRD
3. 实施计划
4. A/B 测试卡
5. 埋点表
6. 演示汇总页（含 UI/UX 合规检查）

## 阶段流程（固定 5 核心 + 1 可选）

### 核心 5 阶段

1. `brainstorming`：澄清目标、范围、约束、成功指标
2. `write-a-prd`：形成完整 PRD
3. `writing-plans`：拆解落地计划
4. `ab-test-setup`：定义实验与评估方法
5. `analytics-tracking`：定义事件埋点与验证

### 可选阶段（条件触发）

6. `onboarding-cro`：仅当需求出现“激活/首登/转化漏斗/新手引导/首次价值”等关键词时启用

## 触发路由

输入中出现以下任意条件，即触发本技能：

- 表述模糊，包含“先讨论”“先梳理”“思路不清楚”
- 明确要求“写 PRD/写计划/AB 测试/埋点”
- 需要“方案评审材料”或“演示材料”

## 统一数据接口（JSON）

### 输入模型

```json
{
  "raw_request": "string",
  "business_background": "string",
  "current_state": "string",
  "target_metrics": ["string"]
}
```

### 中间模型

`requirement_brief`, `prd_draft`, `implementation_plan`, `experiment_spec`, `tracking_spec`

### 输出模型

```json
{
  "delivery_bundle": {
    "clarification_notes": "string",
    "prd": "string",
    "implementation_plan": "string",
    "ab_test_card": "string",
    "tracking_table": "string",
    "ux_compliance": "string",
    "demo_summary": "string"
  }
}
```

## 输出要求

- 默认中文输出
- 必须提供明确可执行项（不允许只有抽象建议）
- A/B 卡必须包含：假设、主指标、样本量估算、分流策略、停启规则
- 埋点表必须包含：事件名、属性、触发时机、校验方式
- 附带 UI/UX 合规检查清单（Nielsen + ISO 9241 + WCAG 2.2 AA）

