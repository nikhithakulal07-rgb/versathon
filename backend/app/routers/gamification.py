from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User, Profile
from app.models.gamification import (
    UserXP, XPEvent, Badge, UserBadge, Streak, DailyChallenge, Friendship
)
from app.models.content import Question
from app.models.learning import Answer
from app.deps import get_current_user
from app.engine.xp import get_level_from_xp, calculate_xp_for_level
from app.schemas.gamification import (
    XPStatusResponse, BadgeResponse, StreakResponse, DailyChallengeResponse,
    LeaderboardEntry, FriendResponse
)

router = APIRouter(tags=["Gamification & Leaderboard"])

@router.get("/xp", response_model=XPStatusResponse)
def get_xp_status(
    user: User = Depends(get_current_user)
):
    xp = user.xp
    total_xp = xp.total_xp if xp else 0
    level, title, curr_req, next_req = get_level_from_xp(total_xp)

    denom = next_req - curr_req if next_req > curr_req else 100
    prog_pct = round(max(0.0, min(100.0, ((total_xp - curr_req) / denom) * 100.0)), 1)

    return XPStatusResponse(
        total_xp=total_xp,
        level=level,
        level_title=title,
        current_level_xp=curr_req,
        next_level_xp=next_req,
        progress_pct=prog_pct,
        week_xp=xp.week_xp if xp else total_xp
    )

@router.get("/badges", response_model=List[BadgeResponse])
def get_badges(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_badges = db.query(Badge).all()
    user_badges = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    earned_map = {ub.badge_id: ub.earned_at for ub in user_badges}

    res = []
    for b in all_badges:
        is_earned = b.id in earned_map
        res.append(BadgeResponse(
            id=b.id,
            code=b.code,
            name=b.name,
            emoji=b.emoji,
            description=b.description,
            category=b.category,
            is_earned=is_earned,
            earned_at=earned_map[b.id].isoformat() if is_earned else None
        ))
    return res

@router.get("/streak", response_model=StreakResponse)
def get_streak_status(
    user: User = Depends(get_current_user)
):
    st = user.streak
    today = datetime.now(timezone.utc).date()
    active_today = bool(st and st.last_active_date == today)

    return StreakResponse(
        current_streak=st.current_streak if st else 0,
        longest_streak=st.longest_streak if st else 0,
        freezes_available=st.freezes_available if st else 1,
        active_today=active_today
    )

@router.get("/daily-challenge")
def get_daily_challenge(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    challenge = db.query(DailyChallenge).filter(
        DailyChallenge.user_id == user.id,
        DailyChallenge.date == today_str
    ).first()

    if not challenge:
        # Pick 5 random questions across curriculum
        sample_qs = db.query(Question).order_by(Question.created_at).limit(5).all()
        q_ids = [q.id for q in sample_qs]
        challenge = DailyChallenge(
            date=today_str,
            user_id=user.id,
            question_ids_json=q_ids,
            xp_awarded=0
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)

    questions = db.query(Question).filter(Question.id.in_(challenge.question_ids_json)).all()
    q_data = [
        {
            "id": q.id,
            "stem": q.stem,
            "options": q.options_json,
            "difficulty": q.difficulty,
            "concept_tag": q.concept_tag
        }
        for q in questions
    ]

    return {
        "id": challenge.id,
        "date": challenge.date,
        "is_completed": bool(challenge.completed_at),
        "xp_awarded": challenge.xp_awarded,
        "questions": q_data
    }

@router.post("/daily-challenge/finish")
def finish_daily_challenge(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    challenge = db.query(DailyChallenge).filter(
        DailyChallenge.user_id == user.id,
        DailyChallenge.date == today_str
    ).first()

    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily challenge not found.")

    if challenge.completed_at:
        return {"message": "Already completed today.", "xp_awarded": challenge.xp_awarded}

    xp_reward = 60
    challenge.completed_at = datetime.now(timezone.utc)
    challenge.xp_awarded = xp_reward

    db.add(XPEvent(
        user_id=user.id,
        amount=xp_reward,
        reason="Daily Challenge Completed",
        ref_type="daily_challenge",
        ref_id=challenge.id
    ))

    # Update streak
    st = user.streak
    if st:
        st.current_streak += 1
        st.longest_streak = max(st.longest_streak, st.current_streak)
        st.last_active_date = datetime.now(timezone.utc).date()

    user_xp = user.xp
    if user_xp:
        user_xp.total_xp += xp_reward
        user_xp.week_xp += xp_reward
        lvl, _, _, _ = get_level_from_xp(user_xp.total_xp)
        user_xp.level = lvl

    db.commit()

    return {"message": "Daily challenge completed!", "xp_awarded": xp_reward}

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    scope: str = Query("global", pattern="^(global|school|class|friends)$"),
    period: str = Query("week", pattern="^(week|all)$"),
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns ranked leaderboard data filtered by privacy rules (only usernames, avatars, XP).
    """
    query = db.query(User).join(Profile).join(UserXP).filter(
        User.is_active == True,
        Profile.leaderboard_opt_in == True
    )

    if scope == "school" and user and user.profile and user.profile.school_name:
        query = query.filter(Profile.school_name == user.profile.school_name)
    elif scope == "class" and user and user.profile and user.profile.class_id:
        query = query.filter(Profile.class_id == user.profile.class_id)
    elif scope == "friends" and user:
        friend_ids = db.query(Friendship.friend_user_id).filter(
            Friendship.user_id == user.id,
            Friendship.status == "accepted"
        ).all()
        f_id_list = [f[0] for f in friend_ids] + [user.id]
        query = query.filter(User.id.in_(f_id_list))

    if period == "week":
        users = query.order_by(UserXP.week_xp.desc()).limit(50).all()
    else:
        users = query.order_by(UserXP.total_xp.desc()).limit(50).all()

    entries = []
    for rank, u in enumerate(users, 1):
        xp_val = u.xp.week_xp if period == "week" and u.xp else (u.xp.total_xp if u.xp else 0)
        entries.append(LeaderboardEntry(
            rank=rank,
            username=u.username,
            display_avatar=u.profile.display_avatar if u.profile else "avatar-1",
            total_xp=xp_val,
            level=u.xp.level if u.xp else 1,
            is_current_user=(user is not None and u.id == user.id),
            school_name=u.profile.school_name if u.profile else None
        ))

    return entries

@router.post("/friends/request")
def send_friend_request(
    target_username: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(User).filter(User.username == target_username.strip().lower()).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target.id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot add yourself as a friend.")

    existing = db.query(Friendship).filter(
        Friendship.user_id == user.id,
        Friendship.friend_user_id == target.id
    ).first()

    if existing:
        return {"message": f"Friendship status is already '{existing.status}'."}

    db.add(Friendship(user_id=user.id, friend_user_id=target.id, status="pending"))
    db.commit()

    return {"message": f"Friend request sent to {target.username}."}

@router.post("/friends/{id}/accept")
def accept_friend_request(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(Friendship).filter(
        Friendship.user_id == id,
        Friendship.friend_user_id == user.id,
        Friendship.status == "pending"
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found.")

    req.status = "accepted"
    # Create mutual accepted entry if missing
    mutual = db.query(Friendship).filter(
        Friendship.user_id == user.id,
        Friendship.friend_user_id == id
    ).first()
    if not mutual:
        db.add(Friendship(user_id=user.id, friend_user_id=id, status="accepted"))
    else:
        mutual.status = "accepted"

    db.commit()
    return {"message": "Friend request accepted."}
