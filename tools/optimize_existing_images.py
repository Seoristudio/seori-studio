#!/usr/bin/env python3
"""Dry-run or replace large existing site images with smaller WebP files."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path

from image_optimizer import convert_to_webp, webp_encoder_available


DEFAULT_MIN_BYTES = 2_000_000
CONVERTIBLE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
TEXT_EXTENSIONS = {".css", ".html", ".js", ".json", ".md", ".svg", ".txt", ".xml", ".yaml", ".yml"}
SKIP_DIRECTORIES = {".git", ".playwright-mcp", "node_modules", "tools", "assets"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find and optionally optimize large existing site images.")
    parser.add_argument("--apply", action="store_true", help="Write WebP files, update references, and remove replaced files.")
    parser.add_argument(
        "--min-mb",
        type=float,
        default=2.0,
        help="Minimum source size in decimal MB. Default: 2.0.",
    )
    parser.add_argument(
        "--site-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Site root. Defaults to the parent directory of tools/.",
    )
    parser.add_argument("--list", action="store_true", help="List each eligible source file and size.")
    return parser.parse_args()


def find_candidates(site_root: Path, min_bytes: int) -> tuple[list[Path], list[Path]]:
    image_root = site_root / "assets" / "images"
    candidates = []
    conflicts = []
    for source in image_root.rglob("*"):
        if not source.is_file() or source.suffix.lower() not in CONVERTIBLE_EXTENSIONS:
            continue
        if "thumbs" in source.relative_to(image_root).parts or source.stat().st_size < min_bytes:
            continue
        target = source.with_suffix(".webp")
        if target.exists():
            conflicts.append(source)
        else:
            candidates.append(source)
    candidates.sort(key=lambda path: path.as_posix().casefold())
    conflicts.sort(key=lambda path: path.as_posix().casefold())
    return candidates, conflicts


def replace_json_paths(value: object, replacements: dict[str, str]) -> tuple[object, int]:
    if isinstance(value, str):
        new_value = replacements.get(value, value)
        return new_value, int(new_value != value)
    if isinstance(value, list):
        updated = []
        count = 0
        for item in value:
            new_item, item_count = replace_json_paths(item, replacements)
            updated.append(new_item)
            count += item_count
        return updated, count
    if isinstance(value, dict):
        updated = {}
        count = 0
        for key, item in value.items():
            new_item, item_count = replace_json_paths(item, replacements)
            updated[key] = new_item
            count += item_count
        return updated, count
    return value, 0


def iter_site_text_files(site_root: Path):
    for current, directories, filenames in os.walk(site_root):
        current_path = Path(current)
        relative_dir = current_path.relative_to(site_root)
        if relative_dir.parts and relative_dir.parts[0] in SKIP_DIRECTORIES:
            directories[:] = []
            continue
        directories[:] = [name for name in directories if name not in SKIP_DIRECTORIES and not name.startswith(".")]
        for filename in filenames:
            path = current_path / filename
            if path.suffix.lower() in TEXT_EXTENSIONS:
                yield path


def prepare_text_updates(site_root: Path, replacements: dict[str, str]) -> dict[Path, str]:
    updates: dict[Path, str] = {}
    for path in iter_site_text_files(site_root):
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        if path.suffix.lower() == ".json":
            data = json.loads(text)
            updated_data, count = replace_json_paths(data, replacements)
            if count:
                updates[path] = json.dumps(updated_data, ensure_ascii=False, indent=2) + "\n"
        else:
            updated = text
            for old_path, new_path in replacements.items():
                updated = updated.replace(old_path, new_path)
            if updated != text:
                updates[path] = updated

    cache_key = f"{dt.date.today():%Y%m%d}-image-optimization"
    works_json = site_root / "data" / "works.json"
    script_path = site_root / "script.js"
    if works_json in updates and script_path.exists():
        script = updates.get(script_path, script_path.read_text(encoding="utf-8"))
        script = re.sub(r'data/works\.json\?v=[^"\']+', f"data/works.json?v={cache_key}", script, count=1)
        updates[script_path] = script

    changed_script = script_path in updates
    changed_styles = site_root / "styles.css" in updates
    if changed_script or changed_styles:
        html_paths = [path for path in iter_site_text_files(site_root) if path.suffix.lower() == ".html"]
        for html_path in html_paths:
            html = updates.get(html_path)
            if html is None:
                html = html_path.read_text(encoding="utf-8")
            new_html = html
            if changed_script:
                new_html = re.sub(
                    r'((?:\.\./)*)script\.js\?v=[A-Za-z0-9_.-]+',
                    rf"\g<1>script.js?v={cache_key}",
                    new_html,
                )
            if changed_styles:
                new_html = re.sub(
                    r'((?:\.\./)*)styles\.css\?v=[A-Za-z0-9_.-]+',
                    rf"\g<1>styles.css?v={cache_key}",
                    new_html,
                )
            if new_html != html:
                updates[html_path] = new_html
    return updates


def main() -> int:
    args = parse_args()
    site_root = args.site_root.resolve()
    if not site_root.is_dir():
        raise SystemExit(f"Site root not found: {site_root}")
    if args.min_mb <= 0:
        raise SystemExit("--min-mb must be greater than zero.")
    if not webp_encoder_available():
        raise SystemExit("FFmpeg with the libwebp encoder is required.")

    min_bytes = int(args.min_mb * 1_000_000)
    candidates, conflicts = find_candidates(site_root, min_bytes)
    input_bytes = sum(path.stat().st_size for path in candidates)
    print(f"{'APPLY' if args.apply else 'DRY RUN'}: {site_root}")
    print(f"Eligible sources: {len(candidates)} files, {input_bytes / 1_000_000:.1f} MB total (minimum {args.min_mb:g} MB)")
    if conflicts:
        print(f"Skipped because a same-name WebP already exists: {len(conflicts)}")
    if args.list:
        for path in candidates:
            print(f"  {path.relative_to(site_root).as_posix()} ({path.stat().st_size / 1_000_000:.2f} MB)")
    if not candidates:
        return 0
    if not args.apply:
        print("No site files changed. Add --list to inspect candidates; use --apply only after approval.")
        return 0

    with tempfile.TemporaryDirectory(prefix="seori-existing-webp-") as temp_dir:
        temp_root = Path(temp_dir)
        converted: list[tuple[Path, Path, Path, int, int]] = []
        skipped_larger = 0
        for source in candidates:
            relative = source.relative_to(site_root)
            staged = temp_root / relative.with_suffix(".webp")
            convert_to_webp(source, staged)
            before = source.stat().st_size
            after = staged.stat().st_size
            if after >= before:
                skipped_larger += 1
                continue
            converted.append((source, source.with_suffix(".webp"), staged, before, after))

        replacements = {
            source.relative_to(site_root).as_posix(): target.relative_to(site_root).as_posix()
            for source, target, _, _, _ in converted
        }
        text_updates = prepare_text_updates(site_root, replacements)

        for _, target, staged, _, _ in converted:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(staged, target)
        for path, text in text_updates.items():
            path.write_text(text, encoding="utf-8")
        for source, _, _, _, _ in converted:
            source.unlink()

    saved = sum(before - after for _, _, _, before, after in converted)
    print(f"Converted: {len(converted)} files; saved {saved / 1_000_000:.1f} MB.")
    print(f"Updated references in {len(text_updates)} site files.")
    if skipped_larger:
        print(f"Kept {skipped_larger} source files because WebP was not smaller.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
