"""OHLCV parquet 缓存模块。
注意：save() 是 read-modify-write 模式，**单进程写**才安全，多 worker 并发写同一 code 会丢数据。
"""
import pandas as pd
from pathlib import Path
from datetime import date, timedelta
from typing import Iterable
import logging

logger = logging.getLogger(__name__)

class OHLCVStore:
    """按 code 分文件的 parquet 缓存，交易日历粗略过滤（剔除周末）。"""

    def __init__(self, root: Path | str | None = None):
        if root is None:
            root = Path(__file__).resolve().parent.parent / "data" / "ohlcv"
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _file(self, code: str) -> Path:
        return self.root / f"{code}.parquet"

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
        for code in codes:
            logger.info("ensure() placeholder for %s", code)
