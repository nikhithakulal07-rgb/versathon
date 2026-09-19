from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.curriculum import Topic, Subtopic
from app.models.content import Question, Flashcard, Explanation
from app.models.ai import AIConversation, AIMessage

from app.models.user import User
from app.deps import get_current_user, get_optional_user
from app.ai.service import ai_service
from app.schemas.ai import AIGeneratePathRequest, AIConversationResponse
from app.schemas.curriculum import TopicResponse, SubtopicResponse

router = APIRouter(prefix="/open", tags=["Open Learning"])

@router.post("/topics", response_model=TopicResponse)
async def create_open_topic(
    req: AIGeneratePathRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Creates an Open Learning topic dynamically from user prompt using AI or matched Demo Pack.
    Persists structured subtopics, starter explanations, and flashcards to DB.
    """
    topic_text = req.topic_text.strip()
    learner_type = user.profile.learner_type if user and user.profile else req.learner_type

    # 1. Generate path structure via AI Service
    path_data = await ai_service.generate_learning_path(
        topic_text=topic_text,
        learner_type=learner_type,
        level_hint=req.level_hint or "beginner"
    )

    # 2. Persist topic
    topic = Topic(
        chapter_id=None,
        owner_user_id=user.id if user else None,
        title=path_data.get("title", topic_text.title()),
        description=path_data.get("description", f"AI generated path for {topic_text}."),
        source="ai" if not ai_service._get_provider() == ai_service.mock_provider else "demo_pack",
        mode_origin="open",
        status="published",
        order=1
    )
    db.add(topic)
    db.flush()

    subtopics_resp = []
    # 3. Create subtopics & fetch starter questions/explanations asynchronously
    for idx, s in enumerate(path_data.get("subtopics", []), 1):
        concept_tag = s.get("concept_tag") or f"concept_{idx}"
        subtopic = Subtopic(
            topic_id=topic.id,
            title=s["title"],
            order=s.get("order", idx),
            concept_tag=concept_tag
        )
        db.add(subtopic)
        db.flush()

        # Generate all 3 explanation levels: beginner, intermediate, advanced
        for lvl in ["beginner", "intermediate", "advanced"]:
            exp_data = await ai_service.explain(subtopic.title, concept_tag, lvl)
            db.add(Explanation(
                subtopic_id=subtopic.id,
                level=lvl,
                body_markdown=exp_data.get("body_markdown", f"Explanation of {subtopic.title} at {lvl} level."),
                visual_spec_json=exp_data.get("visual_spec"),
                source="ai"
            ))

        # Generate starter flashcards
        fcs = await ai_service.generate_flashcards(subtopic.title, concept_tag, 5)
        for fc in fcs:
            db.add(Flashcard(
                subtopic_id=subtopic.id,
                front=fc["front"],
                back=fc["back"],
                concept_tag=concept_tag,
                source="ai"
            ))

        # Generate starter calibrated questions across difficulty levels
        qs = await ai_service.generate_questions(subtopic.title, concept_tag, 3, 6)
        for q in qs:
            db.add(Question(
                subtopic_id=subtopic.id,
                concept_tag=concept_tag,
                stem=q["stem"],
                options_json=q.get("options", q.get("options_json", [])),
                correct_index=q["correct_index"],
                difficulty=q.get("difficulty", 3),
                expected_time_seconds=q.get("expected_time_seconds", 45),
                explanation=q.get("explanation", ""),
                misconception_hints_json=q.get("misconception_hints", {}),
                source="ai"
            ))

        subtopics_resp.append(SubtopicResponse(
            id=subtopic.id,
            topic_id=subtopic.topic_id,
            title=subtopic.title,
            order=subtopic.order,
            concept_tag=subtopic.concept_tag,
            mastery=0.0,
            status="unassessed"
        ))

    db.commit()
    db.refresh(topic)

    return TopicResponse(
        id=topic.id,
        title=topic.title,
        description=topic.description,
        source=topic.source,
        mode_origin=topic.mode_origin,
        status=topic.status,
        order=topic.order,
        overall_mastery=0.0,
        subtopics=subtopics_resp
    )

@router.get("/topics", response_model=List[TopicResponse])
def get_open_topics(
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(Topic).filter(Topic.mode_origin == "open")
    if user:
        query = query.filter((Topic.owner_user_id == user.id) | (Topic.owner_user_id == None))
    else:
        query = query.filter(Topic.owner_user_id == None)

    topics = query.order_by(Topic.created_at.desc()).all()
    res = []
    for t in topics:
        sub_list = [
            SubtopicResponse(
                id=s.id,
                topic_id=s.topic_id,
                title=s.title,
                order=s.order,
                concept_tag=s.concept_tag,
                mastery=0.0,
                status="unassessed"
            )
            for s in t.subtopics
        ]
        res.append(TopicResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            source=t.source,
            mode_origin=t.mode_origin,
            status=t.status,
            order=t.order,
            overall_mastery=0.0,
            subtopics=sub_list
        ))
    return res

@router.get("/conversations", response_model=List[AIConversationResponse])
def get_user_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(AIConversation).filter(
        AIConversation.user_id == user.id
    ).order_by(AIConversation.created_at.desc()).all()

    res = []
    for c in convs:
        last_msg = c.messages[-1].content if c.messages else None
        res.append(AIConversationResponse(
            id=c.id,
            title=c.title,
            mode=c.mode,
            created_at=c.created_at.isoformat(),
            last_message=last_msg
        ))
    return res
