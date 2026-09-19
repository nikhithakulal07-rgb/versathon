import pytest
from app.engine.difficulty import (
    difficulty_to_logit, logit_to_difficulty, calculate_target_difficulty,
    is_remedial_required, sigmoid
)
from app.engine.mastery import (
    update_theta, calculate_mastery, determine_status, calculate_trend
)
from app.engine.flashcards import process_flashcard_swipe
from app.engine.recommender import calculate_subtopic_priority, generate_subtopic_recommendation
from app.engine.explain_level import determine_explanation_level
from app.engine.xp import calculate_answer_xp, calculate_session_xp, get_level_from_xp

def test_logit_conversions():
    assert difficulty_to_logit(3) == 0.0
    assert difficulty_to_logit(1) == -1.8
    assert difficulty_to_logit(5) == 1.8
    assert logit_to_difficulty(0.0) == 3
    assert logit_to_difficulty(-1.8) == 1
    assert logit_to_difficulty(1.8) == 5

def test_theta_update_direction():
    # Correct answer on hard question increases theta significantly
    theta_init = 0.0
    theta_after_hard = update_theta(
        theta=theta_init,
        difficulty=5,
        is_correct=True,
        time_taken_seconds=30,
        expected_time_seconds=45
    )
    assert theta_after_hard > theta_init

    # Wrong answer on easy question decreases theta significantly
    theta_after_easy_fail = update_theta(
        theta=theta_init,
        difficulty=1,
        is_correct=False,
        time_taken_seconds=30,
        expected_time_seconds=45
    )
    assert theta_after_easy_fail < theta_init

def test_no_monotonic_difficulty_climb():
    # A single correct answer does not immediately force difficulty to jump
    target = calculate_target_difficulty(
        theta=0.1,
        current_difficulty=3,
        consecutive_correct=1,
        consecutive_wrong=0
    )
    assert target == 3

    # Two consecutive correct answers with supporting theta steps up
    target_up = calculate_target_difficulty(
        theta=1.0,
        current_difficulty=3,
        consecutive_correct=2,
        consecutive_wrong=0
    )
    assert target_up == 4

def test_hysteresis_and_remedial():
    # 1 wrong answer at difficulty 4 steps down immediately
    target_down = calculate_target_difficulty(
        theta=0.5,
        current_difficulty=4,
        consecutive_correct=0,
        consecutive_wrong=1
    )
    assert target_down == 3

    # Repeated mistakes in last 3 answers triggers drop to remedial levels (1 or 2)
    recent_mistakes = [False, True, False]
    assert is_remedial_required(recent_mistakes) is True

    target_remedial = calculate_target_difficulty(
        theta=-0.5,
        current_difficulty=3,
        consecutive_correct=0,
        consecutive_wrong=1,
        recent_answers=recent_mistakes
    )
    assert target_remedial <= 2

def test_mastery_calculation_and_status():
    # Zero attempts -> 0 mastery, unassessed
    assert calculate_mastery(0.0, [], 0) == 0.0
    assert determine_status(0.0, 0) == "unassessed"

    # Weak status
    assert determine_status(35.0, 3) == "weak"

    # Needs practice
    assert determine_status(60.0, 4) == "needs_practice"

    # Strong
    assert determine_status(78.0, 5) == "strong"

    # Mastered requirements: mastery >= 85, attempts >= 6, last 3 correct, >= 2 diff >= 4 correct
    recent = [
        {"is_correct": True, "difficulty": 4},
        {"is_correct": True, "difficulty": 5},
        {"is_correct": True, "difficulty": 4},
        {"is_correct": True, "difficulty": 3},
        {"is_correct": True, "difficulty": 4},
        {"is_correct": True, "difficulty": 5},
    ]
    status = determine_status(90.0, 6, recent)
    assert status == "mastered"

def test_flashcard_leitner_swipe():
    # Left swipe -> box 1, mastery decreases by 3
    box, due, mastery = process_flashcard_swipe(current_box=2, response="revise", current_mastery=60.0)
    assert box == 1
    assert mastery == 57.0

    # Right swipe -> box + 1, mastery increases by 2
    box2, due2, mastery2 = process_flashcard_swipe(current_box=1, response="know", current_mastery=60.0)
    assert box2 == 2
    assert mastery2 == 62.0

def test_explanation_level_mapping():
    assert determine_explanation_level(20.0) == "beginner"
    assert determine_explanation_level(55.0) == "intermediate"
    assert determine_explanation_level(85.0) == "advanced"

def test_xp_and_level_progression():
    lvl, title, curr_req, next_req = get_level_from_xp(0)
    assert lvl == 1
    assert title == "Novice Explorer"

    lvl3, title3, _, _ = get_level_from_xp(600)
    assert lvl3 >= 2

    # Session XP adds bonuses correctly
    xp = calculate_session_xp("test", correct_count=5, total_count=5, mastery_gain=10.0, streak_count=3)
    assert xp >= 40 + 50 + 20 + 16  # Test + Perfect + Mastery Gain + Streak
