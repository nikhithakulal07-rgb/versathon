import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.models.curriculum import Topic, Subtopic
from app.models.content import Question
from app.models.learning import MasteryScore, Answer, Test, TestResult, LearningHistory, Recommendation
from app.models.gamification import UserXP, XPEvent, Badge, UserBadge, Streak
from app.deps import get_current_user
from app.engine.difficulty import calculate_target_difficulty
from app.engine.selector import select_adaptive_question
from app.engine.mastery import update_theta, calculate_mastery, determine_status, calculate_trend
from app.engine.xp import calculate_session_xp, get_level_from_xp
from app.engine.badges import check_eligible_badges
from app.engine.recommender import calculate_subtopic_priority, generate_subtopic_recommendation
from app.schemas.learning import (
    TestStartRequest, TestNextQuestionResponse,
    AnswerSubmitRequest, AnswerSubmitResponse, ReportCardResponse
)

router = APIRouter(prefix="/tests", tags=["Tests & Assessments"])

@router.post("/start")
def start_test(
    req: TestStartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    test = Test(
        user_id=user.id,
        topic_id=topic.id,
        type=req.type or "adaptive",
        mode_used=req.mode_used or "school",
        started_at=datetime.now(timezone.utc)
    )
    db.add(test)
    db.add(LearningHistory(
        user_id=user.id,
        event_type="test_started",
        topic_id=topic.id,
        payload_json={"test_type": req.type, "subtopic_id": req.subtopic_id},
        mode_used=req.mode_used or "school"
    ))
    db.commit()
    db.refresh(test)

    return {"test_id": test.id, "topic_id": topic.id, "title": topic.title, "type": test.type}

from app.ai.service import ai_service

@router.get("/{id}/next", response_model=TestNextQuestionResponse)
async def get_next_test_question(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == id, Test.user_id == user.id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found.")

    if test.completed_at:
        return TestNextQuestionResponse(
            test_id=test.id,
            question=None,
            question_number=10,
            total_questions=10,
            is_completed=True,
            report=test.results.recommended_next_json if test.results else None
        )

    topic = db.query(Topic).filter(Topic.id == test.topic_id).first()
    subtopics = topic.subtopics
    subtopic_ids = [s.id for s in subtopics]

    # Ensure questions exist for each subtopic
    for s in topic.subtopics:
        existing_count = db.query(Question).filter(Question.subtopic_id == s.id).count()
        if existing_count < 3:
            new_qs = await ai_service.generate_questions(s.title, s.concept_tag, difficulty=3, n=5)
            for q in new_qs:
                db.add(Question(
                    subtopic_id=s.id,
                    concept_tag=s.concept_tag,
                    stem=q["stem"],
                    options_json=q.get("options", q.get("options_json", [])),
                    correct_index=q["correct_index"],
                    difficulty=q.get("difficulty", 3),
                    expected_time_seconds=q.get("expected_time_seconds", 45),
                    explanation=q.get("explanation", ""),
                    misconception_hints_json=q.get("misconception_hints", {}),
                    source="ai"
                ))
            db.commit()

    # Gather answers in this session
    session_answers = db.query(Answer).filter(
        Answer.user_id == user.id,
        Answer.session_id == id,
        Answer.session_type.in_(["test", "adaptive", "boss", "daily"])
    ).order_by(Answer.answered_at.asc()).all()

    total_taken = len(session_answers)
    total_test_questions = 10 if test.type != "boss" else 12

    if total_taken >= total_test_questions:
        return TestNextQuestionResponse(
            test_id=test.id,
            question=None,
            question_number=total_taken,
            total_questions=total_test_questions,
            is_completed=True
        )

    answered_q_ids = {a.question_id for a in session_answers}

    # Find weak subtopics to weight (60% weak, 40% others)
    scores = db.query(MasteryScore).filter(
        MasteryScore.user_id == user.id,
        MasteryScore.subtopic_id.in_(subtopic_ids)
    ).all()
    score_map = {sc.subtopic_id: sc for sc in scores}
    weak_subtopics = {sc.subtopic_id for sc in scores if sc.status == "weak" or sc.mastery < 45.0}

    # Calculate current target difficulty from average theta & consecutive streak
    consec_corr = 0
    consec_wrng = 0
    recent_bools = []
    curr_diff = 3
    avg_theta = 0.0

    if session_answers:
        for a in session_answers:
            recent_bools.append(a.is_correct)
        curr_diff = session_answers[-1].difficulty
        if session_answers[-1].is_correct:
            consec_corr = 1
            for a in reversed(session_answers[:-1]):
                if a.is_correct:
                    consec_corr += 1
                else:
                    break
        else:
            consec_wrng = 1
            for a in reversed(session_answers[:-1]):
                if not a.is_correct:
                    consec_wrng += 1
                else:
                    break

    if scores:
        avg_theta = sum(s.theta for s in scores) / len(scores)

    target_diff = calculate_target_difficulty(
        theta=avg_theta,
        current_difficulty=curr_diff,
        consecutive_correct=consec_corr,
        consecutive_wrong=consec_wrng,
        recent_answers=recent_bools
    )

    # In Boss challenge, add +1 difficulty boost
    if test.type == "boss":
        target_diff = min(5, target_diff + 1)

    available_qs = db.query(Question).filter(Question.subtopic_id.in_(subtopic_ids)).all()
    q_dicts = [
        {
            "id": q.id,
            "subtopic_id": q.subtopic_id,
            "difficulty": q.difficulty,
            "stem": q.stem,
            "options": q.options_json,
            "expected_time_seconds": q.expected_time_seconds,
            "concept_tag": q.concept_tag
        }
        for q in available_qs
    ]

    chosen = select_adaptive_question(
        available_questions=q_dicts,
        answered_question_ids=answered_q_ids,
        target_difficulty=target_diff,
        weak_subtopic_ids=weak_subtopics
    )

    if not chosen:
        return TestNextQuestionResponse(
            test_id=test.id,
            question=None,
            question_number=total_taken,
            total_questions=total_test_questions,
            is_completed=True
        )

    question_payload = {
        "id": chosen["id"],
        "subtopic_id": chosen["subtopic_id"],
        "difficulty": chosen["difficulty"],
        "stem": chosen["stem"],
        "options": chosen["options"],
        "expected_time_seconds": chosen["expected_time_seconds"],
        "concept_tag": chosen["concept_tag"]
    }

    return TestNextQuestionResponse(
        test_id=test.id,
        question=question_payload,
        question_number=total_taken + 1,
        total_questions=total_test_questions,
        is_completed=False
    )

@router.post("/{id}/answer", response_model=AnswerSubmitResponse)
def submit_test_answer(
    id: str,
    req: AnswerSubmitRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == id, Test.user_id == user.id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found.")

    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    is_correct = (req.chosen_index == question.correct_index)

    # Record Answer
    answer = Answer(
        user_id=user.id,
        question_id=question.id,
        session_id=id,
        session_type="test",
        chosen_index=req.chosen_index,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds,
        difficulty=question.difficulty,
        hint_used=req.hint_used,
        answered_at=datetime.now(timezone.utc)
    )
    db.add(answer)

    # Update Mastery Score
    score = db.query(MasteryScore).filter(
        MasteryScore.user_id == user.id,
        MasteryScore.subtopic_id == question.subtopic_id
    ).first()

    if not score:
        score = MasteryScore(
            user_id=user.id,
            subtopic_id=question.subtopic_id,
            theta=0.0,
            mastery=0.0,
            confidence=0.0,
            attempts=0,
            correct_count=0,
            consecutive_correct=0,
            consecutive_wrong=0,
            last_difficulty=question.difficulty,
            status="unassessed"
        )
        db.add(score)

    score.attempts += 1
    if is_correct:
        score.correct_count += 1
        score.consecutive_correct += 1
        score.consecutive_wrong = 0
    else:
        score.consecutive_wrong += 1
        score.consecutive_correct = 0

    score.theta = update_theta(
        theta=score.theta,
        difficulty=question.difficulty,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds,
        expected_time_seconds=question.expected_time_seconds,
        hint_used=req.hint_used,
        attempts=score.attempts,
        is_diagnostic=False
    )

    recent_answers_db = db.query(Answer).filter(
        Answer.user_id == user.id,
        Answer.question_id == question.id
    ).order_by(Answer.answered_at.desc()).limit(8).all()
    recent_ans_dicts = [{"is_correct": a.is_correct, "difficulty": a.difficulty} for a in recent_answers_db]

    prev_mastery = score.mastery
    score.mastery = calculate_mastery(score.theta, recent_ans_dicts, score.attempts, prior_mastery=prev_mastery or 50.0)
    score.status = determine_status(score.mastery, score.attempts, recent_ans_dicts)
    score.trend = calculate_trend(score.mastery, prev_mastery)
    score.last_practiced_at = datetime.now(timezone.utc)
    score.last_difficulty = question.difficulty

    # Award instant XP
    xp_amount = 5 if is_correct else 1
    db.commit()

    chosen_opt_text = question.options_json[req.chosen_index] if question.options_json and req.chosen_index < len(question.options_json) else None
    misc_hints = question.misconception_hints_json or {}
    misc_hint = misc_hints.get(chosen_opt_text) if chosen_opt_text else None

    return AnswerSubmitResponse(
        is_correct=is_correct,
        correct_index=question.correct_index,
        explanation=question.explanation,
        misconception_hint=misc_hint,
        xp_awarded=xp_amount,
        new_mastery=score.mastery,
        new_status=score.status,
        new_difficulty=score.last_difficulty,
        streak=user.streak.current_streak if user.streak else 1,
        new_badges=[]
    )

@router.post("/{id}/finish")
def finish_test(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == id, Test.user_id == user.id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found.")

    topic = db.query(Topic).filter(Topic.id == test.topic_id).first()
    subtopics = topic.subtopics
    subtopic_ids = [s.id for s in subtopics]

    # Calculate test statistics
    session_answers = db.query(Answer).filter(
        Answer.user_id == user.id,
        Answer.session_id == id
    ).all()

    total_q = len(session_answers)
    correct_q = sum(1 for a in session_answers if a.is_correct)
    accuracy = round((correct_q / total_q * 100.0), 1) if total_q > 0 else 0.0
    duration_s = sum(a.time_taken_seconds for a in session_answers)

    # Subtopic mastery analysis
    scores = db.query(MasteryScore).filter(
        MasteryScore.user_id == user.id,
        MasteryScore.subtopic_id.in_(subtopic_ids)
    ).all()
    score_map = {sc.subtopic_id: sc for sc in scores}

    strong_areas = []
    needs_practice_areas = []
    weak_areas = []
    improving_areas = []
    subtopic_recommendations = []

    for s in subtopics:
        sc = score_map.get(s.id)
        m = sc.mastery if sc else 0.0
        st = sc.status if sc else "unassessed"
        tr = sc.trend if sc else "steady"

        if st in ("strong", "mastered") or m >= 75:
            strong_areas.append(s.title)
        elif st == "needs_practice" or (45 <= m < 75):
            needs_practice_areas.append(s.title)
        else:
            weak_areas.append(s.title)

        if tr == "improving":
            improving_areas.append(s.title)

        # Generate recommendation for each subtopic
        prio = calculate_subtopic_priority(
            mastery=m,
            recent_mistake_rate=0.4 if st == "weak" else 0.1,
            flashcard_revise_rate=0.0,
            last_practiced_at=sc.last_practiced_at if sc else None
        )
        rec = generate_subtopic_recommendation(
            subtopic_id=s.id,
            subtopic_title=s.title,
            mastery=m,
            status=st,
            trend=tr,
            priority=prio
        )
        subtopic_recommendations.append(rec)

    # Sort recommendations by priority
    subtopic_recommendations.sort(key=lambda r: r["priority"], reverse=True)
    top_recommendation = subtopic_recommendations[0] if subtopic_recommendations else {
        "action": "next_topic",
        "reason_text": "Great job completing the assessment! Keep exploring new topics.",
        "priority": 1.0
    }

    # Save top recommendation to database
    db.add(Recommendation(
        user_id=user.id,
        topic_id=topic.id,
        subtopic_id=top_recommendation.get("subtopic_id"),
        action=top_recommendation.get("action", "practice_medium"),
        reason_text=top_recommendation.get("reason_text", "Keep up the momentum!"),
        priority=top_recommendation.get("priority", 1.0),
        status="active"
    ))

    # Calculate and award Server-side XP
    test_xp = calculate_session_xp(
        event_type="test",
        correct_count=correct_q,
        total_count=total_q,
        mastery_gain=5.0 if accuracy >= 70 else 0.0,
        streak_count=user.streak.current_streak if user.streak else 1
    )

    db.add(XPEvent(
        user_id=user.id,
        amount=test_xp,
        reason=f"Completed {test.type.title()} Test for {topic.title}",
        ref_type="test",
        ref_id=test.id
    ))

    user_xp = user.xp
    old_level = user_xp.level if user_xp else 1
    level_up_data = None
    if user_xp:
        user_xp.total_xp += test_xp
        user_xp.week_xp += test_xp
        new_lvl, new_title, _, _ = get_level_from_xp(user_xp.total_xp)
        if new_lvl > old_level:
            user_xp.level = new_lvl
            level_up_data = {"old_level": old_level, "new_level": new_lvl, "title": new_title}

    # Check and award badges
    user_context = {
        "has_perfect_score": (total_q > 0 and correct_q == total_q),
        "has_mastered_subtopic": any(sc.status == "mastered" for sc in scores),
        "current_streak": user.streak.current_streak if user.streak else 1,
        "made_comeback": any(sc.trend == "improving" and sc.mastery >= 75 for sc in scores)
    }
    existing_badges = [ub.badge.code for ub in user.user_badges]
    new_badges = check_eligible_badges(user_context, existing_badges)
    for b in new_badges:
        badge_row = db.query(Badge).filter(Badge.code == b["code"]).first()
        if badge_row:
            db.add(UserBadge(user_id=user.id, badge_id=badge_row.id))

    test.completed_at = datetime.now(timezone.utc)

    # Save TestResult
    result = TestResult(
        test_id=test.id,
        score=correct_q,
        accuracy=accuracy,
        mastery_before_json={"mastery": 50.0},
        mastery_after_json={"mastery": round(sum(s.mastery for s in scores)/len(scores), 1) if scores else 0.0},
        strong_json=strong_areas,
        weak_json=weak_areas,
        improving_json=improving_areas,
        recommended_next_json=top_recommendation,
        duration_seconds=duration_s
    )
    db.add(result)
    db.commit()

    return {
        "test_id": test.id,
        "score": correct_q,
        "total_questions": total_q,
        "accuracy": accuracy,
        "xp_earned": test_xp,
        "level_up": level_up_data,
        "new_badges": new_badges,
        "recommended_next": top_recommendation
    }

@router.get("/{id}/report", response_model=ReportCardResponse)
def get_test_report(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == id, Test.user_id == user.id).first()
    if not test or not test.results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report card not ready or test not found.")

    res = test.results
    topic = db.query(Topic).filter(Topic.id == test.topic_id).first()

    # Answers review list
    answers = db.query(Answer).filter(Answer.session_id == test.id, Answer.user_id == user.id).all()
    review = []
    for a in answers:
        q = a.question
        review.append({
            "stem": q.stem,
            "chosen_option": q.options_json[a.chosen_index] if q.options_json and a.chosen_index < len(q.options_json) else "",
            "correct_option": q.options_json[q.correct_index] if q.options_json and q.correct_index < len(q.options_json) else "",
            "is_correct": a.is_correct,
            "explanation": q.explanation,
            "difficulty": a.difficulty,
            "time_taken_seconds": a.time_taken_seconds
        })

    mastery_after = res.mastery_after_json.get("mastery", 0.0) if res.mastery_after_json else 0.0
    mastery_before = res.mastery_before_json.get("mastery", 0.0) if res.mastery_before_json else 0.0

    return ReportCardResponse(
        test_id=test.id,
        topic_id=topic.id,
        topic_title=topic.title,
        score=res.score,
        total_questions=len(answers),
        accuracy=res.accuracy,
        duration_seconds=res.duration_seconds,
        mastery_before=mastery_before,
        mastery_after=mastery_after,
        strong_areas=res.strong_json or [],
        needs_practice_areas=[],
        weak_areas=res.weak_json or [],
        improving_areas=res.improving_json or [],
        recommended_next=res.recommended_next_json or {},
        xp_earned=40,
        answers_review=review
    )
