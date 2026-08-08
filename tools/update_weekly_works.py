#!/usr/bin/env python3
"""Semi-automatic weekly Works updater for seori.studio.

Default mode is a dry run. Add --apply to copy assets, generate thumbnails,
update data/works.json, and bump the Works JSON cache key in script.js.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import zipfile
from pathlib import Path


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
DEFAULT_YEAR = 2026
THUMBNAIL_MAX_SIZE = 1400
WORKS_JSON_CACHE_LABEL = "weekly-works-auto"
TITLE_SMALL_WORDS = {"a", "an", "and", "as", "at", "by", "en", "for", "from", "in", "of", "on", "or", "the", "to", "with"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare weekly Works collections from ZIP files.")
    parser.add_argument("manifest", type=Path, help="Path to the weekly works manifest JSON.")
    parser.add_argument("--apply", action="store_true", help="Write files and update site data. Omit for dry run.")
    parser.add_argument(
        "--site-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Site root. Defaults to the parent directory of tools/.",
    )
    return parser.parse_args()


def normalize_display_title(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip()
    if "—" not in value and "," in value:
        value = re.sub(r"\s*,\s*", " — ", value, count=1)
    return value


def smart_title_case(value: str) -> str:
    value = normalize_display_title(value)
    parts = re.split(r"(\s+—\s+)", value)
    return "".join(_title_case_part(part) if "—" not in part else part for part in parts)


def _title_case_part(value: str) -> str:
    words = value.split()
    titled = []
    for index, word in enumerate(words):
        if not word:
            continue
        titled.append(_title_case_word(word, index, len(words)))
    return " ".join(titled)


def _title_case_word(word: str, index: int, total: int) -> str:
    if "-" in word:
        segments = word.split("-")
        return "-".join(_title_case_hyphen_segment(segment, part_index) for part_index, segment in enumerate(segments))
    if "'" in word or "’" in word:
        return _title_case_apostrophe_word(word, index, total)
    lowered = word.lower()
    if 0 < index < total - 1 and lowered in TITLE_SMALL_WORDS:
        return lowered
    return word[:1].upper() + word[1:].lower()


def _title_case_hyphen_segment(segment: str, part_index: int) -> str:
    lowered = segment.lower()
    if part_index > 0 and lowered in TITLE_SMALL_WORDS:
        return lowered
    return segment[:1].upper() + segment[1:].lower()


def _title_case_apostrophe_word(word: str, index: int, total: int) -> str:
    mark = "’" if "’" in word else "'"
    segments = word.split(mark)
    titled = []
    for part_index, segment in enumerate(segments):
        lowered = segment.lower()
        if not segment:
            titled.append(segment)
        elif part_index == 0 and lowered in {"d", "l"}:
            titled.append(lowered)
        elif part_index > 0 and lowered in {"s", "t", "re", "ve", "ll", "d", "m"}:
            titled.append(lowered)
        elif 0 < index < total - 1 and part_index == 0 and lowered in TITLE_SMALL_WORDS:
            titled.append(lowered)
        else:
            titled.append(segment[:1].upper() + segment[1:].lower())
    return mark.join(titled)


def slugify(value: str) -> str:
    normalized = value.lower().replace("—", "-").replace("–", "-").replace("&", " and ")
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return re.sub(r"-+", "-", normalized).strip("-")


def leading_number(path: Path) -> tuple[int, str]:
    match = re.match(r"\s*(\d+)", path.name)
    return (int(match.group(1)) if match else 9999, path.name.casefold())


def load_manifest(path: Path) -> dict:
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"Manifest not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Manifest JSON is invalid: {exc}") from exc
    if not isinstance(manifest.get("items"), list) or not manifest["items"]:
        raise SystemExit("Manifest must contain a non-empty 'items' array.")
    return manifest


def extract_images(zip_path: Path, temp_root: Path) -> list[Path]:
    if not zip_path.exists():
        raise SystemExit(f"ZIP not found: {zip_path}")
    extract_dir = temp_root / zip_path.stem
    with zipfile.ZipFile(zip_path) as archive:
        archive.extractall(extract_dir)
    images = [
        p
        for p in extract_dir.rglob("*")
        if p.is_file()
        and p.suffix.lower() in IMAGE_EXTENSIONS
        and not p.name.startswith("._")
        and "__MACOSX" not in p.parts
    ]
    images.sort(key=leading_number)
    if not images:
        raise SystemExit(f"No image files found in ZIP: {zip_path}")
    return images


def sips_available() -> bool:
    return shutil.which("sips") is not None


def make_thumbnail(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["sips", "-s", "format", "jpeg", "-Z", str(THUMBNAIL_MAX_SIZE), str(source), "--out", str(target)],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"sips failed for {source}: {result.stderr.strip() or result.stdout.strip()}")


def build_collection(item: dict, year: int, temp_root: Path, site_root: Path, apply: bool) -> tuple[dict, list[str]]:
    raw_title = item.get("title")
    zip_value = item.get("zip")
    if not raw_title or not zip_value:
        raise SystemExit("Each item needs 'title' and 'zip'.")

    title = smart_title_case(raw_title)
    collection_id = item.get("id") or slugify(title)
    short_title = item.get("shortTitle") or title.split("—", 1)[0].strip()
    short_title = smart_title_case(short_title)
    prefix = item.get("prefix") or slugify(short_title)

    images = extract_images(Path(zip_value).expanduser(), temp_root)
    originals_dir = site_root / "assets" / "images" / collection_id
    thumbs_dir = site_root / "assets" / "images" / "thumbs" / collection_id
    operations = [f"{title}: {len(images)} images -> {collection_id}"]

    image_entries = []
    for index, source in enumerate(images, start=1):
        ext = ".jpg" if source.suffix.lower() == ".jpeg" else source.suffix.lower()
        original_target = originals_dir / f"{prefix}-{index:02d}{ext}"
        thumb_target = thumbs_dir / f"{prefix}-{index:02d}.jpg"
        rel_original = original_target.relative_to(site_root).as_posix()
        image_entries.append(
            {
                "path": rel_original,
                "title": f"{short_title} #{index}, {year}",
                "alt": f"{title} artwork {index} from the Confetti Life project.",
            }
        )
        operations.append(f"  copy {source.name} -> {rel_original}")
        operations.append(f"  thumb -> {thumb_target.relative_to(site_root).as_posix()}")
        if apply:
            original_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, original_target)
            if sips_available():
                make_thumbnail(original_target, thumb_target)
            else:
                operations.append("  warning: sips not found; thumbnail skipped")

    collection = {
        "id": collection_id,
        "title": title,
        "description": f"{short_title} works from the Confetti Life project.",
        "cover": {
            "path": image_entries[0]["path"],
            "title": title,
            "alt": f"{title} cover artwork from the Confetti Life project.",
        },
        "images": image_entries,
    }
    return collection, operations


def update_works_json(site_root: Path, collections: list[dict], apply: bool) -> list[str]:
    path = site_root / "data" / "works.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    new_ids = {collection["id"] for collection in collections}
    filtered = [collection for collection in data if collection.get("id") not in new_ids]
    updated = collections + filtered
    operations = [f"data/works.json: prepend {len(collections)} collections, remove duplicates by id if present"]
    if apply:
        path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return operations


def bump_script_cache(site_root: Path, apply: bool) -> list[str]:
    cache_key = f"{dt.date.today():%Y%m%d}-{WORKS_JSON_CACHE_LABEL}"
    script_path = site_root / "script.js"
    text = script_path.read_text(encoding="utf-8")
    updated, count = re.subn(r'data/works\.json\?v=[^"]+', f"data/works.json?v={cache_key}", text, count=1)
    if count != 1:
        raise SystemExit("Could not find the data/works.json cache key in script.js.")
    operations = [f"script.js: bump Works JSON cache key to {cache_key}"]
    if apply:
        script_path.write_text(updated, encoding="utf-8")

    for html_name in ("index.html", "works.html", "about.html"):
        html_path = site_root / html_name
        html = html_path.read_text(encoding="utf-8")
        html_updated, html_count = re.subn(
            r'script\.js\?v=[A-Za-z0-9_.-]+',
            f"script.js?v={cache_key}",
            html,
        )
        if html_count != 1:
            raise SystemExit(f"Could not find the script.js cache key in {html_name}.")
        if apply:
            html_path.write_text(html_updated, encoding="utf-8")
        operations.append(f"{html_name}: bump script.js cache key to {cache_key}")
    return operations


def main() -> int:
    args = parse_args()
    site_root = args.site_root.resolve()
    manifest = load_manifest(args.manifest)
    year = int(manifest.get("year", DEFAULT_YEAR))
    reverse = manifest.get("displayOrder", "reverse") == "reverse"
    items = list(manifest["items"])
    if reverse:
        items.reverse()

    mode = "APPLY" if args.apply else "DRY RUN"
    print(f"{mode}: {site_root}")

    with tempfile.TemporaryDirectory(prefix="seori-weekly-") as temp_dir:
        temp_root = Path(temp_dir)
        collections = []
        all_operations = []
        for item in items:
            collection, operations = build_collection(item, year, temp_root, site_root, args.apply)
            collections.append(collection)
            all_operations.extend(operations)
        all_operations.extend(update_works_json(site_root, collections, args.apply))
        all_operations.extend(bump_script_cache(site_root, args.apply))

    for operation in all_operations:
        print(operation)

    if not args.apply:
        print("\nNo files were changed. Re-run with --apply after review.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
