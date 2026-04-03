import json
from pathlib import Path

from src.pipeline import run_pipeline


def _load_case():
    root = Path(__file__).resolve().parents[1]
    case_file = root / "data" / "cases" / "new_energy_finance_case.json"
    return json.loads(case_file.read_text(encoding="utf-8"))


def test_pipeline_generates_five_core_artifacts():
    result = run_pipeline(_load_case())
    bundle = result["delivery_bundle"]
    assert bundle["clarification_notes"]
    assert bundle["prd"]
    assert bundle["implementation_plan"]
    assert bundle["ab_test_card"]
    assert bundle["tracking_table"]


def test_ab_and_tracking_required_fields_present():
    result = run_pipeline(_load_case())
    ab = result["delivery_bundle"]["ab_test_card"]
    tracking = result["delivery_bundle"]["tracking_table"]

    assert "Hypothesis" in ab
    assert "Primary Metric" in ab
    assert "Sample Size Estimate" in ab
    assert "Start/Stop Rules" in ab

    assert "| 事件名 | 属性 | 触发时机 | 校验方式 |" in tracking


def test_onboarding_optional_stage_trigger():
    payload = _load_case()
    payload["raw_request"] += "\uFF0C\u540C\u65F6\u5173\u6CE8\u65B0\u7528\u6237\u9996\u767B\u6FC0\u6D3B\u6F0F\u6597\u3002"
    result = run_pipeline(payload)
    assert result["route_flags"]["enable_onboarding_cro"] is True


def test_onboarding_keywords_can_be_overridden(monkeypatch, tmp_path):
    custom = tmp_path / "keywords.txt"
    custom.write_text("custom-trigger\n", encoding="utf-8")
    monkeypatch.setenv("PM_DC_ONBOARDING_KEYWORDS_FILE", str(custom))

    payload = _load_case()
    payload["raw_request"] = "This includes custom-trigger behavior."
    result = run_pipeline(payload)
    assert result["route_flags"]["enable_onboarding_cro"] is True

    monkeypatch.delenv("PM_DC_ONBOARDING_KEYWORDS_FILE", raising=False)
