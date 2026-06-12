from app.strategies.base import Strategy, RebalanceSignal
import inspect

def test_rebalance_signal_dataclass_fields():
    sig = inspect.signature(RebalanceSignal)
    fields = {p.name for p in sig.parameters.values()}
    assert fields == {"date", "target_codes", "reason", "scores"}

def test_strategy_is_protocol():
    assert hasattr(Strategy, "generate_signals")
    assert hasattr(Strategy, "name")
