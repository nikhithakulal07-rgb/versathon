import math
from typing import Tuple, Dict, Any, List

LEVEL_TITLES = [
    (1, "Novice Explorer"),
    (2, "Apprentice Scholar"),
    (3, "Knowledge Seeker"),
    (4, "Adept Practitioner"),
    (5, "Concept Specialist"),
    (6, "Master Analyst"),
    (7, "Grandmaster Mentor"),
    (8, "Legendary Sage"),
    (10, "Ascended Polymath"),
]

def calculate_xp_for_level(level: int) -> int:
    """
    XP required to reach `level`. Level 1 requires 0 XP.
    Level 2: ~283 XP, Level 3: ~520 XP, etc.
    """
    if level <= 1:
        return 0
    return int(round(100.0 * math.pow(level, 1.5)))

def get_level_from_xp(total_xp: int) -> Tuple[int, str, int, int]:
    """
    Given total_xp, returns (current_level, title, xp_for_current_level, xp_for_next_level)
    """
    level = 1
    while True:
        next_req = calculate_xp_for_level(level + 1)
        if total_xp >= next_req:
            level += 1
        else:
            break

    # Determine title
    title = "Novice Explorer"
    for lvl_threshold, lvl_title in LEVEL_TITLES:
        if level >= lvl_threshold:
            title = lvl_title

    curr_xp_req = calculate_xp_for_level(level)
    next_xp_req = calculate_xp_for_level(level + 1)
    return level, title, curr_xp_req, next_xp_req

def calculate_answer_xp(difficulty: int, is_correct: bool) -> int:
    if not is_correct:
        return 1  # 1 XP for effort
    multiplier = 1.0 + 0.25 * (max(1, min(5, difficulty)) - 1)
    return int(round(5.0 * multiplier))

def calculate_session_xp(
    event_type: str,
    correct_count: int = 0,
    total_count: int = 0,
    difficulties: List[int] = None,
    mastery_gain: float = 0.0,
    streak_count: int = 0
) -> int:
    """
    Calculates total server-side XP for a completed activity.
    """
    xp = 0
    if event_type == "lesson":
        xp += 20
    elif event_type == "diagnostic":
        xp += 30
    elif event_type == "flashcards":
        xp += 15
    elif event_type == "revision_card":
        xp += 5
    elif event_type == "daily_challenge":
        xp += 60
    elif event_type in ("test", "boss"):
        xp += 40
        if total_count > 0 and correct_count == total_count:
            xp += 50  # Perfect score bonus

    # Add question-specific XP if difficulties provided
    if difficulties:
        for d in difficulties:
            xp += calculate_answer_xp(d, True)

    # Mastery improvement bonus (2 XP per point gained, cap 60)
    if mastery_gain > 0:
        improvement_xp = min(60, int(round(mastery_gain * 2.0)))
        xp += improvement_xp

    # Streak bonus if applicable
    if streak_count > 0 and event_type in ("diagnostic", "test", "daily_challenge"):
        streak_bonus = 10 + 2 * min(streak_count, 7)
        xp += streak_bonus

    return max(5, xp)
