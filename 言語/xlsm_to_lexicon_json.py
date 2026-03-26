#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    base = Path(__file__).resolve().parent
    xlsm_path = base / "カラバル語単語.xlsm"
    out_path = base / "lexicon" / "lexicon.json"

    if not xlsm_path.exists():
        print(f"[ERROR] xlsm not found: {xlsm_path}")
        return 1

    sys.path.insert(0, str(base))
    import sync_lexicon_from_xlsm as conv

    rows = conv.load_sheet1_rows(xlsm_path)

    keys = [
        "日本語",
        "カラバル語",
        "IPA",
        "アラビア文字",
        "語根",
        "語根+接辞",
        "同音異義語説明",
        "同音異義語+接辞",
        "補足",
    ]

    normalized = []
    for r in rows:
        item = {k: r.get(k) for k in keys}
        normalized.append(item)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"written: {out_path}")
    print(f"rows: {len(normalized)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
