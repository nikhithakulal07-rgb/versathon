import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from app.db import Base

def utcnow():
    return datetime.now(timezone.utc)

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    subtopic_id = Column(String(36), ForeignKey("subtopics.id", ondelete="SET NULL"), nullable=True, index=True)
    mode = Column(String(20), default="open", nullable=False)  # open, tutor, school
    title = Column(String(200), default="New Learning Thread", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    context_snapshot_json = Column(JSON, nullable=True)  # snapshot of mastery/difficulty/mistakes at that time
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    conversation = relationship("AIConversation", back_populates="messages")
