from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.models.curriculum import Subtopic, Topic
from app.models.content import Flashcard, Explanation, Question
from app.models.learning import FlashcardResponse, MasteryScore, LearningHistory
from app.models.gamification import UserXP, XPEvent
from app.deps import get_current_user, get_optional_user
from app.engine.flashcards import process_flashcard_swipe
from app.engine.xp import get_level_from_xp
from app.schemas.learning import FlashcardSwipeRequest, FlashcardResponseModel
from app.ai.service import ai_service

router = APIRouter(tags=["Flashcards & Revision"])

@router.get("/subtopics/{id}/flashcards", response_model=List[FlashcardResponseModel])
async def get_subtopic_flashcards(
    id: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    subtopic = db.query(Subtopic).filter(Subtopic.id == id).first()
    if not subtopic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found.")

    flashcards = subtopic.flashcards
    if not flashcards:
        # Dynamically generate flashcards
        fcs = await ai_service.generate_flashcards(subtopic.title, subtopic.concept_tag, 5)
        for fc in fcs:
            new_fc = Flashcard(
                subtopic_id=subtopic.id,
                front=fc["front"],
                back=fc["back"],
                concept_tag=subtopic.concept_tag,
                source="ai"
            )
            db.add(new_fc)
        db.commit()
        db.refresh(subtopic)
        flashcards = subtopic.flashcards

    # Retrieve user Leitner box for each card if logged in
    box_map = {}
    if user:
        responses = db.query(FlashcardResponse).filter(
            FlashcardResponse.user_id == user.id,
            FlashcardResponse.flashcard_id.in_([fc.id for fc in flashcards])
        ).all()
        box_map = {r.flashcard_id: r.leitner_box for r in responses}

    return [
        FlashcardResponseModel(
            id=fc.id,
            subtopic_id=fc.subtopic_id,
            front=fc.front,
            back=fc.back,
            concept_tag=fc.concept_tag,
            leitner_box=box_map.get(fc.id, 1)
        )
        for fc in flashcards
    ]

@router.post("/flashcards/{id}/respond")
def respond_to_flashcard(
    id: str,
    req: FlashcardSwipeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    flashcard = db.query(Flashcard).filter(Flashcard.id == id).first()
    if not flashcard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")

    # Find existing response entry or create new
    f_resp = db.query(FlashcardResponse).filter(
        FlashcardResponse.user_id == user.id,
        FlashcardResponse.flashcard_id == flashcard.id
    ).first()

    curr_box = f_resp.leitner_box if f_resp else 1

    # Get current mastery for nudge
    score = db.query(MasteryScore).filter(
        MasteryScore.user_id == user.id,
        MasteryScore.subtopic_id == flashcard.subtopic_id
    ).first()
    curr_mastery = score.mastery if score else 50.0

    new_box, due_at, updated_mastery = process_flashcard_swipe(
        current_box=curr_box,
        response=req.response,
        current_mastery=curr_mastery
    )

    if not f_resp:
        f_resp = FlashcardResponse(
            user_id=user.id,
            flashcard_id=flashcard.id,
            response=req.response,
            leitner_box=new_box,
            due_at=due_at,
            responded_at=datetime.now(timezone.utc)
        )
        db.add(f_resp)
    else:
        f_resp.response = req.response
        f_resp.leitner_box = new_box
        f_resp.due_at = due_at
        f_resp.responded_at = datetime.now(timezone.utc)

    # Apply mastery nudge
    if score:
        score.mastery = updated_mastery

    db.commit()

    return {
        "flashcard_id": flashcard.id,
        "new_box": new_box,
        "due_at": due_at.isoformat(),
        "updated_mastery": updated_mastery,
        "response": req.response
    }

@router.post("/flashcards/session/finish")
def finish_flashcard_session(
    subtopic_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subtopic = db.query(Subtopic).filter(Subtopic.id == subtopic_id).first()
    if not subtopic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found.")

    xp_awarded = 15
    db.add(XPEvent(
        user_id=user.id,
        amount=xp_awarded,
        reason=f"Completed Flashcard Deck for {subtopic.title}",
        ref_type="flashcard",
        ref_id=subtopic.id
    ))

    user_xp = user.xp
    if user_xp:
        user_xp.total_xp += xp_awarded
        user_xp.week_xp += xp_awarded
        lvl, _, _, _ = get_level_from_xp(user_xp.total_xp)
        user_xp.level = lvl

    db.commit()

    return {"message": "Flashcard session completed.", "xp_earned": xp_awarded}

@router.get("/revision/required")
def get_revision_required(
    topic_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the 'REVISION REQUIRED' queue containing all left-swiped / box-1 cards,
    paired with the concept explanation and a mini-practice question (difficulty 1-2).
    """
    query = db.query(FlashcardResponse).join(Flashcard).filter(
        FlashcardResponse.user_id == user.id,
        (FlashcardResponse.response == "revise") | (FlashcardResponse.leitner_box == 1)
    )

    if topic_id:
        query = query.join(Subtopic).filter(Subtopic.topic_id == topic_id)

    responses = query.all()
    queue = []

    for r in responses:
        fc = r.flashcard
        sub = fc.subtopic

        # Fetch explanation
        exp = db.query(Explanation).filter(
            Explanation.subtopic_id == sub.id,
            Explanation.level == "beginner"
        ).first()

        # Fetch mini practice question (difficulty 1 or 2)
        mini_q = db.query(Question).filter(
            Question.subtopic_id == sub.id,
            Question.difficulty.in_([1, 2])
        ).first()

        queue.append({
            "flashcard_id": fc.id,
            "subtopic_id": sub.id,
            "subtopic_title": sub.title,
            "concept_tag": fc.concept_tag,
            "front": fc.front,
            "back": fc.back,
            "leitner_box": r.leitner_box,
            "re_explanation": exp.body_markdown if exp else f"Review the fundamental concepts of {sub.title}.",
            "visual_spec": exp.visual_spec_json if exp else None,
            "mini_practice_question": {
                "id": mini_q.id,
                "stem": mini_q.stem,
                "options": mini_q.options_json,
                "difficulty": mini_q.difficulty,
                "explanation": mini_q.explanation
            } if mini_q else None
        })

    return {"total_cards": len(queue), "revision_queue": queue}
