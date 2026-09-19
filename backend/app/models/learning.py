import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from app.db import Base

def utcnow():
    return datetime.now(timezone.utc)

class MasteryScore(Base):
    __tablename__ = "mastery_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False, index=True)
    theta = Column(Float, default=0.0, nullable=False)
    mastery = Column(Float, default=0.0, nullable=False)  # 0 to 100
    confidence = Column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    attempts = Column(Integer, default=0, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    consecutive_correct = Column(Integer, default=0, nullable=False)
    consecutive_wrong = Column(Integer, default=0, nullable=False)
    last_difficulty = Column(Integer, default=3, nullable=False)
    last_practiced_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    status = Column(String(20), default="unassessed", nullable=False)  # unassessed, weak, needs_practice, strong, mastered
    trend = Column(String(20), default="steady", nullable=False)  # improving, steady, declining
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="mastery_scores")
    subtopic = relationship("Subtopic", back_populates="mastery_scores")

    __table_args__ = (
        Index("ix_mastery_user_subtopic", "user_id", "subtopic_id", unique=True),
    )

class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(50), nullable=True, index=True)
    session_type = Column(String(30), default="practice", nullable=False)  # diagnostic, practice, test, daily, revision, game
    chosen_index = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Float, default=0.0, nullable=False)
    difficulty = Column(Integer, nullable=False)
    hint_used = Column(Boolean, default=False, nullable=False)
    answered_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")

class DiagnosticResult(Base):
    __tablename__ = "diagnostic_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    summary_json = Column(JSON, nullable=True)  # per-subtopic scores, strong/weak tags
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class LearningHistory(Base):
    __tablename__ = "learning_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # lesson_viewed, visual_interacted, test_completed, etc.
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="SET NULL"), nullable=True)
    payload_json = Column(JSON, nullable=True)
    duration_seconds = Column(Float, default=0.0, nullable=False)
    mode_used = Column(String(20), default="school", nullable=False)  # school, open, game
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class FlashcardResponse(Base):
    __tablename__ = "flashcard_responses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    flashcard_id = Column(String(36), ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    response = Column(String(20), nullable=False)  # know, revise
    leitner_box = Column(Integer, default=1, nullable=False)  # 1 to 3
    due_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    responded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    flashcard = relationship("Flashcard", back_populates="responses")

class Test(Base):
    __tablename__ = "tests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), default="adaptive", nullable=False)  # adaptive, daily, boss, diagnostic
    mode_used = Column(String(20), default="school", nullable=False)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    results = relationship("TestResult", back_populates="test", uselist=False, cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id = Column(String(36), ForeignKey("tests.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    score = Column(Integer, default=0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    mastery_before_json = Column(JSON, nullable=True)
    mastery_after_json = Column(JSON, nullable=True)
    strong_json = Column(JSON, nullable=True)
    weak_json = Column(JSON, nullable=True)
    improving_json = Column(JSON, nullable=True)
    recommended_next_json = Column(JSON, nullable=True)
    duration_seconds = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    test = relationship("Test", back_populates="results")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False)  # explain_easy, practice_easy, practice_medium, practice_advanced, revise_flashcards, retest, next_topic
    reason_text = Column(Text, nullable=False)
    priority = Column(Float, default=1.0, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, completed, dismissed
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
