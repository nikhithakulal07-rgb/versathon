from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.models.game import (
    GameProfile, Cosmetic, UserCosmetic, Mission, MissionProgress, Quest, UserQuest
)
from app.models.gamification import UserXP, XPEvent
from app.deps import get_current_user
from app.schemas.game import (
    GameProfileResponse, CosmeticResponse, MissionResponse, QuestResponse
)

router = APIRouter(prefix="/game", tags=["Game Mode - Skyforge Academy"])

@router.get("/profile", response_model=GameProfileResponse)
def get_game_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gp = user.game_profile
    if not gp:
        gp = GameProfile(user_id=user.id, coins=100, avatar_frame="frame_bronze")
        db.add(gp)
        db.commit()
        db.refresh(gp)

    return GameProfileResponse(
        user_id=gp.user_id,
        coins=gp.coins,
        avatar_frame=gp.avatar_frame,
        equipped_cosmetics=gp.equipped_cosmetics_json or {}
    )

@router.get("/missions", response_model=List[MissionResponse])
def get_missions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    missions = db.query(Mission).all()
    user_progress = db.query(MissionProgress).filter(MissionProgress.user_id == user.id).all()
    prog_map = {up.mission_id: up for up in user_progress}

    res = []
    for m in missions:
        up = prog_map.get(m.id)
        res.append(MissionResponse(
            id=m.id,
            code=m.code,
            name=m.name,
            region=m.region,
            description=m.description,
            stages=m.stages_json,
            current_stage=up.stage if up else 1,
            stars=up.stars if up else 0,
            is_completed=bool(up and up.completed_at)
        ))
    return res

@router.post("/missions/{id}/start")
def start_mission(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mission = db.query(Mission).filter(Mission.id == id).first()
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found.")

    up = db.query(MissionProgress).filter(
        MissionProgress.user_id == user.id,
        MissionProgress.mission_id == mission.id
    ).first()

    if not up:
        up = MissionProgress(
            user_id=user.id,
            mission_id=mission.id,
            stage=1,
            stars=0
        )
        db.add(up)
        db.commit()
        db.refresh(up)

    return {
        "mission_id": mission.id,
        "name": mission.name,
        "region": mission.region,
        "stage": up.stage,
        "stages": mission.stages_json
    }

@router.post("/missions/{id}/complete-stage")
def complete_mission_stage(
    id: str,
    stage: int,
    stars_earned: int = 3,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    up = db.query(MissionProgress).filter(
        MissionProgress.user_id == user.id,
        MissionProgress.mission_id == id
    ).first()

    if not up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission progress not found.")

    coin_reward = 20 * stage
    xp_reward = 30 * stage

    # Check if this was stage 5 (Boss victory)
    is_mission_completed = (stage >= 5)
    if is_mission_completed:
        up.completed_at = datetime.now(timezone.utc)
        coin_reward += 100
        xp_reward += 150
        up.stars = max(up.stars, stars_earned)
    else:
        up.stage = max(up.stage, stage + 1)
        up.stars = max(up.stars, stars_earned)

    # Award coins & XP
    gp = user.game_profile
    if gp:
        gp.coins += coin_reward

    db.add(XPEvent(
        user_id=user.id,
        amount=xp_reward,
        reason=f"Completed Mission Stage {stage}",
        ref_type="game_mission",
        ref_id=id
    ))
    user_xp = user.xp
    if user_xp:
        user_xp.total_xp += xp_reward
        user_xp.week_xp += xp_reward

    db.commit()

    return {
        "stage": up.stage,
        "is_completed": is_mission_completed,
        "stars": up.stars,
        "coins_earned": coin_reward,
        "xp_earned": xp_reward,
        "total_coins": gp.coins if gp else 0
    }

@router.get("/shop", response_model=List[CosmeticResponse])
def get_shop_items(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cosmetics = db.query(Cosmetic).all()
    user_cosmetics = db.query(UserCosmetic).filter(
        UserCosmetic.game_profile_id == user.game_profile.id
    ).all() if user.game_profile else []

    owned_ids = {uc.cosmetic_id for uc in user_cosmetics}
    equipped = user.game_profile.equipped_cosmetics_json or {} if user.game_profile else {}

    res = []
    for c in cosmetics:
        is_owned = c.id in owned_ids or c.cost == 0
        is_equipped = (
            (c.kind == "avatar_frame" and user.game_profile and user.game_profile.avatar_frame == c.code)
            or (equipped.get(c.kind) == c.name or equipped.get(c.kind) == c.code)
        )
        res.append(CosmeticResponse(
            id=c.id,
            code=c.code,
            name=c.name,
            kind=c.kind,
            cost=c.cost,
            preview_svg=c.preview_svg,
            description=c.description,
            is_owned=is_owned,
            is_equipped=is_equipped
        ))
    return res

@router.post("/shop/buy")
def buy_cosmetic(
    cosmetic_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cosmetic = db.query(Cosmetic).filter(Cosmetic.id == cosmetic_id).first()
    if not cosmetic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cosmetic item not found.")

    gp = user.game_profile
    if not gp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Game profile not found.")

    # Check if already owned
    existing = db.query(UserCosmetic).filter(
        UserCosmetic.game_profile_id == gp.id,
        UserCosmetic.cosmetic_id == cosmetic.id
    ).first()
    if existing:
        return {"message": "You already own this item!"}

    if gp.coins < cosmetic.cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INSUFFICIENT_COINS", "message": f"You need {cosmetic.cost} coins (current balance: {gp.coins})."}
        )

    gp.coins -= cosmetic.cost
    db.add(UserCosmetic(
        game_profile_id=gp.id,
        cosmetic_id=cosmetic.id,
        acquired_at=datetime.now(timezone.utc)
    ))
    db.commit()

    return {
        "message": f"Successfully purchased {cosmetic.name}!",
        "new_balance": gp.coins,
        "cosmetic": cosmetic.name
    }

@router.post("/equip")
def equip_cosmetic(
    cosmetic_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cosmetic = db.query(Cosmetic).filter(Cosmetic.id == cosmetic_id).first()
    if not cosmetic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cosmetic not found.")

    gp = user.game_profile
    if not gp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Game profile not found.")

    eq = dict(gp.equipped_cosmetics_json or {})
    if cosmetic.kind == "avatar_frame":
        gp.avatar_frame = cosmetic.code
    else:
        eq[cosmetic.kind] = cosmetic.name

    gp.equipped_cosmetics_json = eq
    db.commit()

    return {"message": f"Equipped {cosmetic.name}!", "equipped": gp.equipped_cosmetics_json}

@router.get("/quests", response_model=List[QuestResponse])
def get_quests(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quests = db.query(Quest).all()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    user_quests = db.query(UserQuest).filter(
        UserQuest.user_id == user.id,
        UserQuest.reset_date == today_str
    ).all()
    uq_map = {uq.quest_id: uq for uq in user_quests}

    res = []
    for q in quests:
        uq = uq_map.get(q.id)
        res.append(QuestResponse(
            id=q.id,
            code=q.code,
            title=q.title,
            kind=q.kind,
            target_count=q.target_count,
            current_count=uq.current_count if uq else 0,
            xp_reward=q.xp_reward,
            coin_reward=q.coin_reward,
            is_completed=bool(uq and uq.is_completed),
            is_claimed=bool(uq and uq.claimed_at)
        ))
    return res
