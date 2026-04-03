from __future__ import annotations

import os
from pathlib import Path
from typing import Dict

from .models import WorkflowInput


DEFAULT_ONBOARDING_KEYWORDS = (
    "\u6fc0\u6d3b",
    "\u9996\u767b",
    "\u6f0f\u6597",
    "\u65b0\u624b\u5f15\u5bfc",
    "\u9996\u6b21\u4ef7\u503c",
)


def _default_keywords_file() -> Path:
    return Path(__file__).resolve().parents[1] / "data" / "routing" / "onboarding_keywords.txt"


def load_onboarding_keywords() -> tuple[str, ...]:
    configured_path = os.getenv("PM_DC_ONBOARDING_KEYWORDS_FILE")
    keyword_file = Path(configured_path) if configured_path else _default_keywords_file()
    try:
        lines = keyword_file.read_text(encoding="utf-8").splitlines()
        words = []
        for raw in lines:
            line = raw.strip().lstrip("\ufeff")
            if not line or line.startswith("#"):
                continue
            words.append(line)
        return tuple(words) if words else DEFAULT_ONBOARDING_KEYWORDS
    except FileNotFoundError:
        return DEFAULT_ONBOARDING_KEYWORDS


def detect_optional_stages(payload: WorkflowInput) -> Dict[str, bool]:
    haystack = " ".join(
        [
            payload.get("raw_request", ""),
            payload.get("business_background", ""),
            payload.get("current_state", ""),
            " ".join(payload.get("target_metrics", [])),
        ]
    )
    keywords = load_onboarding_keywords()
    return {"enable_onboarding_cro": any(word in haystack for word in keywords)}


def detect_missing_fields(payload: WorkflowInput) -> list[str]:
    missing = []
    for key in ("raw_request", "business_background", "current_state"):
        if not payload.get(key):
            missing.append(key)
    if not payload.get("target_metrics"):
        missing.append("target_metrics")
    return missing
