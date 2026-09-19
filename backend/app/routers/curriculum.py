from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.curriculum import Board, SchoolClass, Stream, Subject, Chapter, Topic, Subtopic
from app.models.learning import MasteryScore
from app.deps import get_optional_user
from app.models.user import User
from app.schemas.curriculum import (
    BoardResponse, ClassResponse, StreamResponse, SubjectResponse,
    ChapterResponse, TopicResponse, SubtopicResponse
)

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

@router.get("/classes", response_model=List[ClassResponse])
def get_classes(db: Session = Depends(get_db)):
    classes = db.query(SchoolClass).order_by(SchoolClass.grade).all()
    return [ClassResponse(id=c.id, grade=c.grade, name=c.name) for c in classes]

@router.get("/boards", response_model=List[BoardResponse])
def get_boards(db: Session = Depends(get_db)):
    boards = db.query(Board).all()
    return [BoardResponse(id=b.id, code=b.code, name=b.name) for b in boards]

@router.get("/streams", response_model=List[StreamResponse])
def get_streams(db: Session = Depends(get_db)):
    streams = db.query(Stream).all()
    return [StreamResponse(id=s.id, code=s.code, name=s.name) for s in streams]

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(
    class_id: Optional[str] = None,
    board_id: Optional[str] = None,
    stream_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if class_id:
        query = query.filter(Subject.class_id == class_id)
    if board_id:
        query = query.filter(Subject.board_id == board_id)
    if stream_id:
        query = query.filter(Subject.stream_id == stream_id)
    subjects = query.all()
    return [
        SubjectResponse(
            id=s.id,
            class_id=s.class_id,
            board_id=s.board_id,
            stream_id=s.stream_id,
            name=s.name,
            code=s.code,
            icon=s.icon,
            color=s.color
        )
        for s in subjects
    ]

@router.get("/chapters", response_model=List[ChapterResponse])
def get_chapters(
    subject_id: str,
    db: Session = Depends(get_db)
):
    chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).order_by(Chapter.order).all()
    res = []
    for ch in chapters:
        topics_resp = [
            TopicResponse(
                id=t.id,
                chapter_id=t.chapter_id,
                title=t.title,
                description=t.description,
                source=t.source,
                mode_origin=t.mode_origin,
                status=t.status,
                order=t.order
            )
            for t in ch.topics
        ]
        res.append(ChapterResponse(
            id=ch.id,
            subject_id=ch.subject_id,
            title=ch.title,
            order=ch.order,
            topics=topics_resp
        ))
    return res

@router.get("/topics", response_model=List[TopicResponse])
def get_topics(
    chapter_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Topic)
    if chapter_id:
        query = query.filter(Topic.chapter_id == chapter_id)
    topics = query.order_by(Topic.order).all()
    return [
        TopicResponse(
            id=t.id,
            chapter_id=t.chapter_id,
            title=t.title,
            description=t.description,
            source=t.source,
            mode_origin=t.mode_origin,
            status=t.status,
            order=t.order
        )
        for t in topics
    ]

@router.get("/topics/{id}", response_model=TopicResponse)
def get_topic_details(
    id: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    # Get mastery scores for this user if authenticated
    mastery_map = {}
    if user:
        subtopic_ids = [s.id for s in topic.subtopics]
        scores = db.query(MasteryScore).filter(
            MasteryScore.user_id == user.id,
            MasteryScore.subtopic_id.in_(subtopic_ids)
        ).all()
        mastery_map = {sc.subtopic_id: sc for sc in scores}

    subtopics_resp = []
    total_mastery = 0.0
    for s in topic.subtopics:
        sc = mastery_map.get(s.id)
        m_val = sc.mastery if sc else 0.0
        s_status = sc.status if sc else "unassessed"
        total_mastery += m_val

        subtopics_resp.append(SubtopicResponse(
            id=s.id,
            topic_id=s.topic_id,
            title=s.title,
            order=s.order,
            concept_tag=s.concept_tag,
            prerequisite_subtopic_id=s.prerequisite_subtopic_id,
            mastery=m_val,
            status=s_status
        ))

    overall_mastery = round(total_mastery / len(topic.subtopics), 1) if topic.subtopics else 0.0

    return TopicResponse(
        id=topic.id,
        chapter_id=topic.chapter_id,
        title=topic.title,
        description=topic.description,
        source=topic.source,
        mode_origin=topic.mode_origin,
        status=topic.status,
        order=topic.order,
        overall_mastery=overall_mastery,
        subtopics=subtopics_resp
    )
