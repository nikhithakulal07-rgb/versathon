from typing import List, Dict, Any, Optional, Tuple
from app.engine.difficulty import sigmoid, difficulty_to_logit, clamp

def update_theta(
    theta: float,
    difficulty: int,
    is_correct: bool,
    time_taken_seconds: float,
    expected_time_seconds: float,
    hint_used: bool = False,
    attempts: int = 0,
    is_diagnostic: bool = False
) -> float:
    """
    IRT/Elo style update for student ability theta.
    Takes into account question difficulty, speed, and hint usage.
    """
    b = difficulty_to_logit(difficulty)
    p = sigmoid(theta - b)

    if is_correct:
        if hint_used or (expected_time_seconds > 0 and time_taken_seconds > 2.0 * expected_time_seconds):
            outcome = 0.8
        elif expected_time_seconds > 0 and time_taken_seconds < 0.6 * expected_time_seconds:
            outcome = 1.0
        else:
            outcome = 1.0
    else:
        outcome = 0.0

    # Learning rate K
    k_base = max(0.15, 0.6 / (1.0 + 0.15 * attempts))
    if is_diagnostic:
        k = k_base * 1.5
    else:
        k = k_base

    theta_new = theta + k * (outcome - p)
    # Reasonable bounds on theta (-3.5 to +3.5)
    return clamp(theta_new, -3.5, 3.5)

def calculate_mastery(
    theta: float,
    recent_answers: List[Dict[str, Any]],  # List of {"is_correct": bool, "difficulty": int}
    attempts: int,
    prior_mastery: float = 50.0
) -> float:
    """
    Mastery (0-100):
    raw = 0.6 * 100 * sigmoid(theta) + 0.4 * (recency-weighted difficulty-weighted accuracy)
    mastery = confidence * raw + (1 - confidence) * prior
    confidence = min(1.0, attempts / 6.0)
    """
    if attempts == 0:
        return 0.0

    raw_theta_part = 60.0 * sigmoid(theta)

    if recent_answers:
        # Take up to last 8 answers
        window = recent_answers[-8:]
        weights = [1.0 + 0.15 * i for i in range(len(window))]
        total_weight = 0.0
        weighted_score = 0.0

        for idx, ans in enumerate(window):
            w = weights[idx]
            diff_factor = 0.6 + (ans.get("difficulty", 3) * 0.15)  # Diff 1: 0.75, Diff 5: 1.35
            ans_val = 1.0 if ans.get("is_correct") else 0.0
            weighted_score += ans_val * diff_factor * w
            total_weight += diff_factor * w

        accuracy_part = 40.0 * (weighted_score / total_weight if total_weight > 0 else 0.5)
    else:
        accuracy_part = 20.0

    raw = raw_theta_part + accuracy_part
    confidence = min(1.0, attempts / 6.0)
    mastery = confidence * raw + (1.0 - confidence) * prior_mastery
    return clamp(round(mastery, 1), 0.0, 100.0)

def determine_status(
    mastery: float,
    attempts: int,
    recent_answers: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Status determination:
    - unassessed (< 2 answers)
    - weak (< 45)
    - needs_practice (45 to 74)
    - strong (>= 75)
    - mastered (mastery >= 85 and attempts >= 6 and last 3 correct and >= 2 correct at diff >= 4)
    """
    if attempts < 2:
        return "unassessed"

    if mastery >= 85 and attempts >= 6 and recent_answers and len(recent_answers) >= 3:
        last_3_correct = all(a.get("is_correct", False) for a in recent_answers[-3:])
        high_diff_correct = sum(
            1 for a in recent_answers if a.get("is_correct", False) and a.get("difficulty", 1) >= 4
        )
        if last_3_correct and high_diff_correct >= 2:
            return "mastered"

    if mastery >= 75:
        return "strong"
    elif mastery >= 45:
        return "needs_practice"
    else:
        return "weak"

def calculate_trend(current_mastery: float, previous_mastery: Optional[float]) -> str:
    if previous_mastery is None:
        return "steady"
    delta = current_mastery - previous_mastery
    if delta >= 3.0:
        return "improving"
    elif delta <= -3.0:
        return "declining"
    return "steady"
