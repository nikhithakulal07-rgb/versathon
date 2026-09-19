from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.curriculum import Topic, Subtopic
from app.models.content import Explanation
from app.models.learning import MasteryScore, LearningHistory
from app.models.user import User
from app.deps import get_current_user, get_optional_user
from app.engine.explain_level import determine_explanation_level
from app.ai.service import ai_service

router = APIRouter(prefix="/learn", tags=["Learning Pipeline"])

@router.get("/explanations")
async def get_subtopic_explanation(
    subtopic_id: str,
    level: Optional[str] = None,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized explanation for a subtopic.
    If level is not explicitly provided, selects level dynamically based on user mastery!
    """
    subtopic = db.query(Subtopic).filter(Subtopic.id == subtopic_id).first()
    if not subtopic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found.")

    # Determine level from engine if not specified
    if not level:
        mastery = 0.0
        if user:
            score = db.query(MasteryScore).filter(
                MasteryScore.user_id == user.id,
                MasteryScore.subtopic_id == subtopic.id
            ).first()
            if score:
                mastery = score.mastery
        level = determine_explanation_level(mastery)

    # Fetch matching explanation from DB
    exp = db.query(Explanation).filter(
        Explanation.subtopic_id == subtopic.id,
        Explanation.level == level
    ).first()

    if not exp:
        # Dynamically generate and persist explanation for this level
        exp_data = await ai_service.explain(subtopic.title, subtopic.concept_tag, level)
        exp = Explanation(
            subtopic_id=subtopic.id,
            level=level,
            body_markdown=exp_data.get("body_markdown", f"Explanation of {subtopic.title} at {level} level."),
            visual_spec_json=exp_data.get("visual_spec"),
            source="ai"
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)

    # Log learning history
    if user:
        db.add(LearningHistory(
            user_id=user.id,
            event_type="explanation_viewed",
            topic_id=subtopic.topic_id,
            subtopic_id=subtopic.id,
            payload_json={"level": level}
        ))
        db.commit()

    return {
        "subtopic_id": subtopic.id,
        "subtopic_title": subtopic.title,
        "level": level,
        "body_markdown": exp.body_markdown,
        "visual_spec": exp.visual_spec_json,
        "source": exp.source
    }

@router.get("/topics/{id}/pipeline-state")
def get_topic_pipeline_state(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the stage progression checklist for a topic:
    Diagnostic -> Mastery Analysis -> Explanation -> Visual -> Flashcards -> Revision Required -> Test -> Report Card -> Next Recommendation.
    """
    topic = db.query(Topic).filter(Topic.id == id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    subtopic_ids = [s.id for s in topic.subtopics]
    scores = db.query(MasteryScore).filter(
        MasteryScore.user_id == user.id,
        MasteryScore.subtopic_id.in_(subtopic_ids)
    ).all()
    score_map = {sc.subtopic_id: sc for sc in scores}

    # Pipeline flags
    has_diagnostic = len(scores) > 0
    has_mastery = any(s.attempts > 0 for s in scores)
    has_completed_test = any(s.attempts >= 5 for s in scores)
    overall_mastery = round(sum(s.mastery for s in scores) / len(scores), 1) if scores else 0.0

    stages = [
        {"key": "structure", "name": "Topic Structure", "status": "completed"},
        {"key": "diagnostic", "name": "Diagnostic Assessment", "status": "completed" if has_diagnostic else "ready"},
        {"key": "analysis", "name": "Mastery Analysis", "status": "completed" if has_mastery else "locked"},
        {"key": "explanation", "name": "Personalized Concepts & Visuals", "status": "ready" if has_diagnostic else "locked"},
        {"key": "flashcards", "name": "Active Recall Flashcards", "status": "ready" if has_diagnostic else "locked"},
        {"key": "revision", "name": "Revision Required", "status": "ready" if has_diagnostic else "locked"},
        {"key": "test", "name": "Adaptive Mastery Assessment", "status": "ready" if has_diagnostic else "locked"},
        {"key": "report", "name": "Performance Report Card", "status": "completed" if has_completed_test else "locked"}
    ]

    return {
        "topic_id": topic.id,
        "topic_title": topic.title,
        "overall_mastery": overall_mastery,
        "stages": stages
    }
