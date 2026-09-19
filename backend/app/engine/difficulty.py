import math
from typing import List, Dict, Any, Optional

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))

def sigmoid(x: float) -> float:
    # Stable sigmoid computation
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    else:
        z = math.exp(x)
        return z / (1.0 + z)

def difficulty_to_logit(difficulty: int) -> float:
    """
    Converts question difficulty (1 to 5) into item difficulty logit b.
    Difficulty 1 -> -1.8, 2 -> -0.9, 3 -> 0.0, 4 -> 0.9, 5 -> 1.8
    """
    diff_clamped = int(clamp(difficulty, 1, 5))
    return (diff_clamped - 3) * 0.9

def logit_to_difficulty(b: float) -> int:
    """
    Converts logit b back to discrete difficulty 1-5.
    """
    raw = 3.0 + (b / 0.9)
    return int(clamp(round(raw), 1, 5))

def calculate_target_difficulty(
    theta: float,
    current_difficulty: int,
    consecutive_correct: int,
    consecutive_wrong: int,
    recent_answers: Optional[List[bool]] = None
) -> int:
    """
    Determines next question difficulty using zone of proximal development (p ~ 0.70)
    with hysteresis and repeated mistake protections.
    """
    # Target success prob = 0.70 => logit offset = -0.85 (since sigmoid(0.85) ~ 0.701)
    target_b = theta - 0.85
    ideal_diff = logit_to_difficulty(target_b)

    # Check repeated mistakes on recent answers
    if recent_answers and len(recent_answers) >= 3:
        last_3 = recent_answers[-3:]
        wrong_in_last_3 = sum(1 for a in last_3 if not a)
        if wrong_in_last_3 >= 2:
            # Drop down to 1 or 2 to allow recovery
            return min(2, max(1, current_difficulty - 1))

    # Step down rules:
    # Immediately step down after 1 wrong answer at difficulty >= 3
    if consecutive_wrong >= 1 and current_difficulty >= 3:
        next_diff = current_difficulty - 1
        return max(1, next_diff)
    
    # Step down after 2 consecutive wrong answers at any level
    if consecutive_wrong >= 2:
        next_diff = current_difficulty - 1
        return max(1, next_diff)

    # Step up rules:
    # Step up only after 2 consecutive correct answers at current level
    if consecutive_correct >= 2:
        # Check if ideal_diff warrants moving up
        if ideal_diff > current_difficulty:
            return min(5, current_difficulty + 1)
        elif theta > difficulty_to_logit(current_difficulty) + 0.6:
            return min(5, current_difficulty + 1)
        return current_difficulty

    # If 1 correct, maintain current difficulty unless theta is dramatically lower
    if consecutive_correct == 1:
        if ideal_diff < current_difficulty - 1:
            return max(1, current_difficulty - 1)
        return current_difficulty

    # Default hysteresis: max change of +/- 1 level towards ideal
    diff_delta = ideal_diff - current_difficulty
    if diff_delta > 1:
        return current_difficulty + 1
    elif diff_delta < -1:
        return current_difficulty - 1
    return ideal_diff

def is_remedial_required(recent_answers: List[bool]) -> bool:
    """
    Returns True if user has made >= 2 mistakes in the last 3 answers.
    """
    if not recent_answers or len(recent_answers) < 2:
        return False
    window = recent_answers[-3:]
    wrong_count = sum(1 for ans in window if not ans)
    return wrong_count >= 2
