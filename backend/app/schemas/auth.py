from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

class OnboardingRequest(BaseModel):
    learner_type: str = Field(..., pattern="^(school|university|engineering|general)$")
    preferred_mode: Optional[str] = Field("school", pattern="^(school|open|game)$")
    class_id: Optional[str] = None
    board_id: Optional[str] = None
    stream_id: Optional[str] = None
    school_name: Optional[str] = None
    theme: Optional[str] = "system"

class ProfileUpdateRequest(BaseModel):
    display_avatar: Optional[str] = None
    preferred_mode: Optional[str] = None
    school_name: Optional[str] = None
    leaderboard_opt_in: Optional[bool] = None
    theme: Optional[str] = None
    class_id: Optional[str] = None
    board_id: Optional[str] = None
    stream_id: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    learner_type: str
    preferred_mode: str
    display_avatar: str
    school_name: Optional[str] = None
    leaderboard_opt_in: bool = True
    theme: str = "system"
    class_id: Optional[str] = None
    board_id: Optional[str] = None
    stream_id: Optional[str] = None
    total_xp: int = 0
    level: int = 1
    current_streak: int = 0
    coins: int = 0
