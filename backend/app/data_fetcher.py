import akshare as ak
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from app.config import ETF_POOL, TRADE_MORNING_START, TRADE_MORNING_END, TRADE_AFTERNOON_START, TRADE_AFTERNOON_END
from app import progress
from app.data_store import OHLCVStore

_OHLCV_STORE: Optional[OHLCVStore] = None

def _get_store() -> OHLCVStore:
    global _OHLCV_STORE
    if _OHLCV_STORE is None:
        _OHLCV_STORE = OHLCVStore()
    return _OHLCV_STORE

# 盘中模式：T-1 / T-2 历史数据缓存（避免重复请求）
_t1_cache: Dict[str, dict] = {}
_t2_cache: Dict[str, dict] = {}
# 统一 sina 历史 K 线缓存（per-process, 避免同一 code 多次 HTTP）
_sina_history_cache: Dict[str, pd.DataFrame] = {}


def _fetch_sina_history(code: str, min_rows: int = 35) -> Optional[pd.DataFrame]:
    """统一入口：拉取 sina 日线历史 K 线（升序），per-process + parquet 双层缓存。

    缓存层级：
    1) per-process dict（_sina_history_cache）：避免同进程内同 code 重复 HTTP
    2) parquet 文件（OHLCVStore）：跨进程持久化，二次启动秒开

    返回 DataFrame：columns=[date, open, close, high, low, volume]，按 date 升序。
    返回 None：接口失败 / 数据不足。
    """
    if code in _sina_history_cache:
        return _sina_history_cache[code]

    # L1: 内存缓存 miss，尝试 L2: parquet 持久化缓存
    store = _get_store()
    parquet_file = store.root / f"{code}.parquet"
    df: Optional[pd.DataFrame] = None
    if parquet_file.exists():
        try:
            cached = pd.read_parquet(parquet_file)
            if not cached.empty and len(cached) >= min_rows:
                # 转为升序并确保列齐全
                cached = cached.reset_index()
                date_col = "date" if "date" in cached.columns else cached.columns[0]
                cached = cached.sort_values(date_col, ascending=True).reset_index(drop=True)
                df = cached
        except Exception:
            df = None

    if df is None:
        # L2 miss：真正调 akshare
        try:
            symbol = f"{get_exchange_prefix(code)}{code}"
            raw = ak.fund_etf_hist_sina(symbol=symbol)
            if raw is None or raw.empty:
                return None
            raw = raw.sort_values("date", ascending=True).reset_index(drop=True)
            if len(raw) < min_rows:
                return None
            df = raw
            # 落盘到 parquet（异步线程执行，避免阻塞主流程）
            try:
                parquet_df = df.copy()
                parquet_df["date"] = pd.to_datetime(parquet_df["date"]).dt.date
                parquet_df = parquet_df.set_index("date")[["open", "high", "low", "close", "volume"]]
                multi = parquet_df.copy()
                multi.index = pd.MultiIndex.from_product(
                    [parquet_df.index, [str(code)]], names=["date", "code"]
                )
                # 单进程内串行写：避免 data_store.save() 的 read-modify-write 竞态
                store.save(multi)
            except Exception:
                pass  # 落盘失败不影响内存返回
        except Exception:
            return None

    if df is None or len(df) < min_rows:
        return None
    _sina_history_cache[code] = df
    return df


def should_use_realtime_mode() -> bool:
    """判断当前是否应使用实时/今日数据模式：
    - 工作日 9:30-24:00：盘中实时 + 盘后收盘数据（分钟线已包含今日完整K线）
    - 其他时间：回退到最近收盘历史数据
    """
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    t = now.time()
    morning_start = TRADE_MORNING_START  # 09:30
    # 上午交易 或 下午13:00起（包含盘后15:00-24:00）
    if t >= morning_start:
        return True
    return False


def is_trading_time() -> bool:
    """兼容旧接口：判断是否为盘中交易时段（9:30-11:30 / 13:00-15:00）"""
    return should_use_realtime_mode() and datetime.now().time() <= TRADE_AFTERNOON_END


def is_trading_day() -> bool:
    """判断今天是否为交易日（工作日，排除节假日粗略判断）"""
    now = datetime.now()
    return now.weekday() < 5


def get_exchange_prefix(code: str) -> str:
    """根据ETF代码判断交易所前缀"""
    if code.startswith(("51", "56", "58")):
        return "sh"
    return "sz"


def fetch_realtime_minute(code: str) -> Optional[Dict]:
    """
    盘中数据源：用 stock_zh_a_minute 取今日实时分钟数据
    返回 Dict 包含：current_price, today_volume, current_change_pct, data_date, data_type
    """
    try:
        symbol = f"{get_exchange_prefix(code)}{code}"
        # 取今日1分钟K线（最多返回最近几日，sorted desc）
        df = ak.stock_zh_a_minute(symbol=symbol, period="1", adjust="qfq")
        if df is None or df.empty:
            return None

        # 最新一条就是当前实时价（数据升序排列，最新在末尾）
        latest_row = df.iloc[-1]
        current_price = float(latest_row["close"])

        # 找到今日第一条分钟K线
        today = datetime.now().strftime("%Y-%m-%d")
        today_df = df[df["day"].astype(str).str.startswith(today)].copy()

        if today_df.empty:
            return None

        # 今日开盘价（第一条分钟线的open）
        open_price = float(today_df.iloc[0]["open"])
        # 今日累计成交量（volume列可能为字符串，需转为数值类型再求和）
        today_volume = int(pd.to_numeric(today_df["volume"], errors="coerce").sum())
        # 获取昨日收盘价
        yesterday_close = _get_yesterday_close_sina(code)
        # 今日涨跌幅（相对昨日收盘价）
        if yesterday_close and yesterday_close > 0:
            current_change_pct = round((current_price - yesterday_close) / yesterday_close * 100, 2)
        else:
            current_change_pct = round((current_price - open_price) / open_price * 100, 2)

        return {
            "current_price": current_price,
            "today_volume": today_volume,
            "current_change_pct": current_change_pct,
            "data_date": today,
            "data_type": "realtime",       # 盘中实时
            "yesterday_close": yesterday_close or open_price,
        }
    except Exception as e:
        return None


def _get_t1_t2_history(code: str) -> Tuple[Optional[dict], Optional[dict]]:
    """获取T-1和T-2日历史数据（带缓存）"""
    if code in _t1_cache and code in _t2_cache:
        return _t1_cache[code], _t2_cache[code]
    hist = fetch_history_close(code, n=3)
    if hist and len(hist) >= 3:
        today = datetime.now().strftime("%Y-%m-%d")
        if hist[0]["date"] == today:
            # 收盘后：今天数据已更新
            _t1_cache[code] = hist[1]  # T-1 = 昨天
            _t2_cache[code] = hist[2]  # T-2 = 前天
        else:
            # 盘中：今天数据未更新
            _t1_cache[code] = hist[0]  # T-1 = 昨天
            _t2_cache[code] = hist[1]  # T-2 = 前天
        return _t1_cache[code], _t2_cache[code]
    return None, None


def _get_yesterday_close_sina(code: str) -> Optional[float]:
    """用新浪历史接口获取最近一条日线收盘价（昨收）"""
    df = _fetch_sina_history(code, min_rows=2)
    if df is None:
        return None
    today = datetime.now().strftime("%Y-%m-%d")
    latest_date = str(df.iloc[-1]["date"])
    # 盘中时 fund_etf_hist_sina 尚未更新今天K线，latest_date 是昨天
    if latest_date == today:
        # 收盘后：今天数据已更新，昨收在倒数第二条
        if len(df) >= 2:
            return float(df.iloc[-2]["close"])
    else:
        # 盘中：今天数据未更新，最后一条就是昨收
        return float(df.iloc[-1]["close"])
    return None


def fetch_history_close(code: str, n: int = 3) -> Optional[List[Dict]]:
    """
    非交易时段数据源：用 sina 历史接口取最近N条日线
    返回: [{date, close, volume}, ...] 按日期降序
    """
    df = _fetch_sina_history(code, min_rows=n)
    if df is None:
        return None
    rows = []
    for i in range(1, n + 1):
        rows.append({
            "date": str(df.iloc[-i]["date"]),
            "close": float(df.iloc[-i]["close"]),
            "volume": int(df.iloc[-i]["volume"]),
        })
    return rows


# 20日均价缓存
_ma20_cache: Dict[str, float] = {}

# 30日涨跌幅缓存
_change_30d_cache: Dict[str, Optional[float]] = {}


def fetch_ma20(code: str) -> Optional[float]:
    """获取20日均价（带缓存）"""
    if code in _ma20_cache:
        return _ma20_cache[code]
    try:
        symbol = f"{get_exchange_prefix(code)}{code}"
        df = ak.fund_etf_hist_sina(symbol=symbol)
        if df is None or df.empty:
            return None
        df = df.sort_values("date", ascending=False).reset_index(drop=True)
        # 取最近21条（确保有20个交易日，排除停牌日）
        if len(df) < 20:
            return None
        ma20 = round(df.iloc[:20]["close"].mean(), 4)
        _ma20_cache[code] = ma20
        return ma20
    except Exception:
        return None


def fetch_30d_change(code: str) -> Optional[float]:
    """获取过去30个交易日的涨跌幅
    返回: (当前价 - 30日前价) / 30日前价 * 100
    
    三级fallback机制:
    1) 东方财富: fund_etf_hist_em(qfq) - 尝试1次
    2) 新浪: fund_etf_hist_sina - 尝试1次
    3) akshare备选: fund_etf_hist_min_em - 尝试1次
    """
    if code in _change_30d_cache:
        return _change_30d_cache[code]
    
    # 方案1: 东方财富（前复权）
    try:
        df = ak.fund_etf_hist_em(symbol=code, period="daily", adjust="qfq")
        if df is not None and not df.empty and len(df) >= 31:
            df = df.sort_values("日期", ascending=False).reset_index(drop=True)
            price_now = float(df.iloc[0]["收盘"])
            price_30d_ago = float(df.iloc[30]["收盘"])
            if price_30d_ago > 0:
                change_30d = round((price_now - price_30d_ago) / price_30d_ago * 100, 2)
                _change_30d_cache[code] = change_30d
                return change_30d
    except Exception:
        pass
    
    # 方案2: 新浪数据源（与 sina 缓存统一入口合并后只剩 1 次 HTTP）
    try:
        df = _fetch_sina_history(code, min_rows=31)
        if df is not None:
            price_now = float(df.iloc[-1]["close"])
            price_30d_ago = float(df.iloc[-31]["close"])
            if price_30d_ago > 0:
                change_30d = round((price_now - price_30d_ago) / price_30d_ago * 100, 2)
                _change_30d_cache[code] = change_30d
                return change_30d
    except Exception:
        pass
    
    # 方案3: akshare备选
    try:
        prefix = "sh" if code.startswith(("5", "6", "1")) else "sz"
        symbol = f"{prefix}{code}"
        df = ak.fund_etf_hist_min_em(symbol=symbol, period="daily")
        if df is not None and not df.empty and len(df) >= 31:
            df = df.sort_values("date", ascending=False).reset_index(drop=True)
            price_now = float(df.iloc[0]["close"])
            price_30d_ago = float(df.iloc[30]["close"])
            if price_30d_ago > 0:
                change_30d = round((price_now - price_30d_ago) / price_30d_ago * 100, 2)
                _change_30d_cache[code] = change_30d
                return change_30d
    except Exception:
        pass
    
    # 所有方案都失败
    _change_30d_cache[code] = None
    return None


def _fetch_one_etf(category: str, etf: dict, trading: bool) -> Optional[dict]:
    """拉取单只 ETF 的全部数据；返回 dict 或 None（失败跳过）。
    进度回调：每完成一只 tick 一次，phase 标记当前阶段。
    """
    code = etf["code"]
    name = etf["name"]
    progress.tick(phase="fetching")

    if trading:
        rt_data = fetch_realtime_minute(code)
        if rt_data is None:
            return None
        t1_data, t2_data = _get_t1_t2_history(code)
        item = {
            "code": code,
            "name": name,
            "category": category,
            "current_price": rt_data["current_price"],
            "today_volume": rt_data["today_volume"],
            "current_change_pct": rt_data["current_change_pct"],
            "data_date": rt_data["data_date"],
            "data_type": rt_data["data_type"],
            "yesterday_close": rt_data["yesterday_close"],
        }
        if t2_data:
            item["t2_close"] = t2_data.get("close", rt_data["current_price"])
            item["t2_volume"] = t2_data.get("volume", rt_data["today_volume"])
        if t1_data:
            item["t1_volume"] = t1_data.get("volume", rt_data["today_volume"])
        ma20 = fetch_ma20(code)
        if ma20 is not None:
            item["ma20"] = ma20
        change_30d = fetch_30d_change(code)
        if change_30d is not None:
            item["change_30d"] = change_30d
        return item
    else:
        hist = fetch_history_close(code, n=5)
        if hist is None or len(hist) < 3:
            return None
        t0 = hist[0]
        t1 = hist[1]
        t2 = hist[2]
        current_price = t0["close"]
        yesterday_close = t1["close"]
        current_change_pct = round((current_price - yesterday_close) / yesterday_close * 100, 2)
        today_volume = t0["volume"]
        return {
            "code": code,
            "name": name,
            "category": category,
            "current_price": current_price,
            "today_volume": today_volume,
            "current_change_pct": current_change_pct,
            "data_date": t0["date"],
            "data_type": "closed",
            "yesterday_close": yesterday_close,
            "t0_close": t0["close"],
            "t1_close": t1["close"],
            "t2_close": t2["close"],
            "t0_volume": t0["volume"],
            "t1_volume": t1["volume"],
            "t2_volume": t2["volume"],
            "ma20": fetch_ma20(code),
            "change_30d": fetch_30d_change(code),
        }


def fetch_all_etf_data(max_workers: int = 15) -> Tuple[Dict[str, List[dict]], bool]:
    """
    获取全部ETF的近期数据（并发拉取）
    交易时段：盘中实时分钟线数据 + 昨收对比
    非交易时段：历史日线收盘数据
    返回: (category_data_dict, is_trading_time)
    """
    trading = should_use_realtime_mode()

    # 进度初始化：扁平化 ETF 池
    all_etfs = [(cat, etf) for cat, etfs in ETF_POOL.items() for etf in etfs]
    total = len(all_etfs)
    progress.reset(total=total)
    progress.tick(phase="starting")

    result: Dict[str, List[dict]] = {cat: [] for cat in ETF_POOL}

    def _task(cat_etf):
        cat, etf = cat_etf
        item = _fetch_one_etf(cat, etf, trading)
        return cat, item

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(_task, pair) for pair in all_etfs]
        for fut in as_completed(futures):
            try:
                cat, item = fut.result()
                if item is not None:
                    result[cat].append(item)
            except Exception:
                pass

    progress.tick(phase="done")
    progress.finish()
    _cleanup_ohlcv_cache()
    return result, trading


def _cleanup_ohlcv_cache(max_age_days: int = 7) -> None:
    """清理 ohlcv_cache/ 中超过 max_age_days 天的 parquet 文件，避免磁盘无限增长。"""
    try:
        store = _get_store()
        cutoff = datetime.now() - timedelta(days=max_age_days)
        for f in store.root.glob("*.parquet"):
            try:
                mtime = datetime.fromtimestamp(f.stat().st_mtime)
                if mtime < cutoff:
                    f.unlink()
            except Exception:
                continue
    except Exception:
        pass
