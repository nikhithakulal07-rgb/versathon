import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from app.db import Base

def utcnow():
    return datetime.now(timezone.utc)

class UserXP(Base):
    __tablename__ = "user_xp"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    total_xp = Column(Integer, default=0, nullable=False, index=True)
    level = Column(Integer, default=1, nullable=False)
    week_xp = Column(Integer, default=0, nullable=False, index=True)
    week_start = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="xp")

class XPEvent(Base):
    __tablename__ = "xp_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False)
    ref_type = Column(String(50), nullable=True)  # question, lesson, flashcard, test, streak, daily_challenge
    ref_id = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class Badge(Base):
    __tablename__ = "badges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    emoji = Column(String(20), default="🏆", nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(50), default="achievement", nullable=False)  # streak, mastery, speed, test, revision, special
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user_badges = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(36), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")

    __table_args__ = (
        Index("ix_user_badge_unique", "user_id", "badge_id", unique=True),
    )

class Streak(Base):
    __tablename__ = "streaks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)
    freezes_available = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="streak")

class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_ids_json = Column(JSON, nullable=False)  # List[str] of question IDs
    completed_at = Column(DateTime(timezone=True), nullable=True)
    xp_awarded = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_daily_challenge_user_date", "user_id", "date", unique=True),
    )

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, accepted
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_friendship_pair", "user_id", "friend_user_id", unique=True),
    )

class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scope = Column(String(20), nullable=False)  # global, school, class, friends
    scope_id = Column(String(50), nullable=True)
    period = Column(String(20), nullable=False)  # week, all
    rank_data_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
