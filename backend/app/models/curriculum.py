import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from app.db import Base

def utcnow():
    return datetime.now(timezone.utc)

class Board(Base):
    __tablename__ = "boards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)  # CBSE, ICSE, STATE, OTHER
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subjects = relationship("Subject", back_populates="board")

class SchoolClass(Base):
    __tablename__ = "classes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grade = Column(Integer, unique=True, nullable=False, index=True)  # 5 - 12
    name = Column(String(50), nullable=False)  # "Class 10"
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subjects = relationship("Subject", back_populates="school_class")

class Stream(Base):
    __tablename__ = "streams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)  # SCIENCE, COMMERCE, ARTS
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subjects = relationship("Subject", back_populates="stream")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    board_id = Column(String(36), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    icon = Column(String(50), default="book", nullable=False)
    color = Column(String(50), default="#6366F1", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    school_class = relationship("SchoolClass", back_populates="subjects")
    board = relationship("Board", back_populates="subjects")
    stream = relationship("Stream", back_populates="subjects")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    order = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subject = relationship("Subject", back_populates="chapters")
    topics = relationship("Topic", back_populates="chapter", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chapter_id = Column(String(36), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=True, index=True)
    owner_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    source = Column(String(30), default="seed", nullable=False)  # seed, ai, demo_pack
    mode_origin = Column(String(20), default="school", nullable=False)  # school, open
    status = Column(String(20), default="published", nullable=False)  # published, draft
    order = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    chapter = relationship("Chapter", back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic", cascade="all, delete-orphan", order_by="Subtopic.order")

class Subtopic(Base):
    __tablename__ = "subtopics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    order = Column(Integer, default=1, nullable=False)
    prerequisite_subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="SET NULL"), nullable=True)
    concept_tag = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    topic = relationship("Topic", back_populates="subtopics")
    questions = relationship("Question", back_populates="subtopic", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="subtopic", cascade="all, delete-orphan")
    explanations = relationship("Explanation", back_populates="subtopic", cascade="all, delete-orphan")
    mastery_scores = relationship("MasteryScore", back_populates="subtopic", cascade="all, delete-orphan")
