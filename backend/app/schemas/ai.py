from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AIGeneratePathRequest(BaseModel):
    topic_text: str = Field(..., min_length=2, max_length=200)
    learner_type: Optional[str] = "general"
    level_hint: Optional[str] = "beginner"

class AIGenerateQuestionsRequest(BaseModel):
    subtopic_id: str
    difficulty: int = Field(3, ge=1, le=5)
    n: int = Field(4, ge=1, le=10)
    avoid_stems: Optional[List[str]] = []

class AIExplainRequest(BaseModel):
    subtopic_id: str
    level: Optional[str] = Field("intermediate", pattern="^(beginner|intermediate|advanced)$")

class AITutorMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_id: Optional[str] = None
    topic_id: Optional[str] = None
    subtopic_id: Optional[str] = None
    mode: Optional[str] = "open"

class AITutorResponse(BaseModel):
    conversation_id: str
    message_id: str
    reply: str
    action_trigger: Optional[str] = None  # explain, test, question, practice
    action_payload: Optional[Dict[str, Any]] = None
    visual_spec: Optional[Dict[str, Any]] = None
    is_demo_fallback: bool = False

class AIConversationResponse(BaseModel):
    id: str
    title: str
    mode: str
    created_at: str
    last_message: Optional[str] = None
