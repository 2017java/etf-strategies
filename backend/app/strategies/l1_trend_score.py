import pandas as pd
import numpy as np
from typing import List, Dict

from app.strategies.base import RebalanceSignal


class L1TrendScore:
    name = "l1_trend_score"

    def __init__(self, codes: List[str] = None, m_days: int = 20, top_n: int = 5):
        self.codes = codes or []
        self.m_days = m_days
        self.top_n = top_n

    def trend_score(self, closes: pd.Series) -> float:
        if len(closes) < self.m_days:
            return 0.0
        recent = closes.iloc[-self.m_days:]
        x = np.arange(len(recent))
        y = recent.values
        if y.std() == 0:
            return 0.0
        slope = np.polyfit(x, y, 1)[0]
        return float(slope / y.mean() * 100)

    def generate_signals(self, ohlcv: pd.DataFrame, calendar: list) -> List[RebalanceSignal]:
        codes = self.codes if self.codes else self._extract_codes(ohlcv)
        signals = []
        monthly_dates = self._monthly_dates(calendar)

        for d in monthly_dates:
            scores = {}
            for code in codes:
                try:
                    closes = self._get_closes_before(ohlcv, code, d)
                    if len(closes) >= self.m_days:
                        scores[code] = self.trend_score(closes)
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
                    reason="l1_trend_score",
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
