from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AnswerSubmitRequest(BaseModel):
    session_id: Optional[str] = None
    session_type: str = Field("practice", pattern="^(diagnostic|practice|test|daily|revision|game)$")
    question_id: str
    chosen_index: int = Field(..., ge=0, le=3)
    time_taken_seconds: float = Field(..., ge=0.0)
    hint_used: bool = False

class AnswerSubmitResponse(BaseModel):
    is_correct: bool
    correct_index: int
    explanation: str
    misconception_hint: Optional[str] = None
    xp_awarded: int
    new_mastery: float
    new_status: str
    new_difficulty: int
    streak: int
    level_up: Optional[Dict[str, Any]] = None
    new_badges: List[Dict[str, Any]] = []

class DiagnosticStartRequest(BaseModel):
    topic_id: str
    mode_used: Optional[str] = "school"

class DiagnosticNextQuestionResponse(BaseModel):
    diagnostic_id: str
    question: Optional[Dict[str, Any]] = None
    current_index: int
    total_estimated: int
    is_completed: bool
    summary: Optional[Dict[str, Any]] = None

class TestStartRequest(BaseModel):
    topic_id: str
    type: str = Field("adaptive", pattern="^(adaptive|daily|boss)$")
    mode_used: Optional[str] = "school"
    subtopic_id: Optional[str] = None

class TestNextQuestionResponse(BaseModel):
    test_id: str
    question: Optional[Dict[str, Any]] = None
    question_number: int
    total_questions: int
    is_completed: bool
    report: Optional[Dict[str, Any]] = None

class FlashcardSwipeRequest(BaseModel):
    flashcard_id: str
    response: str = Field(..., pattern="^(know|revise)$")

class FlashcardResponseModel(BaseModel):
    id: str
    subtopic_id: str
    front: str
    back: str
    concept_tag: str
    leitner_box: int = 1
    due_at: Optional[str] = None

class RecommendationResponse(BaseModel):
    id: str
    topic_id: str
    subtopic_id: Optional[str] = None
    subtopic_title: Optional[str] = None
    action: str
    reason_text: str
    priority: float
    status: str

class ReportCardResponse(BaseModel):
    test_id: str
    topic_id: str
    topic_title: str
    score: int
    total_questions: int
    accuracy: float
    duration_seconds: float
    mastery_before: float
    mastery_after: float
    strong_areas: List[str]
    needs_practice_areas: List[str]
    weak_areas: List[str]
    improving_areas: List[str]
    recommended_next: Dict[str, Any]
    xp_earned: int
    answers_review: List[Dict[str, Any]]
