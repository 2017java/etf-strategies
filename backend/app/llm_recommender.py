import json
import logging
from typing import List

import httpx

from app.config import LLM_API_KEY, LLM_API_BASE, LLM_MODEL

_log = logging.getLogger("app.llm_recommender")


def get_llm_recommendations(etf_list: List[dict]) -> List[dict]:
    top_candidates = sorted(
        etf_list, key=lambda x: x.get("quant_score", 0), reverse=True
    )[:10]

    if not LLM_API_KEY:
        _log.warning("LLM_API_KEY not set, using fallback")
        return fallback_recommend(top_candidates)

    try:
        return call_llm_api(top_candidates)
    except Exception as e:
        _log.error("LLM API call failed: %s, using fallback", e)
        return fallback_recommend(top_candidates)


def call_llm_api(candidates: List[dict]) -> List[dict]:
    prompt = _build_prompt(candidates)
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一个专业的ETF投资顾问。根据提供的ETF数据，"
                    "选出最值得关注的5只ETF，并给出简短理由。"
                    "请以JSON数组格式返回，每项包含code, name, reason字段。"
                    "不要输出任何其他文字，只输出JSON数组。"
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
    }

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            f"{LLM_API_BASE}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"].strip()
    _log.info("LLM response (first 200 chars): %s", content[:200])

    try:
        items = json.loads(content)
    except json.JSONDecodeError:
        _log.warning("LLM response is not valid JSON, trying to extract")
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            items = json.loads(content[start:end])
        else:
            raise ValueError("Cannot parse LLM response as JSON")

    candidate_map = {c["code"]: c for c in candidates}
    result = []
    for item in items[:5]:
        code = item.get("code", "")
        c = candidate_map.get(code, {})
        result.append({
            "code": code,
            "name": item.get("name", c.get("name", "")),
            "current_price": c.get("current_price", 0),
            "change_pct": c.get("change_pct", 0),
            "reason": item.get("reason", ""),
            "source": "llm",
        })

    return result


def fallback_recommend(candidates: List[dict]) -> List[dict]:
    top5 = candidates[:5]
    result = []
    for c in top5:
        change = c.get("change_pct", 0)
        if change > 2:
            reason = "强势上涨，动量充足"
        elif change > 0:
            reason = "温和上涨，趋势向好"
        elif change > -1:
            reason = "小幅调整，关注企稳"
        else:
            reason = "回调较深，等待反转信号"
        result.append({
            "code": c.get("code", ""),
            "name": c.get("name", ""),
            "current_price": c.get("current_price", 0),
            "change_pct": c.get("change_pct", 0),
            "reason": reason,
            "source": "fallback",
        })
    return result


def _build_prompt(candidates: List[dict]) -> str:
    lines = ["以下是10只ETF的最新数据：\n"]
    for c in candidates:
        lines.append(
            f"- {c.get('code', '')} {c.get('name', '')}: "
            f"价格={c.get('current_price', 0):.3f}, "
            f"涨跌幅={c.get('change_pct', 0):.2f}%, "
            f"量化得分={c.get('quant_score', 0):.2f}"
        )
    lines.append(
        "\n请选出最值得关注的5只ETF，返回JSON数组，"
        '每项格式: {"code": "代码", "name": "名称", "reason": "推荐理由"}'
    )
    return "\n".join(lines)
