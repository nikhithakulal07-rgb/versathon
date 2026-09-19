from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class XPStatusResponse(BaseModel):
    total_xp: int
    level: int
    level_title: str
    current_level_xp: int
    next_level_xp: int
    progress_pct: float
    week_xp: int

class BadgeResponse(BaseModel):
    id: str
    code: str
    name: str
    emoji: str
    description: str
    category: str
    is_earned: bool = False
    earned_at: Optional[str] = None

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    freezes_available: int
    active_today: bool

class DailyChallengeResponse(BaseModel):
    id: str
    date: str
    is_completed: bool
    xp_awarded: int
    questions: List[Dict[str, Any]]

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    display_avatar: str
    total_xp: int
    level: int
    is_current_user: bool = False
    school_name: Optional[str] = None

class FriendResponse(BaseModel):
    id: str
    username: str
    display_avatar: str
    total_xp: int
    level: int
    status: str
