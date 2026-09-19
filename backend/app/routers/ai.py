from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.models.curriculum import Subtopic, Topic
from app.models.content import Question, Explanation
from app.models.learning import MasteryScore, Answer
from app.models.ai import AIConversation, AIMessage
from app.deps import get_current_user, get_optional_user
from app.ai.service import ai_service
from app.schemas.ai import (
    AIGeneratePathRequest, AIGenerateQuestionsRequest, AIExplainRequest,
    AITutorMessageRequest, AITutorResponse
)

router = APIRouter(prefix="/ai", tags=["AI Integration"])

@router.post("/generate-path")
async def generate_path(
    req: AIGeneratePathRequest,
    user: Optional[User] = Depends(get_optional_user)
):
    learner_type = user.profile.learner_type if user and user.profile else req.learner_type
    return await ai_service.generate_learning_path(
        topic_text=req.topic_text,
        learner_type=learner_type,
        level_hint=req.level_hint or "beginner"
    )

@router.post("/generate-questions")
async def generate_questions(
    req: AIGenerateQuestionsRequest,
    db: Session = Depends(get_db)
):
    subtopic = db.query(Subtopic).filter(Subtopic.id == req.subtopic_id).first()
    if not subtopic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found.")

    existing_qs = db.query(Question.stem).filter(Question.subtopic_id == subtopic.id).all()
    avoid_stems = [s[0] for s in existing_qs] + (req.avoid_stems or [])

    qs = await ai_service.generate_questions(
        subtopic_title=subtopic.title,
        concept_tag=subtopic.concept_tag,
        difficulty=req.difficulty,
        n=req.n,
        avoid_stems=avoid_stems
    )
    return {"subtopic_id": subtopic.id, "questions": qs}

@router.post("/explain")
async def generate_explanation(
    req: AIExplainRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    subtopic = db.query(Subtopic).filter(Subtopic.id == req.subtopic_id).first()
    if not subtopic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found.")

    student_ctx = {}
    if user:
        score = db.query(MasteryScore).filter(
            MasteryScore.user_id == user.id,
            MasteryScore.subtopic_id == subtopic.id
        ).first()
        if score:
            student_ctx = {"mastery": score.mastery, "status": score.status, "attempts": score.attempts}

    return await ai_service.explain(
        subtopic_title=subtopic.title,
        concept_tag=subtopic.concept_tag,
        level=req.level or "intermediate",
        student_context=student_ctx
    )

@router.post("/tutor", response_model=AITutorResponse)
async def tutor_chat(
    req: AITutorMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve or create conversation thread
    conv = None
    if req.conversation_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == req.conversation_id,
            AIConversation.user_id == user.id
        ).first()

    if not conv:
        conv = AIConversation(
            user_id=user.id,
            topic_id=req.topic_id,
            subtopic_id=req.subtopic_id,
            mode=req.mode or "open",
            title=f"Chat: {req.message[:30]}..."
        )
        db.add(conv)
        db.flush()

    # Assemble student pedagogical context
    context: Dict[str, Any] = {
        "user_id": user.id,
        "mode": req.mode or "open"
    }

    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
        if topic:
            context["topic_title"] = topic.title

    if req.subtopic_id:
        subtopic = db.query(Subtopic).filter(Subtopic.id == req.subtopic_id).first()
        if subtopic:
            context["subtopic_title"] = subtopic.title
            score = db.query(MasteryScore).filter(
                MasteryScore.user_id == user.id,
                MasteryScore.subtopic_id == subtopic.id
            ).first()
            if score:
                context["mastery"] = score.mastery
                context["status"] = score.status
                context["difficulty"] = score.last_difficulty

    # Get last 3 mistakes for context
    mistakes = db.query(Answer).join(Question).filter(
        Answer.user_id == user.id,
        Answer.is_correct == False
    ).order_by(Answer.answered_at.desc()).limit(3).all()

    context["recent_mistakes"] = [
        {"stem": m.question.stem, "explanation": m.question.explanation}
        for m in mistakes
    ]

    # Save student message
    db.add(AIMessage(
        conversation_id=conv.id,
        role="user",
        content=req.message
    ))

    # Generate reply via AI Service
    reply_data = await ai_service.tutor_reply(req.message, context)

    # Save assistant message
    db.add(AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=reply_data.get("reply", ""),
        context_snapshot_json=context
    ))
    db.commit()

    return AITutorResponse(
        conversation_id=conv.id,
        message_id=str(conv.id),
        reply=reply_data.get("reply", ""),
        action_trigger=reply_data.get("action_trigger"),
        action_payload=reply_data.get("action_payload"),
        visual_spec=reply_data.get("visual_spec"),
        is_demo_fallback=reply_data.get("is_demo_fallback", False)
    )
