import pandas as pd
from pathlib import Path
from datetime import date, timedelta
from typing import Iterable
import logging

from app.datasource import init_tushare_pro

logger = logging.getLogger(__name__)


def _code_to_tushare(code: str) -> str:
    if code.startswith(("51", "56", "58")):
        return f"{code}.SH"
    return f"{code}.SZ"


def _tushare_to_code(ts_code: str) -> str:
    return ts_code.split(".")[0]


class TushareStore:
    def __init__(self, root: Path | str | None = None):
        if root is None:
            root = Path(__file__).resolve().parent.parent / "data" / "ohlcv"
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self._pro = init_tushare_pro()

    def _file(self, code: str) -> Path:
        return self.root / f"{code}.parquet"

    def _fetch_from_tushare(self, code: str, start: date, end: date) -> pd.DataFrame | None:
        ts_code = _code_to_tushare(code)
        start_str = start.strftime("%Y%m%d")
        end_str = end.strftime("%Y%m%d")
        try:
            df = self._pro.fund_daily(
                ts_code=ts_code,
                start_date=start_str,
                end_date=end_str,
            )
        except Exception as e:
            logger.warning("tushare fund_daily failed for %s: %s", ts_code, e)
            try:
                import tushare as ts
                df = ts.pro_bar(
                    api=self._pro,
                    ts_code=ts_code,
                    asset="FD",
                    start_date=start_str,
                    end_date=end_str,
                )
            except Exception as e2:
                logger.warning("tushare pro_bar also failed for %s: %s", ts_code, e2)
                return None
        if df is None or df.empty:
            return None
        df = df.rename(columns={
            "trade_date": "date",
            "vol": "volume",
        })
        df["date"] = pd.to_datetime(df["date"]).dt.date
        df = df[(df["date"] >= start) & (df["date"] <= end)]
        df = df[["date", "open", "high", "low", "close", "volume"]]
        df = df.sort_values("date").drop_duplicates(subset="date", keep="last")
        return df

    def save(self, df: pd.DataFrame) -> None:
        if df.empty:
            return
        for code, sub in df.groupby(level="code"):
            sub = sub.droplevel("code").sort_index()
            f = self._file(str(code))
            if f.exists():
                old = pd.read_parquet(f)
                merged = pd.concat([old, sub])
                merged = merged[~merged.index.duplicated(keep="last")].sort_index()
                merged.to_parquet(f)
            else:
                sub.to_parquet(f)

    def load(self, codes: Iterable[str], start: date, end: date) -> pd.DataFrame:
        frames = []
        for code in codes:
            f = self._file(str(code))
            if not f.exists():
                continue
            try:
                sub = pd.read_parquet(f)
            except Exception as e:
                logger.warning("load() skip corrupted %s: %s", code, e)
                continue
            sub.index = pd.to_datetime(sub.index).date
            sub = sub.loc[(sub.index >= start) & (sub.index <= end)]
            if sub.empty:
                continue
            sub.index = pd.MultiIndex.from_product(
                [sub.index, [str(code)]], names=["date", "code"]
            )
            frames.append(sub)
        if not frames:
            idx = pd.MultiIndex.from_arrays([[], []], names=["date", "code"])
            return pd.DataFrame(columns=["open", "high", "low", "close", "volume"], index=idx)
        return pd.concat(frames).sort_index()

    def get_trading_calendar(self, start: date, end: date) -> list[date]:
        days = []
        d = start
        while d <= end:
            if d.weekday() < 5:
                days.append(d)
            d += timedelta(days=1)
        return days

    def ensure(self, codes: Iterable[str], start: date, end: date) -> None:
        trading_days = set(self.get_trading_calendar(start, end))
        for code in codes:
            f = self._file(str(code))
            if f.exists():
                existing = pd.read_parquet(f)
                existing.index = pd.to_datetime(existing.index).date
                cached_trading = trading_days & set(existing.index)
                if len(cached_trading) >= len(trading_days) * 0.95:
                    continue
            df = self._fetch_from_tushare(code, start, end)
            if df is None or df.empty:
                continue
            df = df.set_index("date")[["open", "high", "low", "close", "volume"]]
            multi = df.copy()
            multi.index = pd.MultiIndex.from_product(
                [df.index, [str(code)]], names=["date", "code"]
            )
            self.save(multi)
