from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple

def process_flashcard_swipe(
    current_box: int,
    response: str,  # "know" (right swipe) or "revise" (left swipe)
    current_mastery: float
) -> Tuple[int, datetime, float]:
    """
    Processes Leitner flashcard swipe:
    - Left swipe ("revise"): box 1, due immediately, mastery nudge -3
    - Right swipe ("know"): box + 1 (max 3), due in 2^(box-1) days, mastery nudge +2

    Returns: (new_box, due_at, updated_mastery)
    """
    now = datetime.now(timezone.utc)

    if response.lower() in ("revise", "left", "need_revision"):
        new_box = 1
        due_at = now  # Due immediately for revision
        mastery_delta = -3.0
    else:
        new_box = min(3, current_box + 1)
        # Interval: Box 1 -> 1 day, Box 2 -> 3 days, Box 3 -> 7 days
        days = 1 if new_box == 1 else (3 if new_box == 2 else 7)
        due_at = now + timedelta(days=days)
        mastery_delta = +2.0

    updated_mastery = max(0.0, min(100.0, current_mastery + mastery_delta))
    return new_box, due_at, updated_mastery
