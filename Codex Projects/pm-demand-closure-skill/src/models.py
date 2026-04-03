from __future__ import annotations

from typing import Dict, List, TypedDict


class WorkflowInput(TypedDict):
    raw_request: str
    business_background: str
    current_state: str
    target_metrics: List[str]


class RequirementBrief(TypedDict):
    context: str
    goals: List[str]
    constraints: List[str]
    metrics: List[str]
    artifacts: List[str]


class DeliveryBundle(TypedDict):
    clarification_notes: str
    prd: str
    implementation_plan: str
    ab_test_card: str
    tracking_table: str
    ux_compliance: str
    demo_summary: str


class PipelineResult(TypedDict):
    requirement_brief: RequirementBrief
    delivery_bundle: DeliveryBundle
    route_flags: Dict[str, bool]

