from dataclasses import dataclass, field
from typing import Dict, List
from abc import ABC, abstractmethod


@dataclass
class RebalanceSignal:
    date: object
    target_codes: List[str]
    reason: str = ""
    scores: Dict[str, float] = field(default_factory=dict)


class Strategy(ABC):
    name: str = ""

    @abstractmethod
    def generate_signals(self, ohlcv, calendar: list) -> List[RebalanceSignal]:
        ...
