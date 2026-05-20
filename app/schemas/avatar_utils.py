from __future__ import annotations

from pathlib import Path
from typing import Optional


UPLOADS_ROOT = Path("uploads").resolve()


def normalize_avatar_url(value: Optional[str]) -> Optional[str]:
    """Return None when a local avatar path points to a missing file."""
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    # External URLs should not be checked against local filesystem.
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized

    candidate = normalized
    if candidate.startswith("/uploads/"):
        candidate = candidate[1:]

    if not candidate.startswith("uploads/"):
        return normalized

    file_path = Path(candidate).resolve()
    try:
        file_path.relative_to(UPLOADS_ROOT)
    except ValueError:
        return None

    if not file_path.exists():
        return None

    return candidate
