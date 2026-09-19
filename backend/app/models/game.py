import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from app.db import Base

def utcnow():
    return datetime.now(timezone.utc)

class GameProfile(Base):
    __tablename__ = "game_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    coins = Column(Integer, default=100, nullable=False)
    avatar_frame = Column(String(50), default="frame-bronze", nullable=False)
    equipped_cosmetics_json = Column(JSON, default=dict, nullable=False)  # {"title": "Novice Explorer", "theme": "skyforge", "companion": "sparky"}
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="game_profile")
    user_cosmetics = relationship("UserCosmetic", back_populates="game_profile", cascade="all, delete-orphan")

class Cosmetic(Base):
    __tablename__ = "cosmetics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    kind = Column(String(30), nullable=False)  # avatar_frame, title, theme, companion
    cost = Column(Integer, default=50, nullable=False)
    preview_svg = Column(Text, nullable=True)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class UserCosmetic(Base):
    __tablename__ = "user_cosmetics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    game_profile_id = Column(String(36), ForeignKey("game_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    cosmetic_id = Column(String(36), ForeignKey("cosmetics.id", ondelete="CASCADE"), nullable=False, index=True)
    acquired_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    game_profile = relationship("GameProfile", back_populates="user_cosmetics")
    cosmetic = relationship("Cosmetic")

    __table_args__ = (
        Index("ix_user_cosmetic_unique", "game_profile_id", "cosmetic_id", unique=True),
    )

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    region = Column(String(100), default="Aetheria Outpost", nullable=False)
    description = Column(Text, nullable=False)
    stages_json = Column(JSON, nullable=False)  # [ {"stage": 1, "name": "SCOUT", "desc": "..."}, ... ]
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class MissionProgress(Base):
    __tablename__ = "mission_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True)
    stage = Column(Integer, default=1, nullable=False)  # 1: Scout, 2: Training, 3: Intel, 4: Challenge, 5: Boss
    stars = Column(Integer, default=0, nullable=False)  # 0 to 3
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_mission_progress_user_mission", "user_id", "mission_id", unique=True),
    )

class Quest(Base):
    __tablename__ = "quests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(100), nullable=False)
    kind = Column(String(20), default="daily", nullable=False)  # daily, weekly
    target_count = Column(Integer, default=1, nullable=False)
    xp_reward = Column(Integer, default=30, nullable=False)
    coin_reward = Column(Integer, default=20, nullable=False)
    action_type = Column(String(50), nullable=False)  # answer_questions, complete_flashcards, finish_test, streak_keep
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class UserQuest(Base):
    __tablename__ = "user_quests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quest_id = Column(String(36), ForeignKey("quests.id", ondelete="CASCADE"), nullable=False, index=True)
    current_count = Column(Integer, default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    reset_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_user_quest_user_date", "user_id", "quest_id", "reset_date", unique=True),
    )
