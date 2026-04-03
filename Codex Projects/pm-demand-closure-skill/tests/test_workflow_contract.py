import json
from pathlib import Path


def test_workflow_has_required_nodes():
    root = Path(__file__).resolve().parents[1]
    wf_path = root / "coze" / "workflow" / "pm_demand_closure_v1.workflow.json"
    wf = json.loads(wf_path.read_text(encoding="utf-8"))
    names = {n["name"] for n in wf["nodes"]}
    assert {
        "input_parse",
        "clarify_requirement",
        "generate_prd",
        "generate_plan",
        "design_ab_test",
        "design_tracking",
        "bundle_output",
    } <= names

