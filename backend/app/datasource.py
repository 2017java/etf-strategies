import logging
from app.config import DATA_SOURCE

_log = logging.getLogger("app.datasource")


def create_data_store():
    source = DATA_SOURCE.lower().strip()
    _log.info("create_data_store: source=%s", source)

    if source == "tushare":
        from app.tushare_store import TushareStore
        return TushareStore()

    from app.data_store import OHLCVStore
    return OHLCVStore()
