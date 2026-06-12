import logging
from datetime import datetime, time
from typing import Tuple, Optional

import akshare as ak
import pandas as pd

from app.config import ETF_POOL

_log = logging.getLogger("app.data_fetcher")

TRADE_MORNING_START = time(9, 30)
TRADE_MORNING_END = time(11, 30)
TRADE_AFTERNOON_START = time(13, 0)
TRADE_AFTERNOON_END = time(15, 0)


def should_use_realtime_mode() -> bool:
    now = datetime.now()
    t = now.time()
    if now.weekday() >= 5:
        return False
    if TRADE_MORNING_START <= t <= TRADE_MORNING_END:
        return True
    if TRADE_AFTERNOON_START <= t <= TRADE_AFTERNOON_END:
        return True
    return False


def fetch_all_etf_data() -> Tuple[Optional[dict], bool]:
    realtime = should_use_realtime_mode()
    _log.info("fetch_all_etf_data: realtime=%s", realtime)

    try:
        if realtime:
            raw = _fetch_realtime()
        else:
            raw = _fetch_history()
        return raw, realtime
    except Exception as e:
        _log.error("fetch_all_etf_data failed: %s", e)
        return None, False


def _fetch_realtime() -> dict:
    try:
        df = ak.fund_etf_spot_em()
        if df is None or df.empty:
            _log.warning("ak.fund_etf_spot_em returned empty")
            return _fetch_history()

        result = {}
        pool_codes = {e["code"] for e in ETF_POOL}
        code_col = _find_col(df, ["代码", "基金代码", "code"])
        name_col = _find_col(df, ["名称", "基金名称", "name"])
        price_col = _find_col(df, ["最新价", "当前价", "现价", "price", "收盘价"])
        change_col = _find_col(df, ["涨跌幅", "涨跌%", "change_pct", "涨跌幅(%)"])
        volume_col = _find_col(df, ["成交量", "volume", "成交量的单位都是手"])
        amount_col = _find_col(df, ["成交额", "amount", "成交额的单位都是元"])
        turnover_col = _find_col(df, ["换手率", "换手率(%)", "turnover_rate"])

        for _, row in df.iterrows():
            code = str(row.get(code_col, "")).strip()
            if code not in pool_codes:
                continue
            name_map = {e["code"]: e["name"] for e in ETF_POOL}
            result[code] = {
                "code": code,
                "name": name_map.get(code, str(row.get(name_col, "")).strip()),
                "current_price": _safe_float(row.get(price_col, 0)),
                "change_pct": _safe_float(row.get(change_col, 0)),
                "volume": _safe_float(row.get(volume_col, 0)),
                "amount": _safe_float(row.get(amount_col, 0)),
                "turnover_rate": _safe_float(row.get(turnover_col, 0)),
                "data_date": datetime.now().strftime("%Y-%m-%d"),
                "data_type": "realtime",
            }

        if not result:
            _log.warning("realtime mode: no matching ETF found, fallback to history")
            return _fetch_history()

        for e in ETF_POOL:
            if e["code"] not in result:
                result[e["code"]] = {
                    "code": e["code"],
                    "name": e["name"],
                    "current_price": 0,
                    "change_pct": 0,
                    "volume": 0,
                    "amount": 0,
                    "turnover_rate": 0,
                    "data_date": datetime.now().strftime("%Y-%m-%d"),
                    "data_type": "realtime",
                }
        return result
    except Exception as e:
        _log.error("realtime fetch failed: %s, fallback to history", e)
        return _fetch_history()


def _fetch_history() -> dict:
    result = {}
    for etf in ETF_POOL:
        code = etf["code"]
        try:
            df = ak.fund_etf_hist_sina(symbol=code)
            if df is None or df.empty:
                _log.warning("ak.fund_etf_hist_sina(%s) returned empty", code)
                result[code] = _empty_item(etf)
                continue
            last = df.iloc[-1]
            date_val = str(last.get("date", "")).strip()
            if not date_val:
                date_val = str(last.iloc[0]).strip() if len(df.columns) > 0 else ""
            result[code] = {
                "code": code,
                "name": etf["name"],
                "current_price": _safe_float(last.get("close", 0)),
                "change_pct": _safe_float(last.get("change_pct", 0)),
                "volume": _safe_float(last.get("volume", 0)),
                "amount": 0,
                "turnover_rate": 0,
                "data_date": date_val,
                "data_type": "closed",
            }
        except Exception as e:
            _log.warning("fetch history for %s failed: %s", code, e)
            result[code] = _empty_item(etf)
    return result


def _empty_item(etf: dict) -> dict:
    return {
        "code": etf["code"],
        "name": etf["name"],
        "current_price": 0,
        "change_pct": 0,
        "volume": 0,
        "amount": 0,
        "turnover_rate": 0,
        "data_date": datetime.now().strftime("%Y-%m-%d"),
        "data_type": "closed",
    }


def _find_col(df: pd.DataFrame, candidates: list) -> str:
    for c in candidates:
        if c in df.columns:
            return c
    return candidates[0] if candidates else ""


def _safe_float(val) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
