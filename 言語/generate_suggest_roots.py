#!/usr/bin/env python3
"""
lexicon.json にない語根候補を生成し、suggest.txt に追記するスクリプト。

生成規則:
- C¹V(C²)
- C² は 20% で付与
- V パターン: V, iV, Vi, uV, Vu
- 声調: V́ / V / V̀ / V̄
  ※V の位置に複合（例: V́, iV̀, V̄u）
"""

from __future__ import annotations

import argparse
import json
import random
import re
import unicodedata
from pathlib import Path
from typing import Any, Iterable, Set

C1_LIST = [
    "ゼロ子音",
    "m", "n", "p", "b", "t", "d", "k", "g", "q", "gg", "f", "v", "s", "z", "x", "gh", "hh", "h",
    "sh", "c", "ch", "j", "hm", "hn", "hr", "r", "hl", "l", "w", "y",
]

V_PATTERNS = ["V", "iV", "Vi", "uV", "Vu"]

TONES = [
    ("44", "\u0301"),  # V́
    ("24", ""),        # V
    ("22", "\u0300"),  # V̀
    ("42", "\u0304"),  # V̄
]

C2_LIST = ["m", "n", "ny", "ng", "l", "r", "y", "se", "she"]


def normalize_text(v: Any) -> str:
    if v is None:
        return ""
    return unicodedata.normalize("NFC", str(v).strip())


def split_root_field(text: str) -> Iterable[str]:
    t = normalize_text(text)
    if not t:
        return []
    parts = re.split(r"[\/／,、;\s]+", t)
    return [normalize_text(p) for p in parts if normalize_text(p)]


def load_existing_roots(lexicon_path: Path) -> Set[str]:
    data = json.loads(lexicon_path.read_text(encoding="utf-8"))
    roots: Set[str] = set()
    if isinstance(data, list):
        for row in data:
            if not isinstance(row, dict):
                continue
            for r in split_root_field(row.get("語根", "")):
                roots.add(r)
    return roots


def load_existing_suggest(suggest_path: Path) -> Set[str]:
    if not suggest_path.exists():
        return set()
    out: Set[str] = set()
    for line in suggest_path.read_text(encoding="utf-8").splitlines():
        t = normalize_text(line)
        if t:
            out.add(t)
    return out


def apply_tone(v_pattern: str, tone_mark: str) -> str:
    if "V" not in v_pattern:
        return v_pattern
    repl = "V" + tone_mark if tone_mark else "V"
    return v_pattern.replace("V", repl, 1)


def pick_c1(rng: random.Random) -> str:
    c1 = rng.choice(C1_LIST)
    return "" if c1 == "ゼロ子音" else c1


def generate_one(rng: random.Random) -> str:
    c1 = pick_c1(rng)
    v = rng.choice(V_PATTERNS)
    tone_mark = rng.choice(TONES)[1]
    v_toned = apply_tone(v, tone_mark)
    c2 = rng.choice(C2_LIST) if rng.random() < 0.2 else ""
    return normalize_text(c1 + v_toned + c2)


def main() -> int:
    base = Path(__file__).resolve().parent

    ap = argparse.ArgumentParser(description="未実装語根候補を生成して suggest.txt に追記")
    ap.add_argument("count_pos", nargs="?", type=int, help="生成して追記する件数（位置引数）")
    ap.add_argument("--count", type=int, default=None, help="生成して追記する件数（オプション）")
    ap.add_argument("--seed", type=int, default=None, help="乱数シード")
    ap.add_argument("--lexicon", default=str(base / "lexicon" / "lexicon.json"))
    ap.add_argument("--suggest", default=str(base / "suggest.txt"))
    args = ap.parse_args()

    count = args.count if args.count is not None else (args.count_pos if args.count_pos is not None else 50)

    if count <= 0:
        print("count は 1 以上にしてください。")
        return 1

    lexicon_path = Path(args.lexicon)
    suggest_path = Path(args.suggest)

    if not lexicon_path.exists():
        print(f"lexicon.json が見つかりません: {lexicon_path}")
        return 1

    existing_roots = load_existing_roots(lexicon_path)
    existing_suggest = load_existing_suggest(suggest_path)
    used = set(existing_roots) | set(existing_suggest)

    rng = random.Random(args.seed)

    new_words = []
    guard = 0
    max_attempts = max(5000, count * 500)

    while len(new_words) < count and guard < max_attempts:
        guard += 1
        cand = generate_one(rng)
        if cand in used:
            continue
        used.add(cand)
        new_words.append(cand)

    if not new_words:
        print("追加候補を生成できませんでした（語彙空間が不足している可能性があります）。")
        return 1

    existed = suggest_path.exists() and suggest_path.stat().st_size > 0
    with suggest_path.open("a", encoding="utf-8", newline="\n") as f:
        if existed:
            f.write("\n")
        f.write("\n".join(new_words))
        f.write("\n")

    print(f"追記件数: {len(new_words)}")
    print(f"出力先: {suggest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
