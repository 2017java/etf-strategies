"""后台数据加载进度跟踪器（per-process, thread-safe）

用法：
    from app import progress
    progress.reset(total=43)
    progress.tick(phase="fetching")
    snapshot = progress.snapshot()  # → {done, total, phase, started_at, elapsed_sec}
"""
import time
from threading import Lock

_state = {
    "done": 0,
    "total": 0,
    "phase": "idle",
    "started_at": None,
    "finished_at": None,
}
_lock = Lock()


def reset(total: int = 0) -> None:
    with _lock:
        _state["done"] = 0
        _state["total"] = total
        _state["phase"] = "init"
        _state["started_at"] = time.time()
        _state["finished_at"] = None


def tick(amount: int = 1, phase: str | None = None) -> None:
    """累加进度。amount=0 时只更新 phase 不增加计数（用于阶段标记）"""
    with _lock:
        if amount > 0:
            _state["done"] += amount
        if phase is not None:
            _state["phase"] = phase


def set_phase(phase: str) -> None:
    """仅更新 phase 标记，不修改计数"""
    with _lock:
        _state["phase"] = phase


def finish() -> None:
    with _lock:
        _state["finished_at"] = time.time()


def snapshot() -> dict:
    with _lock:
        snap = dict(_state)
    if snap["started_at"] is not None:
        snap["elapsed_sec"] = round(time.time() - snap["started_at"], 1)
    else:
        snap["elapsed_sec"] = 0
    return snap
