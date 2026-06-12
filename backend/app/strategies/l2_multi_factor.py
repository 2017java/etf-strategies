import pandas as pd
import numpy as np
from typing import List, Dict

from app.strategies.base import RebalanceSignal


def compute_valuation_composite(
    closes: pd.Series,
    lookback: int = 60,
    dd_lookback: int = 60,
) -> float:
    if len(closes) < lookback:
        return 0.5
    window = closes.iloc[-lookback:]
    current = window.iloc[-1]
    rank = 1.0 - (window < current).sum() / len(window)
    if dd_lookback > 0 and len(closes) >= dd_lookback:
        dd_window = closes.iloc[-dd_lookback:]
        rolling_max = dd_window.cummax()
        dd = (dd_window - rolling_max) / rolling_max
        max_dd = dd.min()
        if max_dd < 0:
            dd_score = max_dd / (-0.3)
            dd_score = max(0.0, min(1.0, dd_score))
        else:
            dd_score = 0.0
    else:
        dd_score = 0.5
    return round(float(rank * 0.6 + dd_score * 0.4), 4)


class L2MultiFactor:
    name = "l2_multi_factor"

    def __init__(
        self,
        codes: List[str] = None,
        top_n: int = 5,
        m_days: int = 20,
        lookback: int = 60,
    ):
        self.codes = codes or []
        self.top_n = top_n
        self.m_days = m_days
        self.lookback = lookback

    def generate_signals(self, ohlcv: pd.DataFrame, calendar: list) -> List[RebalanceSignal]:
        codes = self.codes if self.codes else self._extract_codes(ohlcv)
        signals = []
        monthly_dates = self._monthly_dates(calendar)

        for d in monthly_dates:
            scores = {}
            for code in codes:
                try:
                    closes = self._get_closes_before(ohlcv, code, d)
                    if len(closes) < self.m_days:
                        continue
                    trend = self._trend_score(closes)
                    valuation = compute_valuation_composite(closes, self.lookback)
                    momentum = self._momentum(closes)
                    composite = trend * 0.4 + valuation * 0.3 + momentum * 0.3
                    scores[code] = round(composite, 4)
                except Exception:
                    continue

            if not scores:
                continue

            sorted_codes = sorted(scores.keys(), key=lambda c: scores[c], reverse=True)
            target = sorted_codes[: self.top_n]
            signals.append(
                RebalanceSignal(
                    date=d,
                    target_codes=target,
                    reason="l2_multi_factor",
                    scores={c: scores[c] for c in target},
                )
            )

        return signals

    def _extract_codes(self, ohlcv: pd.DataFrame) -> list:
        if isinstance(ohlcv.index, pd.MultiIndex):
            return list(set(ohlcv.index.get_level_values("code")))
        elif "code" in ohlcv.columns:
            return list(set(ohlcv["code"]))
        return []

    def _monthly_dates(self, calendar: list) -> list:
        if not calendar:
            return []
        from itertools import groupby
        result = []
        for key, group in groupby(calendar, key=lambda d: (d.year, d.month)):
            dates_in_month = list(group)
            result.append(dates_in_month[-1])
        return result

    def _trend_score(self, closes: pd.Series) -> float:
        if len(closes) < self.m_days:
            return 0.0
        recent = closes.iloc[-self.m_days:]
        x = np.arange(len(recent))
        y = recent.values
        if y.std() == 0:
            return 0.0
        slope = np.polyfit(x, y, 1)[0]
        return float(slope / y.mean() * 100)

    def _momentum(self, closes: pd.Series) -> float:
        if len(closes) < self.m_days:
            return 0.0
        return float((closes.iloc[-1] / closes.iloc[-self.m_days] - 1) * 100)

    def _get_closes_before(self, ohlcv: pd.DataFrame, code: str, date) -> pd.Series:
        if isinstance(ohlcv.index, pd.MultiIndex):
            try:
                sub = ohlcv.xs(code, level="code")
                sub = sub[sub.index <= date]
                return sub["close"]
            except KeyError:
                return pd.Series(dtype=float)
        else:
            mask = (ohlcv["code"] == code) & (ohlcv["date"] <= date)
            return ohlcv.loc[mask, "close"]
