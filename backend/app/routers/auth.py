import secrets
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User, Profile, PasswordResetToken
from app.models.gamification import UserXP, Streak
from app.models.game import GameProfile
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.config import settings
from app.schemas.auth import (
    SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    OnboardingRequest, ProfileUpdateRequest, UserProfileResponse
)

logger = logging.getLogger("learnquest.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

def build_profile_response(user: User, profile: Profile, xp: UserXP, streak: Streak, game: GameProfile) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        learner_type=profile.learner_type if profile else "school",
        preferred_mode=profile.preferred_mode if profile else "school",
        display_avatar=profile.display_avatar if profile else "avatar-1",
        school_name=profile.school_name if profile else None,
        leaderboard_opt_in=profile.leaderboard_opt_in if profile else True,
        theme=profile.theme if profile else "system",
        class_id=profile.class_id if profile else None,
        board_id=profile.board_id if profile else None,
        stream_id=profile.stream_id if profile else None,
        total_xp=xp.total_xp if xp else 0,
        level=xp.level if xp else 1,
        current_streak=streak.current_streak if streak else 0,
        coins=game.coins if game else 100
    )

@router.post("/signup", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def signup(
    req: SignupRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    # Check if username or email exists
    clean_username = req.username.strip().lower()
    clean_email = req.email.strip().lower()

    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "USERNAME_TAKEN", "message": "This username is already taken."}
        )

    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMAIL_TAKEN", "message": "An account with this email already exists."}
        )

    # Create user
    user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hash_password(req.password),
        is_active=True,
        last_login_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.flush()

    # Create profile
    profile = Profile(
        user_id=user.id,
        display_avatar="avatar-1",
        learner_type="school",
        preferred_mode="school",
        leaderboard_opt_in=True,
        theme="system"
    )
    db.add(profile)

    # Create XP
    xp = UserXP(
        user_id=user.id,
        total_xp=0,
        level=1,
        week_xp=0,
        week_start=datetime.now(timezone.utc)
    )
    db.add(xp)

    # Create Streak
    streak = Streak(
        user_id=user.id,
        current_streak=1,
        longest_streak=1,
        last_active_date=datetime.now(timezone.utc).date()
    )
    db.add(streak)

    # Create Game Profile
    game = GameProfile(
        user_id=user.id,
        coins=100,
        avatar_frame="frame_bronze",
        equipped_cosmetics_json={"title": "Novice Explorer", "theme": "skyforge"}
    )
    db.add(game)
    db.commit()
    db.refresh(user)

    # Issue JWT Token in httpOnly cookie
    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=60 * 60 * 24 * 7  # 7 days
    )

    return build_profile_response(user, profile, xp, streak, game)

@router.post("/login", response_model=UserProfileResponse)
def login(
    req: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    identifier = req.username_or_email.strip().lower()
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid username/email or password."}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_DISABLED", "message": "Account has been deactivated."}
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=60 * 60 * 24 * 7
    )

    profile = user.profile
    xp = user.xp
    streak = user.streak
    game = user.game_profile
    return build_profile_response(user, profile, xp, streak, game)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE
    )
    return {"message": "Successfully logged out."}

@router.post("/forgot-password")
def forgot_password(
    req: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_password(raw_token)
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=2)
        )
        db.add(reset_entry)
        db.commit()

        # Print reset link to console for dev / hackathon ease
        reset_link = f"{settings.FRONTEND_ORIGIN}/reset-password?token={raw_token}&email={email}"
        logger.info(f"\n[PASSWORD RESET LINK for {email}]: {reset_link}\n")

    # Generic security message to prevent email enumeration
    return {"message": "If an account with that email exists, a password reset link has been generated."}

@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.used_at == None,
        PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).all()

    matched_entry = None
    for t in tokens:
        if verify_password(req.token, t.token_hash):
            matched_entry = t
            break

    if not matched_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_RESET_TOKEN", "message": "Password reset token is invalid or has expired."}
        )

    user = db.query(User).filter(User.id == matched_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.password_hash = hash_password(req.new_password)
    matched_entry.used_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Password has been successfully updated. You may now log in."}

@router.get("/me", response_model=UserProfileResponse)
def get_me(user: User = Depends(get_current_user)):
    return build_profile_response(user, user.profile, user.xp, user.streak, user.game_profile)

@router.patch("/me", response_model=UserProfileResponse)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)

    if req.display_avatar is not None:
        profile.display_avatar = req.display_avatar
    if req.preferred_mode is not None:
        profile.preferred_mode = req.preferred_mode
    if req.school_name is not None:
        profile.school_name = req.school_name.strip()
    if req.leaderboard_opt_in is not None:
        profile.leaderboard_opt_in = req.leaderboard_opt_in
    if req.theme is not None:
        profile.theme = req.theme
    if req.class_id is not None:
        profile.class_id = req.class_id
    if req.board_id is not None:
        profile.board_id = req.board_id
    if req.stream_id is not None:
        profile.stream_id = req.stream_id

    db.commit()
    db.refresh(user)
    return build_profile_response(user, profile, user.xp, user.streak, user.game_profile)

@router.post("/me/onboarding", response_model=UserProfileResponse)
def complete_onboarding(
    req: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)

    profile.learner_type = req.learner_type
    profile.preferred_mode = req.preferred_mode or ("school" if req.learner_type == "school" else "open")
    profile.class_id = req.class_id
    profile.board_id = req.board_id
    profile.stream_id = req.stream_id
    if req.school_name:
        profile.school_name = req.school_name.strip()
    if req.theme:
        profile.theme = req.theme

    db.commit()
    db.refresh(user)
    return build_profile_response(user, profile, user.xp, user.streak, user.game_profile)
