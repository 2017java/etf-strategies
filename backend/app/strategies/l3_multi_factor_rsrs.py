import pandas as pd
import numpy as np
from typing import List, Dict

from app.strategies.base import RebalanceSignal


def compute_rsrs(
    high: pd.Series,
    low: pd.Series,
    n: int = 18,
    m: int = 600,
) -> float:
    if len(high) < n or len(low) < n:
        return 0.0
    high_vals = high.values
    low_vals = low.values
    betas = []
    for i in range(n - 1, len(high_vals)):
        h_window = high_vals[i - n + 1 : i + 1]
        l_window = low_vals[i - n + 1 : i + 1]
        x = l_window
        y = h_window
        x_mean = x.mean()
        y_mean = y.mean()
        numerator = np.sum((x - x_mean) * (y - y_mean))
        denominator = np.sum((x - x_mean) ** 2)
        if denominator == 0:
            continue
        beta = numerator / denominator
        betas.append(beta)

    if not betas:
        return 0.0

    betas_series = pd.Series(betas)
    if len(betas_series) < 2:
        return 0.0

    mean_beta = betas_series.mean()
    std_beta = betas_series.std()
    if std_beta == 0:
        return 0.0

    rsrs = (betas_series.iloc[-1] - mean_beta) / std_beta
    return float(rsrs)


class L3MultiFactorRSRS:
    name = "l3_multi_factor_rsrs"

    def __init__(
        self,
        codes: List[str] = None,
        benchmark_code: str = "510300",
        top_n: int = 5,
        rsrs_n: int = 18,
        rsrs_m: int = 600,
        benchmark_threshold: float = 0.0,
        stock_threshold: float = 0.0,
    ):
        self.codes = codes or []
        self.benchmark_code = benchmark_code
        self.top_n = top_n
        self.rsrs_n = rsrs_n
        self.rsrs_m = rsrs_m
        self.benchmark_threshold = benchmark_threshold
        self.stock_threshold = stock_threshold

    def generate_signals(self, ohlcv: pd.DataFrame, calendar: list) -> List[RebalanceSignal]:
        codes = self.codes if self.codes else self._extract_codes(ohlcv)
        signals = []
        monthly_dates = self._monthly_dates(calendar)

        for d in monthly_dates:
            bench_rsrs = self._compute_etf_rsrs(ohlcv, self.benchmark_code, d)
            if bench_rsrs < self.benchmark_threshold:
                signals.append(
                    RebalanceSignal(
                        date=d,
                        target_codes=[],
                        reason=f"l3_benchmark_weak(rsrs={bench_rsrs:.2f})",
                        scores={},
                    )
                )
                continue

            scores = {}
            for code in codes:
                if code == self.benchmark_code:
                    continue
                try:
                    closes = self._get_closes_before(ohlcv, code, d)
                    if len(closes) < 20:
                        continue
                    trend = self._trend_score(closes)
                    momentum = self._momentum(closes)
                    stock_rsrs = self._compute_etf_rsrs(ohlcv, code, d)
                    if stock_rsrs < self.stock_threshold:
                        continue
                    composite = trend * 0.3 + momentum * 0.3 + stock_rsrs * 0.4
                    scores[code] = round(composite, 4)
                except Exception:
                    continue

            sorted_codes = sorted(scores.keys(), key=lambda c: scores[c], reverse=True)
            target = sorted_codes[: self.top_n]
            signals.append(
                RebalanceSignal(
                    date=d,
                    target_codes=target,
                    reason="l3_multi_factor_rsrs",
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

    def _compute_etf_rsrs(self, ohlcv: pd.DataFrame, code: str, date) -> float:
        if isinstance(ohlcv.index, pd.MultiIndex):
            try:
                sub = ohlcv.xs(code, level="code")
                sub = sub[sub.index <= date]
            except KeyError:
                return 0.0
        else:
            mask = (ohlcv["code"] == code) & (ohlcv["date"] <= date)
            sub = ohlcv.loc[mask]

        if len(sub) < self.rsrs_n:
            return 0.0

        return compute_rsrs(sub["high"], sub["low"], n=self.rsrs_n, m=self.rsrs_m)

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
        if len(closes) < 20:
            return 0.0
        recent = closes.iloc[-20:]
        x = np.arange(len(recent))
        y = recent.values
        if y.std() == 0:
            return 0.0
        slope = np.polyfit(x, y, 1)[0]
        return float(slope / y.mean() * 100)

    def _momentum(self, closes: pd.Series) -> float:
        if len(closes) < 20:
            return 0.0
        return float((closes.iloc[-1] / closes.iloc[-20] - 1) * 100)

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
