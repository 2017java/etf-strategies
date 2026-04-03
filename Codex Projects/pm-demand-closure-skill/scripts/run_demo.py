from __future__ import annotations

import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.pipeline import run_pipeline_from_file
from src.render import render_bundle_markdown


def main() -> None:
    case_file = ROOT / "data" / "cases" / "new_energy_finance_case.json"
    out_json = ROOT / "docs" / "demo" / "output_bundle.json"
    out_md = ROOT / "docs" / "demo" / "output_bundle.md"

    result = run_pipeline_from_file(case_file)
    out_json.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    out_md.write_text(render_bundle_markdown(result), encoding="utf-8")

    print(f"[OK] Wrote JSON bundle: {out_json}")
    print(f"[OK] Wrote Markdown bundle: {out_md}")


if __name__ == "__main__":
    main()
