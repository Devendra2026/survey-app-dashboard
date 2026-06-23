#!/usr/bin/env python3
"""Remove generated_schema.jsonl sidecars from a Convex snapshot ZIP.

Self-hosted backends may fail with:
  cannot parse <table>/generated_schema.jsonl: unexpected token at 'uniform'

Documents import fine without these sidecar files.
"""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path


def strip_zip(src: Path, dst: Path) -> None:
    removed = 0
    kept = 0
    with zipfile.ZipFile(src, "r") as zin, zipfile.ZipFile(dst, "w") as zout:
        for info in zin.infolist():
            if info.filename.endswith("generated_schema.jsonl"):
                removed += 1
                continue
            data = zin.read(info.filename)
            zout.writestr(info, data, compress_type=info.compress_type)
            kept += 1
            if kept % 1000 == 0:
                print(f"  copied {kept} entries...", flush=True)
    print(f"Removed {removed} generated_schema.jsonl files; kept {kept} entries.")
    print(f"Wrote {dst} ({dst.stat().st_size / (1024**2):.1f} MB)")


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "survey-backup.zip"
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "survey-backup-import.zip"
    if not src.is_file():
        raise SystemExit(f"Source ZIP not found: {src}")
    print(f"Reading {src}")
    strip_zip(src, dst)


if __name__ == "__main__":
    main()
