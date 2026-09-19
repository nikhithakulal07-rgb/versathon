import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from app.db import Base

def utcnow():
    return datetime.now(timezone.utc)

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_tag = Column(String(100), nullable=False, index=True)
    stem = Column(Text, nullable=False)
    options_json = Column(JSON, nullable=False)  # List[str] of 4 options
    correct_index = Column(Integer, nullable=False)  # 0 to 3
    difficulty = Column(Integer, nullable=False, index=True)  # 1 to 5
    expected_time_seconds = Column(Integer, default=45, nullable=False)
    explanation = Column(Text, nullable=False)
    misconception_hints_json = Column(JSON, nullable=True)  # Dict[str, str] or List[str]
    source = Column(String(30), default="seed", nullable=False)  # seed, ai
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subtopic = relationship("Subtopic", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    concept_tag = Column(String(100), nullable=False)
    source = Column(String(30), default="seed", nullable=False)  # seed, ai
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subtopic = relationship("Subtopic", back_populates="flashcards")
    responses = relationship("FlashcardResponse", back_populates="flashcard", cascade="all, delete-orphan")

class Explanation(Base):
    __tablename__ = "explanations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False, index=True)
    level = Column(String(20), nullable=False)  # beginner, intermediate, advanced
    body_markdown = Column(Text, nullable=False)
    visual_spec_json = Column(JSON, nullable=True)  # {"type": "CircuitDiagram", "props": {...}}
    source = Column(String(30), default="seed", nullable=False)  # seed, ai
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subtopic = relationship("Subtopic", back_populates="explanations")

    __table_args__ = (
        Index("ix_explanations_subtopic_level", "subtopic_id", "level"),
    )
