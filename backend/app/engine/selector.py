import random
from typing import List, Dict, Any, Optional, Set
from app.engine.difficulty import calculate_target_difficulty

def select_diagnostic_question(
    available_questions: List[Dict[str, Any]],  # [{"id": str, "subtopic_id": str, "difficulty": int, ...}]
    subtopic_ids: List[str],
    answered_subtopic_ids: Set[str],
    answered_question_ids: Set[str],
    current_theta: float,
    recent_answers: List[bool]
) -> Optional[Dict[str, Any]]:
    """
    Selects a diagnostic question with coverage-first strategy:
    Ensures at least 1 question per unassessed subtopic before repeating.
    Starts at difficulty 3, adapts fast.
    """
    # Candidate questions not yet answered
    unseen = [q for q in available_questions if q["id"] not in answered_question_ids]
    if not unseen:
        return None

    # Find subtopics with 0 answers so far
    uncovered_subtopics = [s_id for s_id in subtopic_ids if s_id not in answered_subtopic_ids]

    if uncovered_subtopics:
        target_subtopic = uncovered_subtopics[0]
        subtopic_pool = [q for q in unseen if q["subtopic_id"] == target_subtopic]
        if subtopic_pool:
            target_diff = 3
            # Pick question closest to target diff 3
            subtopic_pool.sort(key=lambda q: abs(q.get("difficulty", 3) - target_diff))
            return subtopic_pool[0]

    # If all subtopics covered at least once, adaptively pick from any subtopic
    target_diff = calculate_target_difficulty(
        theta=current_theta,
        current_difficulty=3,
        consecutive_correct=0,
        consecutive_wrong=0,
        recent_answers=recent_answers
    )

    unseen.sort(key=lambda q: (abs(q.get("difficulty", 3) - target_diff), random.random()))
    return unseen[0]

def select_adaptive_question(
    available_questions: List[Dict[str, Any]],
    answered_question_ids: Set[str],
    target_difficulty: int,
    weak_subtopic_ids: Optional[Set[str]] = None,
    preferred_subtopic_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Selects the next adaptive test question:
    - Filters out recently seen questions
    - In mixed tests: prioritizes ~60% weak-subtopic questions and 40% others
    - Targets the exact target_difficulty, fallback to nearest available
    """
    unseen = [q for q in available_questions if q["id"] not in answered_question_ids]
    if not unseen:
        # If all questions in the bank were answered, allow repeating least recently answered
        unseen = available_questions

    if not unseen:
        return None

    # If a specific subtopic is targeted
    if preferred_subtopic_id:
        preferred_pool = [q for q in unseen if q["subtopic_id"] == preferred_subtopic_id]
        if preferred_pool:
            unseen = preferred_pool

    # Weak subtopic weighting (60% weak, 40% other)
    if weak_subtopic_ids and len(weak_subtopic_ids) > 0 and not preferred_subtopic_id:
        weak_pool = [q for q in unseen if q["subtopic_id"] in weak_subtopic_ids]
        other_pool = [q for q in unseen if q["subtopic_id"] not in weak_subtopic_ids]

        if weak_pool and (random.random() < 0.60 or not other_pool):
            pool = weak_pool
        else:
            pool = other_pool if other_pool else weak_pool
    else:
        pool = unseen

    # Sort by absolute distance from target_difficulty, shuffle within same distance
    pool_sorted = sorted(pool, key=lambda q: (abs(q.get("difficulty", 3) - target_difficulty), random.random()))
    return pool_sorted[0]
