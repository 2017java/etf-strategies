import pandas as pd
from datetime import date
from app.strategies.base import Strategy, RebalanceSignal

FACTORS = {
    "momentum_20d": 0.30,
    "volume_expand": 0.20,
    "reversal_30d": 0.15,
    "valuation_composite": 0.25,
    "inv_volatility": 0.10,
}


def compute_valuation_composite(close: pd.Series, lookback: int = 250, dd_lookback: int = 250) -> float:
    if len(close) < 20:
        return 0.5
    window = close.tail(lookback)
    pct = float(window.rank(pct=True).iloc[-1]) if len(window) >= 20 else 0.5
    price_pct_component = 1 - pct

    dd_window = close.tail(dd_lookback)
    if len(dd_window) >= 2:
        running_max = dd_window.cummax()
        drawdown = (dd_window - running_max) / running_max
        max_dd = abs(float(drawdown.min()))
        dd_inv_component = max_dd
    else:
        dd_inv_component = 0.0

    return price_pct_component * 0.6 + dd_inv_component * 0.4


def _standardize(series: pd.Series) -> pd.Series:
    std = series.std(ddof=0)
    if std == 0 or pd.isna(std):
        return pd.Series(0.0, index=series.index)
    return (series - series.mean()) / std


class L2MultiFactor(Strategy):
    """L2: 多因子打分 TOP5。"""
    name = "L2 多因子 TOP5"
    rebalance_freq = "monthly"

    def __init__(self, top_n: int = 5, codes: list[str] | None = None):
        self.top_n = top_n
        self.codes = codes

    def _compute_scores(self, ohlcv: pd.DataFrame, d: date) -> dict[str, float]:
        all_codes = self.codes or sorted({c for _, c in ohlcv.index})
        per_factor: dict[str, pd.Series] = {f: pd.Series(dtype=float) for f in FACTORS}

        for code in all_codes:
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

    def generate_signals(self, ohlcv, calendar):
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
        current: set[str] = set()
        for d in monthly_first:
            scores = self._compute_scores(ohlcv, d)
            if not scores:
                continue
            top = sorted(scores, key=scores.get, reverse=True)[: self.top_n]
            top_set = set(top)
            if top_set != current:
                current = top_set
                signals.append(RebalanceSignal(
                    date=d, target_codes=top,
                    reason=f"多因子 TOP{self.top_n}",
                    scores=scores,
                ))
        return signals
