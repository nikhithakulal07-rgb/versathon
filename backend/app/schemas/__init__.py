from app.schemas.auth import (
    SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    OnboardingRequest, ProfileUpdateRequest, UserProfileResponse
)
from app.schemas.curriculum import (
    BoardResponse, ClassResponse, StreamResponse, SubjectResponse,
    SubtopicResponse, TopicResponse, ChapterResponse
)
from app.schemas.learning import (
    AnswerSubmitRequest, AnswerSubmitResponse, DiagnosticStartRequest,
    DiagnosticNextQuestionResponse, TestStartRequest, TestNextQuestionResponse,
    FlashcardSwipeRequest, FlashcardResponseModel, RecommendationResponse,
    ReportCardResponse
)
from app.schemas.gamification import (
    XPStatusResponse, BadgeResponse, StreakResponse, DailyChallengeResponse,
    LeaderboardEntry, FriendResponse
)
from app.schemas.game import (
    GameProfileResponse, CosmeticResponse, MissionResponse, QuestResponse
)
from app.schemas.ai import (
    AIGeneratePathRequest, AIGenerateQuestionsRequest, AIExplainRequest,
    AITutorMessageRequest, AITutorResponse, AIConversationResponse
)
from app.schemas.meta import MetaResponse, AIHealthResponse

__all__ = [
    "SignupRequest", "LoginRequest", "ForgotPasswordRequest", "ResetPasswordRequest",
    "OnboardingRequest", "ProfileUpdateRequest", "UserProfileResponse",
    "BoardResponse", "ClassResponse", "StreamResponse", "SubjectResponse",
    "SubtopicResponse", "TopicResponse", "ChapterResponse",
    "AnswerSubmitRequest", "AnswerSubmitResponse", "DiagnosticStartRequest",
    "DiagnosticNextQuestionResponse", "TestStartRequest", "TestNextQuestionResponse",
    "FlashcardSwipeRequest", "FlashcardResponseModel", "RecommendationResponse",
    "ReportCardResponse",
    "XPStatusResponse", "BadgeResponse", "StreakResponse", "DailyChallengeResponse",
    "LeaderboardEntry", "FriendResponse",
    "GameProfileResponse", "CosmeticResponse", "MissionResponse", "QuestResponse",
    "AIGeneratePathRequest", "AIGenerateQuestionsRequest", "AIExplainRequest",
    "AITutorMessageRequest", "AITutorResponse", "AIConversationResponse",
    "MetaResponse", "AIHealthResponse"
]
