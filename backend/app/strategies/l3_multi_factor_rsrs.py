import numpy as np
import pandas as pd
from datetime import date
from app.strategies.base import Strategy, RebalanceSignal
from app.strategies.l2_multi_factor import FACTORS, _standardize, compute_valuation_composite


def compute_rsrs(high: pd.Series, low: pd.Series, n: int = 18, m: int = 600) -> float:
    """计算 RSRS 指标（阻力支撑相对强度）。

    1. 对每 N 日的 high/low 做线性回归 high = beta * low + alpha，得到 beta 序列
    2. 取最近 M 个 beta 值做 z-score 标准化
    3. RSRS = beta * z_score
    """
    if len(high) < n or len(low) < n:
        return 0.0
    high_arr = high.values
    low_arr = low.values

    betas: list[float] = []
    for i in range(n, len(high_arr) + 1):
        window_low = low_arr[i - n : i]
        window_high = high_arr[i - n : i]
        try:
            beta, _ = np.polyfit(window_low, window_high, 1)
        except (np.linalg.LinAlgError, ValueError):
            beta = 0.0
        betas.append(float(beta))

    if not betas:
        return 0.0

    current_beta = betas[-1]
    beta_window = betas[-m:] if len(betas) >= m else betas
    beta_arr = np.array(beta_window, dtype=float)
    beta_std = float(beta_arr.std(ddof=0))
    beta_mean = float(beta_arr.mean())
    if beta_std == 0:
        z_score = 0.0
    else:
        z_score = (current_beta - beta_mean) / beta_std
    return float(current_beta * z_score)


class L3MultiFactorRSRS(Strategy):
    """L3: 多因子 TOP5 + RSRS 择时。"""

    name = "L3 多因子 + RSRS 择时"
    rebalance_freq = "monthly"

    def __init__(
        self,
        top_n: int = 5,
        rsrs_n: int = 18,
        rsrs_m: int = 600,
        benchmark_code: str = "510300",
        benchmark_threshold: float = -0.5,
        stock_threshold: float = -0.8,
        codes: list[str] | None = None,
    ):
        self.top_n = top_n
        self.rsrs_n = rsrs_n
        self.rsrs_m = rsrs_m
        self.benchmark_code = benchmark_code
        self.benchmark_threshold = benchmark_threshold
        self.stock_threshold = stock_threshold
        self.codes = codes

    def _compute_multi_factor_scores(
        self, ohlcv: pd.DataFrame, d: date, codes: list[str]
    ) -> dict[str, float]:
        per_factor: dict[str, pd.Series] = {f: pd.Series(dtype=float) for f in FACTORS}

        for code in codes:
            try:
                sub = ohlcv.xs(code, level="code")
            except KeyError:
                continue
            sub.index = pd.DatetimeIndex(pd.to_datetime(sub.index))
            sub = sub[sub.index <= pd.Timestamp(d)]
            if len(sub) < 30:
                continue

            close = sub["close"]
            volume = sub["volume"]

            mom_20 = (close.iloc[-1] / close.iloc[-20] - 1) if len(close) >= 20 else 0
            vol_5 = volume.tail(5).mean()
            vol_20 = volume.tail(20).mean()
            vol_expand = (vol_5 / vol_20 - 1) if vol_20 > 0 else 0
            reversal_30 = -(close.iloc[-1] / close.iloc[-30] - 1) if len(close) >= 30 else 0
            val_comp = compute_valuation_composite(close)
            vol_20d = close.pct_change().tail(20).std(ddof=0)
            inv_vol = 1.0 / (vol_20d + 1e-6) if vol_20d > 0 else 0

            for fname, val in [
                ("momentum_20d", mom_20),
                ("volume_expand", vol_expand),
                ("reversal_30d", reversal_30),
                ("valuation_composite", val_comp),
                ("inv_volatility", inv_vol),
            ]:
                per_factor[fname][code] = float(val)

        all_codes_set = set().union(*[s.index for s in per_factor.values()]) if per_factor else set()
        final: dict[str, float] = {}
        for code in all_codes_set:
            weighted = 0.0
            for fname, w in FACTORS.items():
                s = per_factor[fname]
                if code in s.index:
                    z = float(_standardize(s).get(code, 0.0) or 0.0)
                    weighted += z * w
            final[code] = weighted
        return final

    def _compute_rsrs_for_code(
        self, ohlcv: pd.DataFrame, d: date, code: str
    ) -> float:
        try:
            sub = ohlcv.xs(code, level="code")
        except KeyError:
            return 0.0
        sub.index = pd.DatetimeIndex(pd.to_datetime(sub.index))
        sub = sub[sub.index <= pd.Timestamp(d)].sort_index()
        if len(sub) < self.rsrs_n:
            return 0.0
        return compute_rsrs(sub["high"], sub["low"], self.rsrs_n, self.rsrs_m)

    def generate_signals(self, ohlcv, calendar):
        all_codes = self.codes or sorted(
            {c for _, c in ohlcv.index if c != self.benchmark_code}
        )
        all_dates = sorted({d for d, _ in ohlcv.index})
        if not all_dates:
            return []

        monthly_first: list[date] = []
        last_month = None
        for d in all_dates:
            ym = (d.year, d.month)
            if ym != last_month:
                monthly_first.append(d)
                last_month = ym

        signals: list[RebalanceSignal] = []
        current: set[str] | None = None

        for d in monthly_first:
            bench_rsrs = self._compute_rsrs_for_code(ohlcv, d, self.benchmark_code)

            if bench_rsrs < self.benchmark_threshold:
                target: list[str] = []
                reason = f"大盘 RSRS={bench_rsrs:.3f} < {self.benchmark_threshold}，空仓"
                scores: dict[str, float] = {}
            else:
                scores = self._compute_multi_factor_scores(ohlcv, d, all_codes)
                if not scores:
                    continue
                per_code_rsrs: dict[str, float] = {}
                for code in all_codes:
                    per_code_rsrs[code] = self._compute_rsrs_for_code(ohlcv, d, code)
                filtered = {
                    c: s for c, s in scores.items()
                    if per_code_rsrs.get(c, 0.0) >= self.stock_threshold
                }
                if not filtered:
                    target = []
                    reason = "所有个股 RSRS 偏弱，空仓"
                else:
                    target = sorted(filtered, key=filtered.get, reverse=True)[: self.top_n]
                    reason = (
                        f"多因子 TOP{self.top_n} + RSRS 过滤 "
                        f"(大盘={bench_rsrs:.3f})"
                    )

            target_set = set(target)
            if current is None or target_set != current:
                current = target_set
                signals.append(RebalanceSignal(
                    date=d, target_codes=target,
                    reason=reason, scores=scores,
                ))
        return signals
