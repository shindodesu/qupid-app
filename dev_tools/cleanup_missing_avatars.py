from __future__ import annotations

import argparse
import asyncio
from pathlib import Path
from typing import Optional

from sqlalchemy import text

from app.db.session import Sessionlocal


UPLOADS_ROOT = Path("uploads").resolve()


def is_missing_local_avatar(avatar_url: str) -> bool:
    value = avatar_url.strip()
    if not value:
        return True
    if value.startswith("http://") or value.startswith("https://"):
        return False

    normalized = value[1:] if value.startswith("/uploads/") else value
    if not normalized.startswith("uploads/"):
        return False

    file_path = Path(normalized).resolve()
    try:
        file_path.relative_to(UPLOADS_ROOT)
    except ValueError:
        return True

    return not file_path.exists()


async def cleanup_missing_avatars(apply_changes: bool, limit: Optional[int]) -> None:
    async with Sessionlocal() as db:
        result = await db.execute(
            text("SELECT id, avatar_url FROM users WHERE avatar_url IS NOT NULL ORDER BY id ASC")
        )
        rows = result.mappings().all()

        scanned = 0
        missing_count = 0
        updated_count = 0

        for row in rows:
            if limit is not None and scanned >= limit:
                break
            scanned += 1

            user_id = int(row["id"])
            avatar_url = row["avatar_url"]
            if avatar_url is None:
                continue
            if not is_missing_local_avatar(avatar_url):
                continue

            missing_count += 1
            print(f"[missing] user_id={user_id} avatar_url={avatar_url}")

            if apply_changes:
                await db.execute(
                    text("UPDATE users SET avatar_url = NULL WHERE id = :user_id"),
                    {"user_id": user_id},
                )
                updated_count += 1

        if apply_changes and updated_count > 0:
            await db.commit()

        print(f"scanned={scanned}")
        print(f"missing={missing_count}")
        print(f"updated={updated_count}")
        print(f"mode={'apply' if apply_changes else 'dry-run'}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean up missing local avatar URLs in users table.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply DB updates. Without this flag, runs in dry-run mode.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Max users to scan.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    asyncio.run(cleanup_missing_avatars(apply_changes=args.apply, limit=args.limit))


if __name__ == "__main__":
    main()
