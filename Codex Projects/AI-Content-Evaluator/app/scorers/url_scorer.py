from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.schemas import ActionSuggestion, AnalyzeResponse, ConfidenceLevel
from app.scorers.text_scorer import score_text

HIGH_TRUST_DOMAINS = {
    "wikipedia.org",
    "nature.com",
    "sciencedirect.com",
    "gov",
    "edu",
    "xinhuanet.com",
    "people.com.cn",
}


def _domain_trust_score(host: str) -> float:
    host = host.lower()
    if any(host.endswith(x) for x in HIGH_TRUST_DOMAINS):
        return 0.8
    if host.endswith(".com") or host.endswith(".cn"):
        return 0.45
    return 0.3


def _merge_confidence(a: ConfidenceLevel, trust: float) -> ConfidenceLevel:
    if a == ConfidenceLevel.HIGH and trust >= 0.45:
        return ConfidenceLevel.HIGH
    if a == ConfidenceLevel.LOW and trust < 0.35:
        return ConfidenceLevel.LOW
    return ConfidenceLevel.MEDIUM


async def score_url(url: str) -> AnalyzeResponse:
    timeout = httpx.Timeout(10.0, connect=5.0)
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        return AnalyzeResponse(
            source_type="url",
            ai_score=0,
            quality_risk=100,
            confidence=ConfidenceLevel.LOW,
            evidence=[f"链接抓取失败: {exc.__class__.__name__}"],
            suggestion=ActionSuggestion.MANUAL_REVIEW,
            extra={"url": url},
        )

    soup = BeautifulSoup(resp.text, "html.parser")
    for bad in soup(["script", "style", "noscript"]):
        bad.extract()

    title = (soup.title.string or "").strip() if soup.title else ""
    page_text = " ".join(soup.get_text(separator=" ").split())
    extracted = page_text[:6000]

    text_result = score_text(extracted)

    host = (urlparse(str(resp.url)).hostname or "").lower()
    trust = _domain_trust_score(host)

    ai_score = round(max(0, min(100, text_result.ai_score - trust * 20)), 2)
    quality_risk = round(max(0, min(100, text_result.quality_risk + (0.5 - trust) * 20)), 2)

    evidence = list(text_result.evidence)
    evidence.append(f"来源域名: {host or 'unknown'}")
    evidence.append(f"来源可信度估计: {round(trust, 2)}")

    if ai_score >= 70 or quality_risk >= 75:
        suggestion = ActionSuggestion.MANUAL_REVIEW
    elif ai_score >= 45 or quality_risk >= 50:
        suggestion = ActionSuggestion.FLAG
    else:
        suggestion = ActionSuggestion.ALLOW

    return AnalyzeResponse(
        source_type="url",
        ai_score=ai_score,
        quality_risk=quality_risk,
        confidence=_merge_confidence(text_result.confidence, trust),
        evidence=evidence,
        suggestion=suggestion,
        extra={
            "url": str(resp.url),
            "status_code": resp.status_code,
            "title": title,
            "extracted_length": len(extracted),
            "domain_trust": round(trust, 2),
        },
    )
