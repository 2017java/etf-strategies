import logging
from datetime import date
from pathlib import Path

import pandas as pd
import tushare as ts

from app.config import TUSHARE_TOKEN, TUSHARE_API, OHLCV_DIR

_log = logging.getLogger("app.tushare_store")


class TushareStore:
    def __init__(self, root: Path = OHLCV_DIR):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        if TUSHARE_TOKEN:
            ts.set_token(TUSHARE_TOKEN)
        self.pro = ts.pro_api(TUSHARE_API) if TUSHARE_API else ts.pro_api()

    def load(self, codes: list[str], start: date, end: date) -> pd.DataFrame:
        from app.data_store import OHLCVStore
        store = OHLCVStore(root=self.root)
        return store.load(codes, start, end)

    def save(self, df: pd.DataFrame):
        from app.data_store import OHLCVStore
        store = OHLCVStore(root=self.root)
        store.save(df)

    def ensure(self, codes: list[str], start: date, end: date):
        from app.data_store import OHLCVStore
        store = OHLCVStore(root=self.root)

        for code in codes:
            path = self.root / f"{code}.parquet"
            need_fetch = True
            if path.exists():
                try:
                    df = pd.read_parquet(path)
                    if "date" in df.columns:
                        df["date"] = pd.to_datetime(df["date"]).dt.date
                        trading_days = store.get_trading_calendar(start, end)
                        covered = set(df["date"])
                        coverage = len(trading_days & covered) / max(len(trading_days), 1)
                        if coverage >= 0.95:
                            need_fetch = False
                except Exception:
                    pass

            if need_fetch:
                try:
                    ts_code = f"{code}.OF"
                    df = self.pro.fund_daily(
                        ts_code=ts_code,
                        start_date=start.strftime("%Y%m%d"),
                        end_date=end.strftime("%Y%m%d"),
                    )
                    if df is not None and not df.empty:
                        df = df.rename(columns={
                            "trade_date": "date",
                            "vol": "volume",
                        })
                        df["date"] = pd.to_datetime(df["date"]).dt.date
                        df["code"] = code
                        for col in ["open", "high", "low", "close", "volume"]:
                            if col in df.columns:
                                df[col] = pd.to_numeric(df[col], errors="coerce")
                        df = df[["date", "code", "open", "high", "low", "close", "volume"]]
                        store.save(df)
                        _log.info("fetched tushare OHLCV for %s", code)
                except Exception as e:
                    _log.warning("tushare fetch failed for %s: %s", code, e)

    def get_trading_calendar(self, start: date, end: date) -> set:
        from app.data_store import OHLCVStore
        store = OHLCVStore(root=self.root)
        return store.get_trading_calendar(start, end)
