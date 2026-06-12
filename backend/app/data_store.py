import logging
from datetime import date, timedelta
from pathlib import Path

import akshare as ak
import pandas as pd

from app.config import OHLCV_DIR

_log = logging.getLogger("app.data_store")


class OHLCVStore:
    def __init__(self, root: Path = OHLCV_DIR):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def load(self, codes: list[str], start: date, end: date) -> pd.DataFrame:
        frames = []
        for code in codes:
            path = self.root / f"{code}.parquet"
            if not path.exists():
                continue
            try:
                df = pd.read_parquet(path)
            except Exception:
                _log.warning("corrupted parquet for %s, skipping", code)
                continue
            if "code" not in df.columns and df.index.name == "code":
                df = df.reset_index()
            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"]).dt.date
                df = df[(df["date"] >= start) & (df["date"] <= end)]
            if "code" not in df.columns:
                df["code"] = code
            frames.append(df)

        if not frames:
            return pd.DataFrame(
                columns=["date", "code", "open", "high", "low", "close", "volume"]
            ).set_index(["date", "code"])

        result = pd.concat(frames, ignore_index=True)
        result = result.set_index(["date", "code"]).sort_index()
        return result

    def save(self, df: pd.DataFrame):
        if df.empty:
            return
        if isinstance(df.index, pd.MultiIndex):
            df = df.reset_index()
        if "code" not in df.columns:
            return
        for code, group in df.groupby("code"):
            group = group.drop(columns=["code"]).reset_index(drop=True)
            path = self.root / f"{code}.parquet"
            if path.exists():
                try:
                    existing = pd.read_parquet(path)
                    if "date" in existing.columns and "date" in group.columns:
                        existing["date"] = pd.to_datetime(existing["date"])
                        group["date"] = pd.to_datetime(group["date"])
                        merged = pd.concat([existing, group]).drop_duplicates(
                            subset=["date"], keep="last"
                        ).sort_values("date").reset_index(drop=True)
                        merged.to_parquet(path, index=False)
                        continue
                except Exception:
                    pass
            group.to_parquet(path, index=False)

    def ensure(self, codes: list[str], start: date, end: date):
        for code in codes:
            path = self.root / f"{code}.parquet"
            need_fetch = True
            if path.exists():
                try:
                    df = pd.read_parquet(path)
                    if "date" in df.columns:
                        df["date"] = pd.to_datetime(df["date"]).dt.date
                        trading_days = self.get_trading_calendar(start, end)
                        covered = set(df["date"])
                        coverage = len(trading_days & covered) / max(len(trading_days), 1)
                        if coverage >= 0.95:
                            need_fetch = False
                except Exception:
                    pass

            if need_fetch:
                try:
                    raw = ak.fund_etf_hist_sina(symbol=code)
                    if raw is not None and not raw.empty:
                        raw["code"] = code
                        if "date" in raw.columns:
                            raw["date"] = pd.to_datetime(raw["date"]).dt.date
                        self.save(raw)
                        _log.info("fetched and cached OHLCV for %s", code)
                except Exception as e:
                    _log.warning("failed to fetch OHLCV for %s: %s", code, e)

    def get_trading_calendar(self, start: date, end: date) -> set:
        days = set()
        current = start
        while current <= end:
            if current.weekday() < 5:
                days.add(current)
            current += timedelta(days=1)
        return days
