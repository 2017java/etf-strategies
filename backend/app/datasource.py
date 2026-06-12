import os
import logging
from typing import Protocol, runtime_checkable, Iterable
from datetime import date
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

TUSHARE_TOKEN = "***REDACTED-TUSHARE-TOKEN***"
TUSHARE_API_URL = "http://101.35.233.113:8020/"

DATA_SOURCE_ENV = "ETF_DATA_SOURCE"
DEFAULT_DATA_SOURCE = "akshare"


@runtime_checkable
class OHLCVProvider(Protocol):
    def ensure(self, codes: Iterable[str], start: date, end: date) -> None: ...
    def load(self, codes: Iterable[str], start: date, end: date) -> pd.DataFrame: ...
    def get_trading_calendar(self, start: date, end: date) -> list[date]: ...


def get_data_source_name() -> str:
    name = os.environ.get(DATA_SOURCE_ENV, DEFAULT_DATA_SOURCE)
    if name not in ("akshare", "tushare", "auto"):
        logger.warning("Unknown data source '%s', fallback to '%s'", name, DEFAULT_DATA_SOURCE)
        name = DEFAULT_DATA_SOURCE
    return name


def create_data_store(source: str | None = None, root: Path | str | None = None) -> OHLCVProvider:
    source = source or get_data_source_name()
    if source == "tushare":
        from app.tushare_store import TushareStore
        return TushareStore(root=root)
    elif source == "auto":
        from app.tushare_store import TushareStore
        from app.data_store import OHLCVStore
        ts_store = TushareStore(root=root)
        try:
            ts_store._pro.index_basic(limit=1)
            logger.info("auto mode: tushare available, using tushare")
            return ts_store
        except Exception as e:
            logger.warning("auto mode: tushare unavailable (%s), fallback to akshare", e)
            return OHLCVStore(root=root)
    else:
        from app.data_store import OHLCVStore
        return OHLCVStore(root=root)


def init_tushare_pro():
    import tushare as ts
    pro = ts.pro_api(TUSHARE_TOKEN)
    pro._DataApi__http_url = TUSHARE_API_URL
    return pro
