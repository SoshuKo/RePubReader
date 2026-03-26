#!/usr/bin/env python3
"""
Sheet1 (カラバル語単語.xlsm) の語彙を lexicon/lexicon.json にマージするスクリプト。
- 既存にない語のみを追記
- 依存ライブラリ不要（標準ライブラリのみ）

使い方:
  python sync_lexicon_from_xlsm.py
  python sync_lexicon_from_xlsm.py --xlsm "C:/path/to/カラバル語単語.xlsm" --json "C:/path/to/lexicon.json"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Tuple, Any

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL_OFFICE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_REL_PKG = "http://schemas.openxmlformats.org/package/2006/relationships"

NS = {"m": NS_MAIN, "r": NS_REL_OFFICE}

TARGET_KEYS = [
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

# xlsmヘッダー（表記ゆれ） -> 出力JSONキー
HEADER_ALIASES = {
    "日本語": "日本語",
    "カラバル語": "カラバル語",
    "IPA": "IPA",
    "アラビア文字": "アラビア文字",
    "アラビア文字モジ": "アラビア文字",
    "語根": "語根",
    "語根+接辞": "語根+接辞",
    "同音異義語説明": "同音異義語説明",
    "同音異義語+接辞": "同音異義語+接辞",
    "補足": "補足",
    "補足ホソク": "補足",
}


def col_to_num(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n


def maybe_number(text: str) -> Any:
    t = text.strip()
    if not t:
        return ""
    if re.fullmatch(r"[-+]?\d+", t):
        try:
            return int(t)
        except ValueError:
            return t
    if re.fullmatch(r"[-+]?\d+\.0+", t):
        try:
            return int(float(t))
        except ValueError:
            return t
    return t


def normalize_key(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def entry_identity(entry: Dict[str, Any]) -> Tuple[str, str, str]:
    # 重複判定キー: 日本語 + カラバル語 + IPA
    return (
        normalize_key(entry.get("日本語")),
        normalize_key(entry.get("カラバル語")),
        normalize_key(entry.get("IPA")),
    )


def get_sheet1_xml_path(z: zipfile.ZipFile) -> str:
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rel = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))

    relmap = {
        r.attrib["Id"]: r.attrib["Target"]
        for r in rel.findall(f"{{{NS_REL_PKG}}}Relationship")
    }

    first_sheet = wb.find("m:sheets/m:sheet", NS)
    if first_sheet is None:
        raise RuntimeError("workbook.xml にシート情報がありません。")

    rid = first_sheet.attrib.get(f"{{{NS_REL_OFFICE}}}id")
    if not rid or rid not in relmap:
        raise RuntimeError("Sheet1 のリレーション参照を解決できません。")

    target = relmap[rid].lstrip("/")
    if not target.startswith("xl/"):
        target = "xl/" + target
    return target


def load_shared_strings(z: zipfile.ZipFile) -> List[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []

    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out: List[str] = []
    for si in root.findall("m:si", NS):
        text = "".join(t.text or "" for t in si.findall(".//m:t", NS))
        out.append(text)
    return out


def cell_text(cell: ET.Element, shared_strings: List[str]) -> str:
    t = cell.attrib.get("t")

    if t == "inlineStr":
        node = cell.find("m:is/m:t", NS)
        return (node.text or "") if node is not None else ""

    v = cell.find("m:v", NS)
    if v is None:
        return ""

    raw = v.text or ""
    if t == "s":
        if not raw:
            return ""
        idx = int(raw)
        return shared_strings[idx] if 0 <= idx < len(shared_strings) else ""

    return raw


def load_sheet1_rows(xlsm_path: Path) -> List[Dict[str, Any]]:
    with zipfile.ZipFile(xlsm_path) as z:
        sheet_xml = get_sheet1_xml_path(z)
        sst = load_shared_strings(z)
        root = ET.fromstring(z.read(sheet_xml))

    rows = root.findall("m:sheetData/m:row", NS)
    if not rows:
        return []

    # ヘッダー行
    header_row = rows[0]
    col_header: Dict[int, str] = {}
    for c in header_row.findall("m:c", NS):
        ref = c.attrib.get("r", "A1")
        col = "".join(ch for ch in ref if ch.isalpha())
        idx = col_to_num(col)
        raw_h = cell_text(c, sst).strip()
        if not raw_h:
            continue
        mapped = HEADER_ALIASES.get(raw_h, raw_h)
        col_header[idx] = mapped

    data_rows: List[Dict[str, Any]] = []
    for r in rows[1:]:
        entry: Dict[str, Any] = {k: "" for k in TARGET_KEYS}

        for c in r.findall("m:c", NS):
            ref = c.attrib.get("r", "A1")
            col = "".join(ch for ch in ref if ch.isalpha())
            idx = col_to_num(col)
            key = col_header.get(idx)
            if key not in TARGET_KEYS:
                continue

            raw_val = cell_text(c, sst)
            raw_val = raw_val.strip()
            if not raw_val:
                entry[key] = ""
            else:
                entry[key] = maybe_number(raw_val)

        # 全項目が空の行はスキップ
        if any(normalize_key(entry[k]) for k in TARGET_KEYS):
            # 空文字は null にしたい項目だけ変換
            for nullable in ["同音異義語説明", "同音異義語+接辞", "補足"]:
                if normalize_key(entry.get(nullable)) == "":
                    entry[nullable] = None
            data_rows.append(entry)

    return data_rows


def main() -> int:
    base_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(description="xlsm Sheet1 の未実装語を lexicon.json に追記")
    parser.add_argument("--xlsm", default=str(base_dir / "カラバル語単語.xlsm"))
    parser.add_argument("--json", dest="json_path", default=str(base_dir / "lexicon" / "lexicon.json"))
    parser.add_argument("--dry-run", action="store_true", help="書き込みせず差分件数のみ表示")
    args = parser.parse_args()

    xlsm_path = Path(args.xlsm)
    json_path = Path(args.json_path)

    if not xlsm_path.exists():
        print(f"[ERROR] xlsm が見つかりません: {xlsm_path}")
        return 1
    if not json_path.exists():
        print(f"[ERROR] lexicon.json が見つかりません: {json_path}")
        return 1

    try:
        current = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[ERROR] lexicon.json の読み込みに失敗: {e}")
        return 1

    if not isinstance(current, list):
        print("[ERROR] lexicon.json は配列形式を想定しています。")
        return 1

    excel_rows = load_sheet1_rows(xlsm_path)

    existing_ids = {entry_identity(e) for e in current if isinstance(e, dict)}
    new_entries: List[Dict[str, Any]] = []

    for row in excel_rows:
        ident = entry_identity(row)
        if ident in existing_ids:
            continue
        # 最低限、日本語 or カラバル語 があるものだけ対象
        if not normalize_key(row.get("日本語")) and not normalize_key(row.get("カラバル語")):
            continue
        new_entries.append(row)
        existing_ids.add(ident)

    print(f"既存件数: {len(current)}")
    print(f"Sheet1件数: {len(excel_rows)}")
    print(f"追加対象: {len(new_entries)}")

    if new_entries:
        preview = new_entries[:5]
        for i, e in enumerate(preview, 1):
            print(("  %d. %s / %s" % (i, e.get("日本語"), e.get("カラバル語"))).encode("cp932", "replace").decode("cp932"))
        if len(new_entries) > 5:
            print(f"  ... and {len(new_entries)-5} more")

    if args.dry_run:
        print("[DRY-RUN] 書き込みは行っていません。")
        return 0

    if not new_entries:
        print("差分がないため更新しませんでした。")
        return 0

    merged = current + new_entries
    json_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"更新完了: {json_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

