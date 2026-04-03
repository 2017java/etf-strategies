from __future__ import annotations

from .models import PipelineResult


def render_bundle_markdown(result: PipelineResult) -> str:
    bundle = result["delivery_bundle"]
    lines = [
        "# PM Demand Closure 输出汇总",
        "",
        "## 路由标记",
        f"- enable_onboarding_cro: {result['route_flags']['enable_onboarding_cro']}",
        "",
        bundle["clarification_notes"],
        "",
        bundle["prd"],
        "",
        bundle["implementation_plan"],
        "",
        bundle["ab_test_card"],
        "",
        bundle["tracking_table"],
        "",
        bundle["ux_compliance"],
        "",
        bundle["demo_summary"],
    ]
    return "\n".join(lines)

