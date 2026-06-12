from typing import Dict, List, Any, Optional
from app.config import WEIGHTS


def calculate_metrics(raw_data: Dict[str, List[dict]]) -> List[dict]:
    """
    计算各ETF的量化指标并按综合得分排序
    盘中模式：用今日实时成交量 vs 昨日收盘成交量
    收盘模式：用T日成交量 vs T-2日成交量
    """
    all_items = []

    for category, items in raw_data.items():
        for item in items:
            code = item["code"]
            name = item["name"]
            data_type = item.get("data_type", "closed")

            if data_type == "realtime":
                # 盘中 / 今日收盘模式：data_fetcher已补全 t2_close/t2_volume/t1_volume
                today_vol = item.get("today_volume", 0)
                current_price = item.get("current_price", 0)
                current_change_pct = item.get("current_change_pct", 0)
                t2_close = item.get("t2_close", current_price)
                t2_volume = item.get("t2_volume", today_vol)
                t1_volume = item.get("t1_volume", today_vol)

                # 两日累计涨幅 = (当前价 - T-2收盘价) / T-2收盘价 * 100
                two_day_change_pct = round((current_price - t2_close) / t2_close * 100, 2) if t2_close else 0
                # 成交量放大：今日成交量 vs T-2成交量
                volume_expand_pct = round((today_vol / max(t2_volume, 1) - 1) * 100, 2)
                # 成交量放大相对昨日
                volume_expand_vs_yesterday = round((today_vol / max(t1_volume, 1) - 1) * 100, 2)

            else:
                # 收盘历史模式：直接用历史数据
                current_price = item.get("current_price", 0)
                yesterday_close = item.get("yesterday_close", 0)
                current_change_pct = item.get("current_change_pct", 0)
                today_volume = item.get("today_volume", 0)

                t0_close = item.get("t0_close", current_price)
                t1_close = item.get("t1_close", yesterday_close)
                t2_close = item.get("t2_close", t0_close)
                t0_vol = item.get("t0_volume", today_volume)
                t1_vol = item.get("t1_volume", t0_vol)
                t2_vol = item.get("t2_volume", t0_vol)

                # 两日累计涨幅：(T收盘价 - T-2收盘价) / T-2收盘价 * 100
                two_day_change_pct = round((t0_close - t2_close) / t2_close * 100, 2) if t2_close else 0
                # 成交量放大：(T成交量 - T-2成交量) / T-2成交量 * 100
                volume_expand_pct = round((t0_vol / max(t2_vol, 1) - 1) * 100, 2)
                # 成交量相对昨日放大
                volume_expand_vs_yesterday = round((t0_vol / max(t1_vol, 1) - 1) * 100, 2)

            # volume 字段：realtime/closed_today 用 today_vol，closed 用 today_volume
            vol = today_vol if data_type == "realtime" else item.get("today_volume", 0)

            # MA20确认：当前价在20日均线上方时 +50
            ma20 = item.get("ma20")
            ma20_bonus = 50.0 if (ma20 and current_price >= ma20) else 0.0

            # 30日涨跌幅（先记录，后续统一计算标准分）
            change_30d = item.get("change_30d")

            all_items.append({
                "code": code,
                "name": name,
                "category": category,
                "current_price": current_price,
                "current_change_pct": current_change_pct,
                "two_day_change_pct": two_day_change_pct,
                "volume_expand_pct": volume_expand_pct,
                "volume_expand_vs_yesterday": volume_expand_vs_yesterday,
                "volume": vol,
                "ma20": ma20,
                "ma20_confirmed": ma20 is not None and current_price >= ma20,
                "change_30d": change_30d,
                "data_type": data_type,
                "data_date": item.get("data_date", ""),
            })

    # 计算30日涨跌幅标准分：跌幅最大 +50，涨幅最大 +0，线性插值
    _calc_change_30d_score(all_items)

    # 计算综合得分
    for item in all_items:
        change_30d_score = item.get("change_30d_score", 0.0)
        composite_score = round(
            item["current_change_pct"] * WEIGHTS["current_change"]
            + item["two_day_change_pct"] * WEIGHTS["two_day_change"]
            + item["volume_expand_pct"] * WEIGHTS["volume_expand"]
            + (50.0 if item["ma20_confirmed"] else 0.0)
            + change_30d_score * WEIGHTS["change_30d"],
            4,
        )
        item["composite_score"] = composite_score

    # 按综合得分降序
    all_items.sort(key=lambda x: x["composite_score"], reverse=True)
    return all_items


def _calc_change_30d_score(items: List[dict]) -> None:
    """计算30日涨跌幅标准分，直接写入item['change_30d_score']
    规则：所有标的按30日涨跌幅排序
    - 跌幅最大（30日涨跌幅最小）→ +50分
    - 涨幅最大（30日涨跌幅最大）→ +0分
    - 中间线性插值
    无30日数据的标的 → 0分
    """
    # 筛选有30日数据的标的
    scored = [(i, item["change_30d"]) for i, item in enumerate(items) if item.get("change_30d") is not None]
    if len(scored) < 2:
        for item in items:
            item["change_30d_score"] = 0.0
        return

    # 按涨跌幅排序：跌幅最小（最负）排前面
    scored.sort(key=lambda x: x[1])

    min_change = scored[0][1]   # 跌幅最大（最负）
    max_change = scored[-1][1]  # 涨幅最大（最正）
    range_val = max_change - min_change

    for item in items:
        if item.get("change_30d") is None:
            item["change_30d_score"] = 0.0
        elif range_val == 0:
            # 所有标的30日涨跌幅相同
            item["change_30d_score"] = 25.0
        else:
            # 跌幅最大 → 50，涨幅最大 → 0
            score = 50.0 * (1.0 - (item["change_30d"] - min_change) / range_val)
            item["change_30d_score"] = round(score, 2)


def get_quant_top5(items: List[dict]) -> List[dict]:
    """量化评分TOP5"""
    top5 = items[:5]
    return [
        {
            "rank": i + 1,
            "code": item["code"],
            "name": item["name"],
            "category": item["category"],
            "current_change_pct": item["current_change_pct"],
            "two_day_change_pct": item["two_day_change_pct"],
            "volume_expand_pct": item["volume_expand_pct"],
            "ma20": item.get("ma20"),
            "ma20_confirmed": item.get("ma20_confirmed", False),
            "composite_score": item["composite_score"],
            "change_30d": item.get("change_30d"),
            "change_30d_score": item.get("change_30d_score", 0.0),
            "data_type": item.get("data_type", "closed"),
        }
        for i, item in enumerate(top5)
    ]


# 盘中模式下 T-1/T-2 数据由 data_fetcher 提供（已缓存在 _t1_cache / _t2_cache）
from app.data_fetcher import _t1_cache, _t2_cache
