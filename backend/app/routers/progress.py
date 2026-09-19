from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.models.curriculum import Topic, Subtopic
from app.models.learning import MasteryScore, Recommendation, LearningHistory, TestResult, Test
from app.deps import get_current_user
from app.engine.recommender import calculate_subtopic_priority, generate_subtopic_recommendation
from app.schemas.learning import RecommendationResponse

router = APIRouter(tags=["Progress & Analytics"])

@router.get("/mastery")
def get_user_mastery(
    topic_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MasteryScore).join(Subtopic).filter(MasteryScore.user_id == user.id)
    if topic_id:
        query = query.filter(Subtopic.topic_id == topic_id)

    scores = query.all()
    subtopic_results = []
    total_mastery = 0.0

    for sc in scores:
        total_mastery += sc.mastery
        subtopic_results.append({
            "subtopic_id": sc.subtopic_id,
            "subtopic_title": sc.subtopic.title,
            "topic_id": sc.subtopic.topic_id,
            "topic_title": sc.subtopic.topic.title if sc.subtopic.topic else "",
            "mastery": sc.mastery,
            "status": sc.status,
            "trend": sc.trend,
            "attempts": sc.attempts,
            "correct_count": sc.correct_count,
            "last_difficulty": sc.last_difficulty,
            "last_practiced_at": sc.last_practiced_at.isoformat() if sc.last_practiced_at else None
        })

    avg_mastery = round(total_mastery / len(scores), 1) if scores else 0.0

    return {
        "overall_mastery": avg_mastery,
        "assessed_subtopics_count": len(scores),
        "scores": subtopic_results
    }

@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch active recommendations from DB or generate live from latest mastery
    recs = db.query(Recommendation).filter(
        Recommendation.user_id == user.id,
        Recommendation.status == "active"
    ).order_by(Recommendation.priority.desc()).limit(5).all()

    if not recs:
        # Generate on the fly from mastery scores
        scores = db.query(MasteryScore).filter(MasteryScore.user_id == user.id).all()
        for sc in scores:
            prio = calculate_subtopic_priority(
                mastery=sc.mastery,
                recent_mistake_rate=0.4 if sc.status == "weak" else 0.1,
                flashcard_revise_rate=0.0,
                last_practiced_at=sc.last_practiced_at
            )
            r_dict = generate_subtopic_recommendation(
                subtopic_id=sc.subtopic_id,
                subtopic_title=sc.subtopic.title,
                mastery=sc.mastery,
                status=sc.status,
                trend=sc.trend,
                priority=prio
            )
            rec_obj = Recommendation(
                user_id=user.id,
                topic_id=sc.subtopic.topic_id,
                subtopic_id=sc.subtopic_id,
                action=r_dict["action"],
                reason_text=r_dict["reason_text"],
                priority=prio,
                status="active"
            )
            db.add(rec_obj)
            recs.append(rec_obj)
        db.commit()

    res = []
    for r in recs:
        sub_title = r.subtopic.title if r.subtopic else "General Concept"
        res.append(RecommendationResponse(
            id=r.id,
            topic_id=r.topic_id,
            subtopic_id=r.subtopic_id,
            subtopic_title=sub_title,
            action=r.action,
            reason_text=r.reason_text,
            priority=r.priority,
            status=r.status
        ))
    return res

@router.get("/progress/history")
def get_progress_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(LearningHistory).filter(
        LearningHistory.user_id == user.id
    ).order_by(LearningHistory.created_at.desc()).limit(30).all()

    return [
        {
            "id": h.id,
            "event_type": h.event_type,
            "topic_id": h.topic_id,
            "subtopic_id": h.subtopic_id,
            "mode_used": h.mode_used,
            "payload": h.payload_json,
            "duration_seconds": h.duration_seconds,
            "created_at": h.created_at.isoformat()
        }
        for h in history
    ]

@router.get("/reports")
def get_user_reports(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = db.query(TestResult).join(Test).filter(
        Test.user_id == user.id
    ).order_by(TestResult.created_at.desc()).all()

    return [
        {
            "test_id": r.test_id,
            "topic_id": r.test.topic_id,
            "topic_title": r.test.topic.title if r.test.topic else "Assessment",
            "score": r.score,
            "accuracy": r.accuracy,
            "duration_seconds": r.duration_seconds,
            "mastery_before": r.mastery_before_json.get("mastery", 0.0) if r.mastery_before_json else 0.0,
            "mastery_after": r.mastery_after_json.get("mastery", 0.0) if r.mastery_after_json else 0.0,
            "created_at": r.created_at.isoformat()
        }
        for r in results
    ]
