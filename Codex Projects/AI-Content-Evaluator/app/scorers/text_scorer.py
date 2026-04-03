import re
from collections import Counter

from app.schemas import ActionSuggestion, AnalyzeResponse, ConfidenceLevel

TEMPLATE_PHRASES = [
    "首先",
    "其次",
    "最后",
    "总的来说",
    "综上所述",
    "值得注意的是",
    "可以看出",
]


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def _confidence_by_length(length: int) -> ConfidenceLevel:
    if length >= 600:
        return ConfidenceLevel.HIGH
    if length >= 180:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def score_text(text: str) -> AnalyzeResponse:
    clean = re.sub(r"\s+", " ", text).strip()
    length = len(clean)

    if not clean:
        return AnalyzeResponse(
            source_type="text",
            ai_score=0,
            quality_risk=100,
            confidence=ConfidenceLevel.LOW,
            evidence=["文本为空"],
            suggestion=ActionSuggestion.MANUAL_REVIEW,
            extra={"length": 0},
        )

    chars = list(clean)
    counter = Counter(chars)
    most_common_count = counter.most_common(1)[0][1]
    max_char_ratio = most_common_count / length

    words = re.findall(r"[\u4e00-\u9fa5A-Za-z0-9_]+", clean)
    word_count = len(words)
    unique_word_ratio = len(set(words)) / max(word_count, 1)

    template_hits = sum(clean.count(p) for p in TEMPLATE_PHRASES)
    punctuation_count = len(re.findall(r"[，。！？；、,.!?;:]", clean))
    punctuation_ratio = punctuation_count / max(length, 1)

    ai_score = (
        35 * max_char_ratio
        + 30 * (1 - unique_word_ratio)
        + 12 * min(template_hits / 6, 1)
        + 8 * min(punctuation_ratio / 0.08, 1)
        + (15 if length < 100 else 0)
    )
    ai_score = round(_clamp(ai_score), 2)

    info_density = unique_word_ratio * min(word_count / 120, 1)
    quality_risk = (
        45 * (1 - info_density)
        + 25 * max_char_ratio
        + (20 if length < 80 else 0)
        + 10 * min(template_hits / 6, 1)
    )
    quality_risk = round(_clamp(quality_risk), 2)

    evidence: list[str] = []
    if max_char_ratio > 0.15:
        evidence.append("字符分布集中，重复特征偏高")
    if unique_word_ratio < 0.45:
        evidence.append("词汇多样性较低")
    if template_hits >= 2:
        evidence.append("出现明显模板化表达")
    if length < 100:
        evidence.append("文本较短，判断不确定性较高")

    if not evidence:
        evidence.append("文本结构较自然，未发现明显模板化特征")

    if ai_score >= 70 or quality_risk >= 75:
        suggestion = ActionSuggestion.MANUAL_REVIEW
    elif ai_score >= 45 or quality_risk >= 50:
        suggestion = ActionSuggestion.FLAG
    else:
        suggestion = ActionSuggestion.ALLOW

    return AnalyzeResponse(
        source_type="text",
        ai_score=ai_score,
        quality_risk=quality_risk,
        confidence=_confidence_by_length(length),
        evidence=evidence,
        suggestion=suggestion,
        extra={
            "length": length,
            "word_count": word_count,
            "max_char_ratio": round(max_char_ratio, 4),
            "unique_word_ratio": round(unique_word_ratio, 4),
            "template_hits": template_hits,
        },
    )
