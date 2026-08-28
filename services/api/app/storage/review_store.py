"""SQLite-backed reviewer decision persistence for TraceGraph AI.

Stores human reviewer decisions (REVIEWED, DISMISSED, ESCALATED) with UTC
timestamps. The database file is created automatically on first use and is
intentionally not committed to git (listed in .gitignore).

Database location (default): services/api/tracegraph_reviews.db
Override via the TRACEGRAPH_REVIEWS_DB environment variable.
"""

from __future__ import annotations

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Database path resolution
# ---------------------------------------------------------------------------

_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "tracegraph_reviews.db"
DB_PATH = Path(os.getenv("TRACEGRAPH_REVIEWS_DB", str(_DEFAULT_DB_PATH)))

VALID_DECISIONS = {"REVIEWED", "DISMISSED", "ESCALATED"}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS reviews (
    review_id   TEXT PRIMARY KEY,
    alert_id    TEXT NOT NULL,
    decision    TEXT NOT NULL,
    note        TEXT,
    reviewed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_alert_id ON reviews (alert_id);
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _connect() -> sqlite3.Connection:
    """Open a connection and ensure the schema exists."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)
    conn.commit()
    return conn


def save_review(alert_id: str, decision: str, note: str | None) -> dict[str, Any]:
    """Persist a reviewer decision and return the saved review record.

    Args:
        alert_id:  The alert being reviewed (must already exist in ArtifactStore).
        decision:  One of "REVIEWED", "DISMISSED", "ESCALATED".
        note:      Optional plain-text reviewer note (max 500 chars).

    Returns:
        A dict with review_id, alert_id, decision, note, reviewed_at.
    """
    if decision not in VALID_DECISIONS:
        raise ValueError(f"Invalid decision '{decision}'. Allowed: {sorted(VALID_DECISIONS)}")
    if note and len(note) > 500:
        raise ValueError("Note exceeds 500 character limit.")

    review_id = f"rev_{uuid.uuid4().hex}"
    reviewed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    with _connect() as conn:
        conn.execute(
            "INSERT INTO reviews (review_id, alert_id, decision, note, reviewed_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (review_id, alert_id, decision, note, reviewed_at),
        )

    return {
        "review_id": review_id,
        "alert_id": alert_id,
        "decision": decision,
        "note": note,
        "reviewed_at": reviewed_at,
    }


def get_reviews(alert_id: str) -> list[dict[str, Any]]:
    """Return all review records for a given alert, ordered newest-first."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT review_id, alert_id, decision, note, reviewed_at "
            "FROM reviews WHERE alert_id = ? ORDER BY reviewed_at DESC",
            (alert_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_latest_review(alert_id: str) -> dict[str, Any] | None:
    """Return the most recent review for an alert, or None if not yet reviewed."""
    reviews = get_reviews(alert_id)
    return reviews[0] if reviews else None


def get_all_latest_reviews() -> dict[str, str]:
    """Return a mapping of alert_id -> latest decision state for all reviewed alerts."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT alert_id, decision FROM (
                SELECT alert_id, decision, ROW_NUMBER() OVER (PARTITION BY alert_id ORDER BY reviewed_at DESC) as rn
                FROM reviews
            ) WHERE rn = 1
            """
        ).fetchall()
    return {row["alert_id"]: row["decision"] for row in rows}

