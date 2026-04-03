# Coze 发布说明（含截图位）

本文用于把 `pm-demand-closure-skill` 发布为 Coze 可演示版本，并保留截图素材用于内部培训或复盘。

## 1. 发布前准备

- 项目路径：`D:\AICoding\Codex Projects\pm-demand-closure-skill`
- 关键文件：
  - Bot 提示词：`coze/bot/system_prompt.md`
  - Workflow：`coze/workflow/pm_demand_closure_v1.workflow.json`
  - 节点契约：`coze/workflow/node_contracts.md`
  - 演示输入：`data/cases/new_energy_finance_case.json`

截图位：
- [截图1：项目目录与关键文件]

## 2. 创建 Coze Bot

1. 登录 Coze 控制台并新建 Bot
2. Bot 名称建议：`PM需求闭环助手（MVP）`
3. 把 `coze/bot/system_prompt.md` 内容粘贴到系统提示词
4. 保存并进入调试页

截图位：
- [截图2：Bot 基础信息页面]
- [截图3：系统提示词粘贴完成页面]

## 3. 导入工作流

1. 进入 Workflow/工作流编辑页
2. 选择导入 JSON
3. 导入 `coze/workflow/pm_demand_closure_v1.workflow.json`
4. 按 `coze/workflow/node_contracts.md` 检查每个节点入参/出参映射

截图位：
- [截图4：工作流导入入口]
- [截图5：7节点拓扑图]
- [截图6：节点字段映射检查]

## 4. 节点配置建议

建议把 7 个节点按下列职责配置：

1. `input_parse`：输入字段标准化与缺失校验
2. `clarify_requirement`：结构化澄清纪要与需求摘要
3. `generate_prd`：生成 PRD
4. `generate_plan`：生成实施计划
5. `design_ab_test`：生成 AB 测试卡
6. `design_tracking`：生成埋点表 + UX 合规检查
7. `bundle_output`：汇总 `delivery_bundle`

截图位：
- [截图7：clarify_requirement 节点提示词]
- [截图8：bundle_output 输出结构]

## 5. Demo 演示流程

1. 用 `data/cases/new_energy_finance_case.json` 的字段作为测试输入
2. 触发工作流执行
3. 检查输出是否包含 7 个字段：
   - `clarification_notes`
   - `prd`
   - `implementation_plan`
   - `ab_test_card`
   - `tracking_table`
   - `ux_compliance`
   - `demo_summary`
4. 输出复制到评审文档或演示页

截图位：
- [截图9：输入案例]
- [截图10：执行成功日志]
- [截图11：delivery_bundle 输出]

## 6. 上线前检查

按 `docs/qa/uat-checklist.md` 执行验收，至少确认：

- 能从模糊需求稳定产出五类核心文档
- AB 卡包含假设/主指标/样本量/停启规则
- 埋点表包含事件名/属性/触发时机/校验方式
- 含 UI/UX 合规检查结果

截图位：
- [截图12：UAT 勾选结果]

## 7. 可选增强（下一版）

- 增加多业务模板（SaaS、电商、汽车金融）
- 增加版本化存档（按需求编号沉淀输出）
- 对接数据源，自动读取历史基线指标

