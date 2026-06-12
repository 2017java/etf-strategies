import logging
from typing import List

_log = logging.getLogger("app.calculator")


def calculate_metrics(raw_data: dict) -> List[dict]:
    results = []
    for code, item in raw_data.items():
        entry = dict(item)
        current_price = entry.get("current_price", 0) or 0
        change_pct = entry.get("change_pct", 0) or 0

        trend_score = _compute_trend_score(change_pct)
        momentum_5d = round(change_pct * 0.5, 2)
        momentum_10d = round(change_pct * 0.3, 2)
        momentum_20d = round(change_pct * 0.2, 2)
        volatility_20d = round(abs(change_pct) * 1.5, 2)
        volume_ratio = round(entry.get("turnover_rate", 0) or 0, 2)

        quant_score = _compute_quant_score(
            trend_score, momentum_5d, momentum_20d, volume_ratio
        )

        entry.update({
            "trend_score": trend_score,
            "momentum_5d": momentum_5d,
            "momentum_10d": momentum_10d,
            "momentum_20d": momentum_20d,
            "volatility_20d": volatility_20d,
            "volume_ratio": volume_ratio,
            "quant_score": quant_score,
        })
        results.append(entry)

    results.sort(key=lambda x: x.get("quant_score", 0), reverse=True)
    return results


def get_quant_top5(etf_list: List[dict]) -> List[dict]:
    sorted_list = sorted(etf_list, key=lambda x: x.get("quant_score", 0), reverse=True)
    top5 = sorted_list[:5]
    result = []
    for item in top5:
        result.append({
            "code": item.get("code", ""),
            "name": item.get("name", ""),
            "current_price": item.get("current_price", 0),
            "change_pct": item.get("change_pct", 0),
            "quant_score": item.get("quant_score", 0),
            "trend_score": item.get("trend_score", 0),
            "momentum_5d": item.get("momentum_5d", 0),
            "momentum_20d": item.get("momentum_20d", 0),
            "volume_ratio": item.get("volume_ratio", 0),
        })
    return result


def _compute_trend_score(change_pct: float) -> float:
    if change_pct > 3:
        return 10.0
    elif change_pct > 2:
        return 8.0
    elif change_pct > 1:
        return 6.0
    elif change_pct > 0:
        return 4.0
    elif change_pct > -1:
        return 2.0
    elif change_pct > -2:
        return 0.0
    elif change_pct > -3:
        return -2.0
    else:
        return -4.0


def _compute_quant_score(
    trend_score: float,
    momentum_5d: float,
    momentum_20d: float,
    volume_ratio: float,
) -> float:
    score = (
        trend_score * 0.4
        + momentum_5d * 0.25
        + momentum_20d * 0.2
        + min(volume_ratio, 10) * 0.15
    )
    return round(max(0, score), 2)
