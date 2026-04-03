from __future__ import annotations

import json
from pathlib import Path

from .models import DeliveryBundle, PipelineResult, RequirementBrief, WorkflowInput
from .router import detect_missing_fields, detect_optional_stages


ARTIFACTS = ["需求澄清纪要", "PRD", "实施计划", "AB 测试卡", "埋点表", "演示汇总页"]


def build_requirement_brief(payload: WorkflowInput) -> RequirementBrief:
    return {
        "context": f"{payload['business_background']} 当前状态：{payload['current_state']}",
        "goals": [payload["raw_request"]],
        "constraints": ["MVP 优先", "默认中文输出", "需支持 Coze 工作流节点化部署"],
        "metrics": payload["target_metrics"],
        "artifacts": ARTIFACTS,
    }


def build_clarification_notes(payload: WorkflowInput, missing_fields: list[str]) -> str:
    lines = [
        "## 需求澄清纪要",
        "",
        f"- 原始需求：{payload['raw_request']}",
        f"- 业务背景：{payload['business_background']}",
        f"- 当前现状：{payload['current_state']}",
        f"- 目标指标：{'; '.join(payload['target_metrics'])}",
    ]
    if missing_fields:
        lines.append(f"- 待补充字段：{', '.join(missing_fields)}")
    else:
        lines.append("- 信息完整性：满足进入 PRD 生成条件")
    return "\n".join(lines)


def build_prd(payload: WorkflowInput) -> str:
    stories = "\n".join(
        [
            "1. 作为销售顾问，我希望快速展示金融方案，以便提升客户决策效率。",
            "2. 作为门店经理，我希望看到重点车型渗透率变化，以便评估活动效果。",
            "3. 作为产品经理，我希望沉淀标准化需求闭环模板，以便复用到后续业务。",
        ]
    )
    return "\n".join(
        [
            "# PRD",
            "",
            "## Problem Statement",
            payload["current_state"],
            "",
            "## Goals",
            "\n".join(f"- {m}" for m in payload["target_metrics"]),
            "",
            "## User Stories",
            stories,
            "",
            "## Solution",
            "构建统一金融方案展示与追踪闭环：需求澄清、策略展示、实验验证、数据追踪。",
            "",
            "## Scope",
            "- In Scope: 车型金融权益展示、渗透率目标跟踪、实验与埋点方案",
            "- Out of Scope: 核心金融审批系统改造、历史合同迁移",
            "",
            "## Acceptance Criteria",
            "- 可产出标准化 PRD/Plan/AB/埋点文档",
            "- 支持业务评审会直接使用",
        ]
    )


def build_implementation_plan() -> str:
    return "\n".join(
        [
            "# 实施计划",
            "",
            "## Milestones",
            "1. 需求澄清模板确认",
            "2. PRD 与计划产物模板固化",
            "3. AB + 埋点标准化输出",
            "4. Coze 工作流联调与 Demo 验收",
            "",
            "## Task Breakdown",
            "- 梳理输入字段并做缺失校验",
            "- 生成五类核心产物",
            "- 按 UI/UX 清单执行合规检查",
            "- 输出最终 delivery_bundle",
            "",
            "## Dependencies",
            "- 业务方确认目标指标",
            "- 数据团队确认埋点口径",
            "",
            "## Risks and Mitigations",
            "- 风险：需求描述过于抽象 -> 规避：强制澄清节点",
            "- 风险：指标口径不一致 -> 规避：在 PRD 中固化指标定义",
        ]
    )


def build_ab_test_card() -> str:
    return "\n".join(
        [
            "# AB 测试卡",
            "",
            "## Hypothesis",
            "因为当前 5免2 产品对重点车型吸引力不足，我们认为新增“首付3年0息”展示方案将显著提升重点车型渗透率。",
            "",
            "## Primary Metric",
            "重点车型金融方案渗透率",
            "",
            "## Sample Size Estimate",
            "基线渗透率 15%，目标提升至 30%，建议每组最少 800-1200 有效样本（MVP 估算）。",
            "",
            "## Traffic Split",
            "50/50（对照组：原方案；实验组：新增首付3年0息方案）",
            "",
            "## Start/Stop Rules",
            "- 达到最小样本量且连续 7 天指标稳定后判定",
            "- 若守护指标（投诉率/退订率）显著恶化，立即停测",
        ]
    )


def build_tracking_table() -> str:
    rows = [
        "| finance_plan_viewed | model_id, plan_type, page_id | 用户打开金融方案页 | GA4 DebugView + 日志采样 |",
        "| finance_calculator_used | model_id, term, down_payment_ratio | 用户使用金融计算器 | 前端事件回放 + 埋点对账 |",
        "| finance_plan_selected | model_id, plan_type, session_id | 用户选择某金融方案 | 转化漏斗核对 |",
        "| lead_submitted | model_id, channel, campaign_id | 用户提交线索表单 | CRM 与埋点数据对账 |",
    ]
    return "\n".join(
        [
            "# 埋点表",
            "",
            "| 事件名 | 属性 | 触发时机 | 校验方式 |",
            "|---|---|---|---|",
            *rows,
        ]
    )


def build_ux_compliance() -> str:
    checks = [
        "Nielsen: 状态可见、错误预防、错误恢复已覆盖",
        "ISO 9241: 任务适配与自描述性已满足",
        "WCAG 2.2 AA: 对比度、键盘可达、语义标签需在前端实现验收时逐项复核",
        "流程体验: 必填标识、空态和异常态说明需进入验收清单",
    ]
    return "## UI/UX 合规检查\n\n" + "\n".join(f"- {item}" for item in checks)


def build_demo_summary(payload: WorkflowInput) -> str:
    return "\n".join(
        [
            "## 演示汇总",
            "",
            f"- 输入场景：{payload['raw_request']}",
            "- 输出结果：已生成需求澄清、PRD、实施计划、AB 测试卡、埋点表、UX 合规检查",
            "- 价值：从模糊想法到可追踪方案，支撑业务评审与后续落地",
        ]
    )


def run_pipeline(payload: WorkflowInput) -> PipelineResult:
    missing_fields = detect_missing_fields(payload)
    route_flags = detect_optional_stages(payload)
    requirement_brief = build_requirement_brief(payload)

    bundle: DeliveryBundle = {
        "clarification_notes": build_clarification_notes(payload, missing_fields),
        "prd": build_prd(payload),
        "implementation_plan": build_implementation_plan(),
        "ab_test_card": build_ab_test_card(),
        "tracking_table": build_tracking_table(),
        "ux_compliance": build_ux_compliance(),
        "demo_summary": build_demo_summary(payload),
    }

    return {
        "requirement_brief": requirement_brief,
        "delivery_bundle": bundle,
        "route_flags": route_flags,
    }


def run_pipeline_from_file(case_file: Path) -> PipelineResult:
    payload = json.loads(case_file.read_text(encoding="utf-8"))
    return run_pipeline(payload)

