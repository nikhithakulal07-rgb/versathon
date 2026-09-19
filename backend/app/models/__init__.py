from app.db import Base
from app.models.user import User, Profile, PasswordResetToken
from app.models.curriculum import Board, SchoolClass, Stream, Subject, Chapter, Topic, Subtopic
from app.models.content import Question, Flashcard, Explanation
from app.models.learning import (
    MasteryScore, Answer, DiagnosticResult, LearningHistory,
    FlashcardResponse, Test, TestResult, Recommendation
)
from app.models.gamification import (
    UserXP, XPEvent, Badge, UserBadge, Streak, DailyChallenge,
    Friendship, LeaderboardSnapshot
)
from app.models.game import (
    GameProfile, Cosmetic, UserCosmetic, Mission, MissionProgress,
    Quest, UserQuest
)
from app.models.ai import AIConversation, AIMessage

__all__ = [
    "Base",
    "User", "Profile", "PasswordResetToken",
    "Board", "SchoolClass", "Stream", "Subject", "Chapter", "Topic", "Subtopic",
    "Question", "Flashcard", "Explanation",
    "MasteryScore", "Answer", "DiagnosticResult", "LearningHistory",
    "FlashcardResponse", "Test", "TestResult", "Recommendation",
    "UserXP", "XPEvent", "Badge", "UserBadge", "Streak", "DailyChallenge",
    "Friendship", "LeaderboardSnapshot",
    "GameProfile", "Cosmetic", "UserCosmetic", "Mission", "MissionProgress",
    "Quest", "UserQuest",
    "AIConversation", "AIMessage"
]
