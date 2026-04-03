# Food Ingredient Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Coze-ready food ingredient interpretation workflow (image OCR + text input) that returns red/yellow/green risk cards with explainable details for mainland China users.

**Architecture:** Create a new workflow project under `Coze/WorkFlow/Food-Ingredient-Analyzer` following the existing `Data-Analyst-V2` structure. The flow is input validation -> OCR extraction -> ingredient normalization -> rule scoring -> response rendering, then exposed through a bot server endpoint. Rules are config-driven and support strict red-card gating by confidence.

**Tech Stack:** Python 3, Flask, pytest, JSON config, Coze bot/workflow integration pattern from existing `Data-Analyst-V2`.

---

## File Structure Map

- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/README.md` (project onboarding and runbook)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/requirements.txt` (runtime + test dependencies)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/config/risk_rules.json` (v1 30-50 rule dataset)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/config/normalize_map.json` (ingredient synonym normalization)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/main.py` (app entrypoint)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/state.py` (typed state contract)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/graph.py` (node wiring)
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/input_validation_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/ocr_extract_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/normalize_ingredients_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/risk_scoring_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/render_response_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/services/rule_engine.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/services/ocr_service.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/bot/coze_bot_server.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_input_validation_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_normalize_ingredients_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_risk_scoring_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_render_response_node.py`

### Task 1: Scaffold Project Skeleton

**Files:**
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/README.md`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/requirements.txt`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/__init__.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/main.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_smoke_startup.py`

- [ ] **Step 1: Write the failing smoke test**

```python
# Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_smoke_startup.py
from src.main import create_app


def test_create_app():
    app = create_app()
    assert app is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_smoke_startup.py -v`  
Expected: FAIL with `ModuleNotFoundError` or missing `create_app`.

- [ ] **Step 3: Write minimal implementation**

```python
# Coze/WorkFlow/Food-Ingredient-Analyzer/src/main.py
from flask import Flask


def create_app() -> Flask:
    app = Flask(__name__)
    return app
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_smoke_startup.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer
git commit -m "chore: scaffold food ingredient analyzer project"
```

### Task 2: Define Workflow State and Graph Wiring

**Files:**
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/state.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/graph.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/__init__.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_graph_flow.py`

- [ ] **Step 1: Write failing graph flow test**

```python
from src.graphs.graph import run_pipeline


def test_graph_runs_validation_first():
    state = {"user_input_text": "配料：水，白砂糖", "user_input_image": None}
    result = run_pipeline(state)
    assert "input_mode" in result
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_graph_flow.py -v`  
Expected: FAIL because `run_pipeline` is undefined.

- [ ] **Step 3: Add minimal graph + state contract**

```python
# src/graphs/state.py
from typing import TypedDict, Optional, List, Dict


class IngredientState(TypedDict, total=False):
    user_input_text: Optional[str]
    user_input_image: Optional[str]
    input_mode: str
    ingredient_list: List[str]
    hits: List[Dict]
    risk_level: str
```

```python
# src/graphs/graph.py
from src.graphs.nodes.input_validation_node import validate_input


def run_pipeline(state: dict) -> dict:
    return validate_input(state)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_graph_flow.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_graph_flow.py
git commit -m "feat: add workflow state and initial graph wiring"
```

### Task 3: Implement Input Validation and OCR Extraction Nodes

**Files:**
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/input_validation_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/ocr_extract_node.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/services/ocr_service.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_input_validation_node.py`

- [ ] **Step 1: Write failing tests for input mode and empty-input behavior**

```python
from src.graphs.nodes.input_validation_node import validate_input


def test_rejects_empty_input():
    result = validate_input({"user_input_text": "", "user_input_image": None})
    assert result["error_code"] == "EMPTY_INPUT"


def test_detects_both_mode():
    result = validate_input({"user_input_text": "配料：水", "user_input_image": "base64://x"})
    assert result["input_mode"] == "both"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_input_validation_node.py -v`  
Expected: FAIL.

- [ ] **Step 3: Implement minimal validation + OCR service stub**

```python
# src/graphs/nodes/input_validation_node.py
def validate_input(state: dict) -> dict:
    text = (state.get("user_input_text") or "").strip()
    image = state.get("user_input_image")
    if not text and not image:
        return {**state, "error_code": "EMPTY_INPUT", "error_message": "请上传配料表图片，或直接粘贴配料文本。"}
    if text and image:
        mode = "both"
    elif image:
        mode = "image"
    else:
        mode = "text"
    return {**state, "input_mode": mode}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_input_validation_node.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/input_validation_node.py Coze/WorkFlow/Food-Ingredient-Analyzer/src/services/ocr_service.py Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_input_validation_node.py
git commit -m "feat: add input validation and OCR service stub"
```

### Task 4: Build Ingredient Normalization Pipeline

**Files:**
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/config/normalize_map.json`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/normalize_ingredients_node.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_normalize_ingredients_node.py`

- [ ] **Step 1: Write failing normalization tests**

```python
from src.graphs.nodes.normalize_ingredients_node import normalize_ingredients


def test_normalizes_sugar_synonyms():
    state = {"raw_text": "配料：水、白砂糖、食用香精"}
    result = normalize_ingredients(state)
    assert "添加糖" in result["ingredient_list"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_normalize_ingredients_node.py -v`  
Expected: FAIL.

- [ ] **Step 3: Implement parser + synonym map loading**

```python
# src/graphs/nodes/normalize_ingredients_node.py
import json
from pathlib import Path


def normalize_ingredients(state: dict) -> dict:
    raw = state.get("raw_text", "")
    parts = [p.strip(" ：:，,。.;； ") for p in raw.replace("、", ",").split(",") if p.strip()]
    mapping = json.loads(Path("config/normalize_map.json").read_text(encoding="utf-8"))
    normalized = [mapping.get(p, p) for p in parts]
    return {**state, "ingredient_list": normalized}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_normalize_ingredients_node.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/config/normalize_map.json Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/normalize_ingredients_node.py Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_normalize_ingredients_node.py
git commit -m "feat: add ingredient normalization node with synonym mapping"
```

### Task 5: Implement Rule Engine and Strict Red Scoring

**Files:**
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/config/risk_rules.json`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/services/rule_engine.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/risk_scoring_node.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_risk_scoring_node.py`

- [ ] **Step 1: Write failing strict-red tests**

```python
from src.graphs.nodes.risk_scoring_node import score_risk


def test_red_requires_high_rule_and_high_confidence():
    state = {
        "ingredient_list": ["阿斯巴甜"],
        "decision_confidence": 0.9
    }
    result = score_risk(state)
    assert result["risk_level"] == "red"


def test_downgrades_when_confidence_low():
    state = {
        "ingredient_list": ["阿斯巴甜"],
        "decision_confidence": 0.6
    }
    result = score_risk(state)
    assert result["risk_level"] != "red"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_risk_scoring_node.py -v`  
Expected: FAIL.

- [ ] **Step 3: Implement engine with red gate `>=1 high hard rule && confidence>=0.8`**

```python
# src/graphs/nodes/risk_scoring_node.py
from src.services.rule_engine import match_rules


def score_risk(state: dict) -> dict:
    matches = match_rules(state.get("ingredient_list", []))
    confidence = state.get("decision_confidence", 1.0)
    has_high_hard = any(m["severity"] == "high" and m["rule_type"] == "hard" for m in matches)
    if has_high_hard and confidence >= 0.8:
        level = "red"
    elif matches:
        level = "yellow"
    else:
        level = "green"
    return {**state, "risk_level": level, "hits": matches}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_risk_scoring_node.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/config/risk_rules.json Coze/WorkFlow/Food-Ingredient-Analyzer/src/services/rule_engine.py Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/risk_scoring_node.py Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_risk_scoring_node.py
git commit -m "feat: add strict red-gate risk scoring engine"
```

### Task 6: Render Card + Detail + Disclaimer

**Files:**
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/render_response_node.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_render_response_node.py`

- [ ] **Step 1: Write failing response contract tests**

```python
from src.graphs.nodes.render_response_node import render_response


def test_response_contains_disclaimer_and_details():
    state = {"risk_level": "yellow", "hits": [{"name": "添加糖", "short_reason": "含添加糖"}]}
    result = render_response(state)
    assert "仅供营养健康参考" in result["disclaimer"]
    assert len(result["detail_items"]) == 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_render_response_node.py -v`  
Expected: FAIL.

- [ ] **Step 3: Implement renderer**

```python
def render_response(state: dict) -> dict:
    level = state["risk_level"]
    top_hits = state.get("hits", [])[:3]
    summary = f"风险等级：{level.upper()}，命中{len(top_hits)}项关注成分。"
    details = [{"name": h.get("name", "未知"), "reason": h.get("short_reason", "")} for h in state.get("hits", [])]
    disclaimer = "本结果仅供营养健康参考，不构成医疗建议。"
    return {**state, "summary_card": summary, "detail_items": details, "disclaimer": disclaimer}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_render_response_node.py -v`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/nodes/render_response_node.py Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_render_response_node.py
git commit -m "feat: add card/detail response renderer with disclaimer"
```

### Task 7: Connect End-to-End Pipeline and Bot Endpoint

**Files:**
- Modify: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/graphs/graph.py`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/bot/coze_bot_server.py`
- Modify: `Coze/WorkFlow/Food-Ingredient-Analyzer/src/main.py`
- Test: `Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_e2e_pipeline.py`

- [ ] **Step 1: Write failing E2E test**

```python
from src.graphs.graph import run_pipeline


def test_text_input_returns_risk_payload():
    result = run_pipeline({"user_input_text": "配料：水、白砂糖", "user_input_image": None})
    assert "risk_level" in result
    assert "summary_card" in result
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest tests/test_e2e_pipeline.py -v`  
Expected: FAIL on missing chained node outputs.

- [ ] **Step 3: Implement full node chain + Flask route `/analyze`**

```python
# src/graphs/graph.py
def run_pipeline(state: dict) -> dict:
    s1 = validate_input(state)
    if s1.get("error_code"):
        return s1
    s2 = extract_ocr_if_needed(s1)
    s3 = normalize_ingredients(s2)
    s4 = score_risk(s3)
    return render_response(s4)
```

- [ ] **Step 4: Run test suite**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest -v`  
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/src Coze/WorkFlow/Food-Ingredient-Analyzer/tests/test_e2e_pipeline.py
git commit -m "feat: connect end-to-end pipeline and bot analyze endpoint"
```

### Task 8: Docs, Sample Data, and Release Readiness

**Files:**
- Modify: `Coze/WorkFlow/Food-Ingredient-Analyzer/README.md`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/docs/coze_setup.md`
- Create: `Coze/WorkFlow/Food-Ingredient-Analyzer/docs/test_cases.md`

- [ ] **Step 1: Write failing documentation acceptance checklist**

Add checklist to `docs/test_cases.md` with 7 required acceptance items from spec.

- [ ] **Step 2: Verify local run commands exist and work**

Run:
- `cd Coze/WorkFlow/Food-Ingredient-Analyzer && python -m pip install -r requirements.txt`
- `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest -v`
- `cd Coze/WorkFlow/Food-Ingredient-Analyzer && python -m src.main`

Expected:
- dependencies installed
- test suite PASS
- app starts without crash

- [ ] **Step 3: Document Coze integration steps**

Include in `docs/coze_setup.md`:
- bot input fields (`user_input_text`, `user_input_image`)
- workflow node order
- response card fields (`summary_card`, `detail_items`, `disclaimer`)
- private beta rollout instructions

- [ ] **Step 4: Final regression run**

Run: `cd Coze/WorkFlow/Food-Ingredient-Analyzer && pytest -v`  
Expected: PASS with no skipped critical cases.

- [ ] **Step 5: Commit**

```bash
git add Coze/WorkFlow/Food-Ingredient-Analyzer/README.md Coze/WorkFlow/Food-Ingredient-Analyzer/docs
git commit -m "docs: finalize implementation runbook and Coze setup guide"
```

## Completion Gate

- [ ] All 8 tasks completed with commits
- [ ] `pytest -v` green
- [ ] Strict red-card gating verified (`high hard rule` + `confidence >= 0.8`)
- [ ] Disclaimer always present in responses
- [ ] No long-term storage of raw input image/text in implementation
