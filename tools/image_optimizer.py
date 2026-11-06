"""Shared image conversion helpers for the Seori Studio site tools."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


WEBP_MAX_EDGE = 2400
WEBP_QUALITY = 95
WEBP_COMPRESSION_LEVEL = 6
_SCALE_FILTER = (
    f"scale=w='min(iw,{WEBP_MAX_EDGE})':h='min(ih,{WEBP_MAX_EDGE})':"
    "force_original_aspect_ratio=decrease:force_divisible_by=2"
)


def webp_encoder_available() -> bool:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return False
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-encoders"],
        check=False,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0 and "libwebp" in result.stdout


def convert_to_webp(source: Path, target: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required to create optimized WebP images.")

    target.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-vf",
            _SCALE_FILTER,
            "-frames:v",
            "1",
            "-c:v",
            "libwebp",
            "-quality",
            str(WEBP_QUALITY),
            "-compression_level",
            str(WEBP_COMPRESSION_LEVEL),
            "-pix_fmt",
            "yuva420p",
            str(target),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not target.exists():
        details = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"WebP conversion failed for {source}: {details}")
