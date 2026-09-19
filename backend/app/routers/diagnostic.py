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
from app.models.learning import MasteryScore, Answer, DiagnosticResult, LearningHistory
from app.models.gamification import UserXP, XPEvent
from app.deps import get_current_user
from app.engine.selector import select_diagnostic_question
from app.engine.mastery import update_theta, calculate_mastery, determine_status
from app.engine.xp import calculate_session_xp, get_level_from_xp
from app.engine.recommender import calculate_subtopic_priority, generate_subtopic_recommendation
from app.schemas.learning import (
    DiagnosticStartRequest, DiagnosticNextQuestionResponse,
    AnswerSubmitRequest, AnswerSubmitResponse
)

router = APIRouter(prefix="/diagnostic", tags=["Diagnostic"])

@router.post("/start")
def start_diagnostic(
    req: DiagnosticStartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    # Create diagnostic record
    diag = DiagnosticResult(
        user_id=user.id,
        topic_id=topic.id,
        started_at=datetime.now(timezone.utc)
    )
    db.add(diag)

    # Log learning history event
    db.add(LearningHistory(
        user_id=user.id,
        event_type="diagnostic_started",
        topic_id=topic.id,
        mode_used=req.mode_used or "school"
    ))
    db.commit()
    db.refresh(diag)

    return {"diagnostic_id": diag.id, "topic_id": topic.id, "title": topic.title}

from app.ai.service import ai_service

@router.get("/{id}/next", response_model=DiagnosticNextQuestionResponse)
async def get_next_diagnostic_question(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diag = db.query(DiagnosticResult).filter(DiagnosticResult.id == id, DiagnosticResult.user_id == user.id).first()
    if not diag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnostic session not found.")

    if diag.completed_at:
        return DiagnosticNextQuestionResponse(
            diagnostic_id=diag.id,
            question=None,
            current_index=10,
            total_estimated=len(diag.topic.subtopics) if diag.topic else 5,
            is_completed=True,
            summary=diag.summary_json
        )

    topic = db.query(Topic).filter(Topic.id == diag.topic_id).first()
    subtopic_ids = [s.id for s in topic.subtopics]

    # Ensure all subtopics have questions generated (Universal diagnostic guarantee)
    for s in topic.subtopics:
        existing_count = db.query(Question).filter(Question.subtopic_id == s.id).count()
        if existing_count < 2:
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

    # Get answers already recorded in this session
    session_answers = db.query(Answer).filter(
        Answer.user_id == user.id,
        Answer.session_id == id,
        Answer.session_type == "diagnostic"
    ).all()

    answered_q_ids = {a.question_id for a in session_answers}
    answered_subtopics = set()
    recent_bools = []
    current_theta = 0.0

    for a in session_answers:
        answered_subtopics.add(a.question.subtopic_id)
        recent_bools.append(a.is_correct)

    # Calculate average current theta
    if subtopic_ids:
        m_scores = db.query(MasteryScore).filter(
            MasteryScore.user_id == user.id,
            MasteryScore.subtopic_id.in_(subtopic_ids)
        ).all()
        if m_scores:
            current_theta = sum(m.theta for m in m_scores) / len(m_scores)

    # Stop criteria: all subtopics assessed OR max 10 questions reached
    total_answers = len(session_answers)
    max_questions = max(5, min(10, len(subtopic_ids) * 2))
    all_covered = len(answered_subtopics) >= len(subtopic_ids) and total_answers >= len(subtopic_ids)

    if total_answers >= max_questions or (all_covered and total_answers >= min(5, len(subtopic_ids))):
        return DiagnosticNextQuestionResponse(
            diagnostic_id=diag.id,
            question=None,
            current_index=total_answers,
            total_estimated=max_questions,
            is_completed=True,
            summary=diag.summary_json
        )

    # Gather available questions from all subtopics of this topic
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

    chosen = select_diagnostic_question(
        available_questions=q_dicts,
        subtopic_ids=subtopic_ids,
        answered_subtopic_ids=answered_subtopics,
        answered_question_ids=answered_q_ids,
        current_theta=current_theta,
        recent_answers=recent_bools
    )

    if not chosen:
        return DiagnosticNextQuestionResponse(
            diagnostic_id=diag.id,
            question=None,
            current_index=total_answers,
            total_estimated=max_questions,
            is_completed=True,
            summary=diag.summary_json
        )

    # Return question without exposing correct answer
    question_payload = {
        "id": chosen["id"],
        "subtopic_id": chosen["subtopic_id"],
        "difficulty": chosen["difficulty"],
        "stem": chosen["stem"],
        "options": chosen["options"],
        "expected_time_seconds": chosen["expected_time_seconds"],
        "concept_tag": chosen["concept_tag"]
    }

    return DiagnosticNextQuestionResponse(
        diagnostic_id=diag.id,
        question=question_payload,
        current_index=total_answers + 1,
        total_estimated=max_questions,
        is_completed=False
    )

@router.post("/{id}/answer", response_model=AnswerSubmitResponse)
def submit_diagnostic_answer(
    id: str,
    req: AnswerSubmitRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diag = db.query(DiagnosticResult).filter(DiagnosticResult.id == id, DiagnosticResult.user_id == user.id).first()
    if not diag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnostic session not found.")

    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    is_correct = (req.chosen_index == question.correct_index)

    # 1. Record Answer
    answer = Answer(
        user_id=user.id,
        question_id=question.id,
        session_id=id,
        session_type="diagnostic",
        chosen_index=req.chosen_index,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds,
        difficulty=question.difficulty,
        hint_used=req.hint_used,
        answered_at=datetime.now(timezone.utc)
    )
    db.add(answer)

    # 2. Update Mastery Score using Diagnostic K multiplier
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

    # Theta update with diagnostic flag
    score.theta = update_theta(
        theta=score.theta,
        difficulty=question.difficulty,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken_seconds,
        expected_time_seconds=question.expected_time_seconds,
        hint_used=req.hint_used,
        attempts=score.attempts,
        is_diagnostic=True
    )

    # Fetch recent answers for mastery calculation
    recent_answers_db = db.query(Answer).filter(
        Answer.user_id == user.id,
        Answer.question_id == question.id
    ).order_by(Answer.answered_at.desc()).limit(8).all()
    recent_ans_dicts = [{"is_correct": a.is_correct, "difficulty": a.difficulty} for a in recent_answers_db]

    score.mastery = calculate_mastery(score.theta, recent_ans_dicts, score.attempts)
    score.status = determine_status(score.mastery, score.attempts, recent_ans_dicts)
    score.last_practiced_at = datetime.now(timezone.utc)
    score.last_difficulty = question.difficulty

    # 3. Calculate immediate answer XP
    xp_amount = 5 if is_correct else 1
    db.commit()

    # Misconception hint if incorrect
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
def finish_diagnostic(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diag = db.query(DiagnosticResult).filter(DiagnosticResult.id == id, DiagnosticResult.user_id == user.id).first()
    if not diag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnostic session not found.")

    topic = db.query(Topic).filter(Topic.id == diag.topic_id).first()
    subtopics = topic.subtopics

    # Retrieve all mastery scores for this topic
    subtopic_ids = [s.id for s in subtopics]
    scores = db.query(MasteryScore).filter(
        MasteryScore.user_id == user.id,
        MasteryScore.subtopic_id.in_(subtopic_ids)
    ).all()
    score_map = {sc.subtopic_id: sc for sc in scores}

    strong_areas = []
    needs_practice_areas = []
    weak_areas = []
    subtopic_summaries = []

    for s in subtopics:
        sc = score_map.get(s.id)
        m = sc.mastery if sc else 0.0
        st = sc.status if sc else "unassessed"

        if st == "strong" or st == "mastered" or m >= 75:
            strong_areas.append(s.title)
        elif st == "needs_practice" or (45 <= m < 75):
            needs_practice_areas.append(s.title)
        else:
            weak_areas.append(s.title)

        subtopic_summaries.append({
            "subtopic_id": s.id,
            "title": s.title,
            "mastery": m,
            "status": st
        })

    # Overall diagnostic summary
    summary_data = {
        "strong_areas": strong_areas,
        "needs_practice_areas": needs_practice_areas,
        "weak_areas": weak_areas,
        "subtopics": subtopic_summaries,
        "overall_mastery": round(sum(s["mastery"] for s in subtopic_summaries) / len(subtopic_summaries), 1) if subtopic_summaries else 0.0
    }

    diag.completed_at = datetime.now(timezone.utc)
    diag.summary_json = summary_data

    # Award 30 XP for completing diagnostic
    diag_xp = 30
    db.add(XPEvent(
        user_id=user.id,
        amount=diag_xp,
        reason="Completed Diagnostic Assessment",
        ref_type="diagnostic",
        ref_id=diag.id
    ))
    user_xp = user.xp
    if user_xp:
        user_xp.total_xp += diag_xp
        user_xp.week_xp += diag_xp
        lvl, _, _, _ = get_level_from_xp(user_xp.total_xp)
        user_xp.level = lvl

    db.commit()

    return {
        "message": "Diagnostic assessment completed successfully.",
        "xp_earned": diag_xp,
        "summary": summary_data
    }
