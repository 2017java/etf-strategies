from dataclasses import dataclass, field
from datetime import date
from typing import Protocol, runtime_checkable, Literal

@dataclass
class RebalanceSignal:
    date: date
    target_codes: list[str]
    reason: str
    scores: dict[str, float] = field(default_factory=dict)

@runtime_checkable
class Strategy(Protocol):
    name: str = ""
    rebalance_freq: Literal["daily", "weekly", "monthly"]

    def generate_signals(
        self, ohlcv: "pd.DataFrame", calendar: list[date]
    ) -> list[RebalanceSignal]: ...
