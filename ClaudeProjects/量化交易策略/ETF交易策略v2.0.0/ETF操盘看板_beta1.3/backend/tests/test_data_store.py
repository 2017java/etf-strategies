import pandas as pd
from datetime import date
from app.data_store import OHLCVStore

def test_store_creates_root_dir(tmp_path):
    store = OHLCVStore(root=tmp_path / "ohlcv")
    assert (tmp_path / "ohlcv").exists()

def test_load_empty_returns_empty_dataframe(tmp_path):
    store = OHLCVStore(root=tmp_path / "ohlcv")
    df = store.load(["510300"], date(2024, 1, 1), date(2024, 1, 31))
    assert isinstance(df, pd.DataFrame)
    assert df.empty

def test_save_and_load_roundtrip(tmp_path):
    store = OHLCVStore(root=tmp_path / "ohlcv")
    idx = pd.MultiIndex.from_product(
        [[date(2024, 1, 2), date(2024, 1, 3)], ["510300"]],
        names=["date", "code"],
    )
    df = pd.DataFrame({
        "open": [3.5, 3.6], "high": [3.6, 3.7],
        "low": [3.4, 3.5], "close": [3.55, 3.65], "volume": [1000, 2000],
    }, index=idx)
    store.save(df)
    loaded = store.load(["510300"], date(2024, 1, 1), date(2024, 1, 31))
    assert len(loaded) == 2
    assert loaded.iloc[0]["close"] == 3.55

def test_get_trading_calendar_filters_weekends(tmp_path):
    store = OHLCVStore(root=tmp_path / "ohlcv")
    cal = store.get_trading_calendar(date(2024, 1, 1), date(2024, 1, 14))
    assert all(d.weekday() < 5 for d in cal)
    assert date(2024, 1, 1) in cal
    assert date(2024, 1, 6) not in cal
    assert date(2024, 1, 7) not in cal

def test_load_skips_corrupted_parquet(tmp_path):
    """损坏的 parquet 文件不应导致 load 崩溃。"""
    store = OHLCVStore(root=tmp_path / "ohlcv")
    (tmp_path / "ohlcv").mkdir(parents=True, exist_ok=True)
    bad = tmp_path / "ohlcv" / "510300.parquet"
    bad.write_bytes(b"this is not a valid parquet file at all")
    df = store.load(["510300"], date(2024, 1, 1), date(2024, 1, 31))
    assert df.empty
