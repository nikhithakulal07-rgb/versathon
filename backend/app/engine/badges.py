from typing import List, Dict, Any, Optional

INITIAL_BADGES = [
    {
        "code": "streak_7",
        "name": "7-Day Streak",
        "emoji": "🔥",
        "description": "Maintained a continuous daily learning streak for 7 days.",
        "category": "streak"
    },
    {
        "code": "concept_master",
        "name": "Concept Master",
        "emoji": "🧠",
        "description": "Achieved 'Mastered' status in any subtopic.",
        "category": "mastery"
    },
    {
        "code": "quick_learner",
        "name": "Quick Learner",
        "emoji": "⚡",
        "description": "Answered 10 questions correctly faster than the expected time.",
        "category": "speed"
    },
    {
        "code": "perfect_score",
        "name": "Flawless Quiz",
        "emoji": "🎯",
        "description": "Scored 100% on any adaptive assessment.",
        "category": "test"
    },
    {
        "code": "revision_hero",
        "name": "Revision Hero",
        "emoji": "🔁",
        "description": "Cleared an entire Revision Required queue without skipping.",
        "category": "revision"
    },
    {
        "code": "comeback_kid",
        "name": "Comeback Kid",
        "emoji": "🌟",
        "description": "Elevated a subtopic from 'Weak' (<45%) to 'Strong' (>=75%).",
        "category": "achievement"
    },
    {
        "code": "topic_master",
        "name": "Topic Conqueror",
        "emoji": "🏆",
        "description": "Mastered all subtopics in a complete chapter.",
        "category": "mastery"
    },
    {
        "code": "first_mission",
        "name": "Skyforge Scout",
        "emoji": "🚀",
        "description": "Completed your first Game Mode expedition mission.",
        "category": "special"
    }
]

def check_eligible_badges(
    user_context: Dict[str, Any],
    existing_badge_codes: List[str]
) -> List[Dict[str, Any]]:
    """
    Evaluates context against badge triggers and returns newly earned badges.
    """
    new_badges = []
    existing_set = set(existing_badge_codes)

    # 1. 7 Day Streak
    if "streak_7" not in existing_set and user_context.get("current_streak", 0) >= 7:
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "streak_7"))

    # 2. Concept Master
    if "concept_master" not in existing_set and user_context.get("has_mastered_subtopic", False):
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "concept_master"))

    # 3. Perfect Score
    if "perfect_score" not in existing_set and user_context.get("has_perfect_score", False):
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "perfect_score"))

    # 4. Revision Hero
    if "revision_hero" not in existing_set and user_context.get("cleared_revision_set", False):
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "revision_hero"))

    # 5. Comeback Kid
    if "comeback_kid" not in existing_set and user_context.get("made_comeback", False):
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "comeback_kid"))

    # 6. Quick Learner
    if "quick_learner" not in existing_set and user_context.get("fast_correct_count", 0) >= 10:
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "quick_learner"))

    # 7. First Mission
    if "first_mission" not in existing_set and user_context.get("completed_mission", False):
        new_badges.append(next(b for b in INITIAL_BADGES if b["code"] == "first_mission"))

    return new_badges
