import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional


@dataclass
class TradeRecord:
    date: object
    action: str
    code: str
    name: str
    shares: int
    price: float
    amount: float
    cost: float = 0.0


@dataclass
class BacktestResult:
    nav: pd.Series = field(default_factory=pd.Series)
    benchmark_nav: pd.Series = field(default_factory=pd.Series)
    trades: List[Dict] = field(default_factory=list)
    metrics: Dict = field(default_factory=dict)


class BacktestEngine:
    def __init__(self, initial_cash: float = 1_000_000.0, cost_rate: float = 0.0002):
        self.initial_cash = initial_cash
        self.cost_rate = cost_rate

    def run(
        self,
        signals: list,
        ohlcv: pd.DataFrame,
        benchmark_code: str = "510300",
    ) -> BacktestResult:
        if ohlcv.empty:
            return BacktestResult()

        ohlcv = ohlcv.sort_index()
        if isinstance(ohlcv.index, pd.MultiIndex):
            all_dates = sorted(set(ohlcv.index.get_level_values("date")))
        else:
            all_dates = sorted(set(ohlcv["date"]))

        if not all_dates:
            return BacktestResult()

        cash = self.initial_cash
        holdings: Dict[str, int] = {}
        nav_records = []
        benchmark_nav_records = []
        trade_records: List[Dict] = []

        signal_map = {}
        for s in signals:
            signal_map[s.date] = s

        benchmark_prices = self._get_prices(ohlcv, benchmark_code)
        first_benchmark = True

        for d in all_dates:
            if d in signal_map:
                sig = signal_map[d]
                prices = self._get_all_prices(ohlcv, d)
                total_value = cash
                for code, shares in holdings.items():
                    p = prices.get(code, 0)
                    total_value += shares * p

                for code in list(holdings.keys()):
                    if code not in sig.target_codes:
                        p = prices.get(code, 0)
                        if p > 0 and holdings[code] > 0:
                            shares = holdings[code]
                            amount = shares * p
                            cost = amount * self.cost_rate
                            cash += amount - cost
                            trade_records.append({
                                "date": str(d),
                                "action": "sell",
                                "code": code,
                                "shares": shares,
                                "price": p,
                                "amount": round(amount, 2),
                                "cost": round(cost, 2),
                            })
                            del holdings[code]

                if sig.target_codes:
                    for code in sig.target_codes:
                        if code in holdings:
                            continue
                        p = prices.get(code, 0)
                        if p > 0:
                            alloc = total_value / len(sig.target_codes)
                            if code in holdings:
                                current_val = holdings[code] * p
                                remaining = alloc - current_val
                            else:
                                remaining = alloc
                            if remaining > 0:
                                shares = int(remaining / p / 100) * 100
                                if shares > 0:
                                    amount = shares * p
                                    cost = amount * self.cost_rate
                                    if amount + cost <= cash:
                                        cash -= amount + cost
                                        holdings[code] = shares
                                        trade_records.append({
                                            "date": str(d),
                                            "action": "buy",
                                            "code": code,
                                            "shares": shares,
                                            "price": p,
                                            "amount": round(amount, 2),
                                            "cost": round(cost, 2),
                                        })

            prices = self._get_all_prices(ohlcv, d)
            portfolio_value = cash
            for code, shares in holdings.items():
                p = prices.get(code, 0)
                portfolio_value += shares * p
            nav = portfolio_value / self.initial_cash
            nav_records.append((d, nav))

            bp = benchmark_prices.get(d)
            if bp is not None and bp > 0:
                if first_benchmark:
                    benchmark_base = bp
                    first_benchmark = False
                benchmark_nav_records.append((d, bp / benchmark_base))

        nav_series = pd.Series(
            [v for _, v in nav_records],
            index=pd.to_datetime([d for d, _ in nav_records]),
            name="nav",
        )

        if benchmark_nav_records:
            benchmark_nav_series = pd.Series(
                [v for _, v in benchmark_nav_records],
                index=pd.to_datetime([d for d, _ in benchmark_nav_records]),
                name="benchmark_nav",
            )
        else:
            benchmark_nav_series = pd.Series(dtype=float, name="benchmark_nav")

        from app.backtest.metrics import compute_metrics
        metrics = compute_metrics(
            nav_series, trades=trade_records, initial_cash=self.initial_cash
        )

        return BacktestResult(
            nav=nav_series,
            benchmark_nav=benchmark_nav_series,
            trades=trade_records,
            metrics=metrics,
        )

    def _get_prices(self, ohlcv: pd.DataFrame, code: str) -> dict:
        prices = {}
        try:
            if isinstance(ohlcv.index, pd.MultiIndex):
                sub = ohlcv.xs(code, level="code")
                for d, row in sub.iterrows():
                    prices[d] = row["close"]
            else:
                sub = ohlcv[ohlcv["code"] == code]
                for _, row in sub.iterrows():
                    prices[row["date"]] = row["close"]
        except Exception:
            pass
        return prices

    def _get_all_prices(self, ohlcv: pd.DataFrame, d) -> dict:
        prices = {}
        try:
            if isinstance(ohlcv.index, pd.MultiIndex):
                try:
                    sub = ohlcv.xs(d, level="date")
                    for code, row in sub.iterrows():
                        prices[code] = row["close"]
                except KeyError:
                    pass
            else:
                sub = ohlcv[ohlcv["date"] == d]
                for _, row in sub.iterrows():
                    prices[row["code"]] = row["close"]
        except Exception:
            pass
        return prices
