from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

def calculate_forgetting_factor(last_practiced_at: Optional[datetime]) -> float:
    """
    If a subtopic has not been practiced for 7+ days, calculate forgetting factor (0.0 to 1.0).
    """
    if not last_practiced_at:
        return 0.5  # moderate decay for unpracticed
    
    now = datetime.now(timezone.utc)
    if last_practiced_at.tzinfo is None:
        last_practiced_at = last_practiced_at.replace(tzinfo=timezone.utc)
        
    days_since = (now - last_practiced_at).total_seconds() / 86400.0
    if days_since < 7.0:
        return 0.0
    return min(1.0, (days_since - 7.0) / 14.0)

def calculate_subtopic_priority(
    mastery: float,
    recent_mistake_rate: float,
    flashcard_revise_rate: float,
    last_practiced_at: Optional[datetime],
    has_unmet_prerequisites: bool = False
) -> float:
    """
    Priority formula:
    0.45 * (1 - mastery/100) + 0.20 * recent_mistake_rate + 0.15 * flashcard_revise_rate + 0.10 * forgetting_factor + 0.10 * prerequisite_urgency
    """
    forgetting = calculate_forgetting_factor(last_practiced_at)
    prereq_urgency = 0.8 if has_unmet_prerequisites else 0.0

    priority = (
        0.45 * (1.0 - (mastery / 100.0))
        + 0.20 * recent_mistake_rate
        + 0.15 * flashcard_revise_rate
        + 0.10 * forgetting
        + 0.10 * prereq_urgency
    )
    return round(priority, 4)

def generate_subtopic_recommendation(
    subtopic_id: str,
    subtopic_title: str,
    mastery: float,
    status: str,
    trend: str,
    priority: float,
    recent_mistake_count: int = 0,
    has_flashcard_revisions: bool = False
) -> Dict[str, Any]:
    """
    Generates recommended action and explainable human-readable reason text.
    """
    if has_flashcard_revisions:
        action = "revise_flashcards"
        reason = f"You flagged flashcards in '{subtopic_title}' for revision. Quick concept review will strengthen recall."
    elif status == "weak" or mastery < 45.0:
        action = "explain_easy"
        if recent_mistake_count > 0:
            reason = f"Mastery in '{subtopic_title}' is {round(mastery)}% with {recent_mistake_count} recent mistake(s). Reviewing the visual breakdown and foundational explanation is recommended."
        else:
            reason = f"Mastery in '{subtopic_title}' is currently {round(mastery)}%. Let's review the core concepts at a beginner level."
    elif status == "needs_practice" or (45.0 <= mastery < 75.0):
        action = "practice_medium"
        if trend == "improving":
            reason = f"Great momentum! Mastery in '{subtopic_title}' is improving ({round(mastery)}%). Intermediate practice will solidify your skills."
        else:
            reason = f"Mastery in '{subtopic_title}' is at {round(mastery)}%. Targeted practice at Level 3 will build stronger proficiency."
    elif status == "strong" or (75.0 <= mastery < 85.0):
        action = "practice_advanced"
        reason = f"High proficiency in '{subtopic_title}' ({round(mastery)}%)! Complete Level 4-5 challenge questions to achieve full mastery."
    else:  # Mastered
        action = "next_topic"
        reason = f"'{subtopic_title}' is fully mastered (Mastery: {round(mastery)}%)! Ready to advance to the next topic in the curriculum."

    return {
        "subtopic_id": subtopic_id,
        "subtopic_title": subtopic_title,
        "action": action,
        "reason_text": reason,
        "priority": priority,
        "mastery": mastery,
        "status": status
    }
