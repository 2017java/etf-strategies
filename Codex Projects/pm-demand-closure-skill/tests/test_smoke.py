from pathlib import Path


def test_project_scaffold_exists():
    root = Path(__file__).resolve().parents[1]
    assert (root / "src").exists()
    assert (root / "coze").exists()
    assert (root / "data").exists()

