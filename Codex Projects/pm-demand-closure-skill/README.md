# PM Demand Closure Skill (CN MVP)

该项目把产品经理常用的 5+1 能力封装为一个可部署到 Coze 的闭环技能：

1. 需求澄清（brainstorming）
2. PRD 生成（write-a-prd）
3. 实施计划（writing-plans）
4. A/B 实验设计（ab-test-setup）
5. 埋点追踪方案（analytics-tracking）
6. 可选阶段：onboarding-cro（仅在触发条件满足时启用）

## 适用场景

- 业务需求描述模糊，需要先澄清再方案化
- 产品改善想法需要完整产出链路（PRD + Plan + 验证）
- 需要向团队演示从想法到可测试/可追踪方案的闭环能力

## 项目结构

- `SKILL.md`: 统一技能定义与触发规则
- `coze/bot/system_prompt.md`: 智能体系统提示词
- `coze/workflow/pm_demand_closure_v1.workflow.json`: Coze 工作流骨架
- `coze/workflow/node_contracts.md`: 节点输入输出契约
- `data/cases/new_energy_finance_case.json`: 新能源金融需求 Demo 输入
- `docs/standards/uiux-checklist.md`: UI/UX 行业规范检查清单
- `scripts/run_demo.py`: 本地演示脚本，生成完整交付包
- `src/`: 路由、产物生成、渲染逻辑

## 快速开始

1. 运行测试：
   - `python -m pytest tests -v`
2. 运行 Demo：
   - `python scripts/run_demo.py`
3. 查看输出：
   - `docs/demo/output_bundle.json`
   - `docs/demo/output_bundle.md`

## Coze 落地建议（MVP）

1. 新建 Bot，填入 `coze/bot/system_prompt.md`
2. 导入 `coze/workflow/pm_demand_closure_v1.workflow.json`
3. 按 `coze/workflow/node_contracts.md` 配置节点字段映射
4. 使用 `data/cases/new_energy_finance_case.json` 做验收演示
5. 按 `docs/qa/uat-checklist.md` 完成上线前检查

