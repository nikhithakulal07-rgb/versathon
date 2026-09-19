from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class GameProfileResponse(BaseModel):
    user_id: str
    coins: int
    avatar_frame: str
    equipped_cosmetics: Dict[str, Any]

class CosmeticResponse(BaseModel):
    id: str
    code: str
    name: str
    kind: str
    cost: int
    preview_svg: Optional[str] = None
    description: str
    is_owned: bool = False
    is_equipped: bool = False

class MissionStage(BaseModel):
    stage: int
    name: str
    type: str
    desc: str

class MissionResponse(BaseModel):
    id: str
    code: str
    name: str
    region: str
    description: str
    stages: List[Dict[str, Any]]
    current_stage: int = 1
    stars: int = 0
    is_completed: bool = False

class QuestResponse(BaseModel):
    id: str
    code: str
    title: str
    kind: str
    target_count: int
    current_count: int = 0
    xp_reward: int
    coin_reward: int
    is_completed: bool = False
    is_claimed: bool = False
