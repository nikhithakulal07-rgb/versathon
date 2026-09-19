import json
import os
import logging
from datetime import datetime, timezone, timedelta
from app.db import engine, SessionLocal, Base
from app.models import (
    Board, SchoolClass, Stream, Subject, Chapter, Topic, Subtopic,
    Question, Flashcard, Explanation, Badge, Cosmetic, Mission, Quest,
    User, Profile, UserXP, Streak, GameProfile, UserBadge, Friendship,
    MasteryScore, UserCosmetic
)
from app.security import hash_password
from app.engine.badges import INITIAL_BADGES
from app.engine.xp import get_level_from_xp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnquest.seed")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_json(filename: str):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        logger.warning(f"Seed file {filename} not found at {path}")
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def seed_database():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Badges
        logger.info("Seeding Badges...")
        for b_data in INITIAL_BADGES:
            existing = db.query(Badge).filter_by(code=b_data["code"]).first()
            if not existing:
                badge = Badge(
                    code=b_data["code"],
                    name=b_data["name"],
                    emoji=b_data["emoji"],
                    description=b_data["description"],
                    category=b_data["category"]
                )
                db.add(badge)
        db.commit()

        # 2. Seed Curriculum Structure
        curriculum_data = load_json("curriculum.json")
        if curriculum_data:
            logger.info("Seeding Boards, Classes, Streams, and Subjects...")
            board_map = {}
            for b in curriculum_data.get("boards", []):
                board = db.query(Board).filter_by(code=b["code"]).first()
                if not board:
                    board = Board(code=b["code"], name=b["name"])
                    db.add(board)
                    db.flush()
                board_map[b["code"]] = board

            class_map = {}
            for c in curriculum_data.get("classes", []):
                sclass = db.query(SchoolClass).filter_by(grade=c["grade"]).first()
                if not sclass:
                    sclass = SchoolClass(grade=c["grade"], name=c["name"])
                    db.add(sclass)
                    db.flush()
                class_map[c["grade"]] = sclass

            stream_map = {}
            for s in curriculum_data.get("streams", []):
                stream = db.query(Stream).filter_by(code=s["code"]).first()
                if not stream:
                    stream = Stream(code=s["code"], name=s["name"])
                    db.add(stream)
                    db.flush()
                stream_map[s["code"]] = stream

            subject_map = {}
            for subj in curriculum_data.get("subjects", []):
                existing_subj = db.query(Subject).filter_by(code=subj["code"]).first()
                if not existing_subj:
                    stream_obj = stream_map.get(subj.get("stream_code")) if subj.get("stream_code") else None
                    new_subj = Subject(
                        class_id=class_map[subj["class_grade"]].id,
                        board_id=board_map[subj["board_code"]].id,
                        stream_id=stream_obj.id if stream_obj else None,
                        name=subj["name"],
                        code=subj["code"],
                        icon=subj.get("icon", "book"),
                        color=subj.get("color", "#6366F1")
                    )
                    db.add(new_subj)
                    db.flush()
                    subject_map[subj["code"]] = new_subj
                else:
                    subject_map[subj["code"]] = existing_subj
            db.commit()

        # Helper to seed a vertical slice chapter + topic
        def seed_vertical_slice(json_filename: str):
            data = load_json(json_filename)
            if not data:
                return
            subj_code = data.get("subject_code")
            subject = db.query(Subject).filter_by(code=subj_code).first()
            if not subject:
                logger.warning(f"Subject {subj_code} not found for {json_filename}")
                return

            chapter = db.query(Chapter).filter_by(subject_id=subject.id, title=data["chapter_title"]).first()
            if not chapter:
                chapter = Chapter(subject_id=subject.id, title=data["chapter_title"], order=1)
                db.add(chapter)
                db.flush()

            t_data = data["topic"]
            topic = db.query(Topic).filter_by(chapter_id=chapter.id, title=t_data["title"]).first()
            if not topic:
                topic = Topic(
                    chapter_id=chapter.id,
                    title=t_data["title"],
                    description=t_data.get("description", ""),
                    source="seed",
                    mode_origin="school",
                    order=t_data.get("order", 1)
                )
                db.add(topic)
                db.flush()

            for s_data in t_data.get("subtopics", []):
                subtopic = db.query(Subtopic).filter_by(topic_id=topic.id, concept_tag=s_data["concept_tag"]).first()
                if not subtopic:
                    subtopic = Subtopic(
                        topic_id=topic.id,
                        title=s_data["title"],
                        concept_tag=s_data["concept_tag"],
                        order=s_data.get("order", 1)
                    )
                    db.add(subtopic)
                    db.flush()

                # Seed explanations
                for lvl, exp in s_data.get("explanations", {}).items():
                    existing_exp = db.query(Explanation).filter_by(subtopic_id=subtopic.id, level=lvl).first()
                    if not existing_exp:
                        db.add(Explanation(
                            subtopic_id=subtopic.id,
                            level=lvl,
                            body_markdown=exp["body_markdown"],
                            visual_spec_json=exp.get("visual_spec"),
                            source="seed"
                        ))

                # Seed flashcards
                for fc in s_data.get("flashcards", []):
                    existing_fc = db.query(Flashcard).filter_by(subtopic_id=subtopic.id, front=fc["front"]).first()
                    if not existing_fc:
                        db.add(Flashcard(
                            subtopic_id=subtopic.id,
                            front=fc["front"],
                            back=fc["back"],
                            concept_tag=fc.get("concept_tag", s_data["concept_tag"]),
                            source="seed"
                        ))

                # Seed questions
                for q in s_data.get("questions", []):
                    existing_q = db.query(Question).filter_by(subtopic_id=subtopic.id, stem=q["stem"]).first()
                    if not existing_q:
                        db.add(Question(
                            subtopic_id=subtopic.id,
                            concept_tag=s_data["concept_tag"],
                            stem=q["stem"],
                            options_json=q["options_json"],
                            correct_index=q["correct_index"],
                            difficulty=q.get("difficulty", 3),
                            expected_time_seconds=q.get("expected_time_seconds", 45),
                            explanation=q.get("explanation", ""),
                            misconception_hints_json=q.get("misconception_hints_json", {}),
                            source="seed"
                        ))
            db.commit()

        logger.info("Seeding School Mode vertical slices...")
        seed_vertical_slice("electricity.json")
        seed_vertical_slice("quadratic_equations.json")
        seed_vertical_slice("cell_structure.json")
        seed_vertical_slice("electrostatics.json")
        seed_vertical_slice("accounting.json")

        # 3. Seed Open Learning Demo Packs
        demo_packs_data = load_json("demo_packs.json")
        if demo_packs_data:
            logger.info("Seeding Open Learning Demo Packs...")
            for pack in demo_packs_data.get("packs", []):
                topic = db.query(Topic).filter_by(title=pack["title"], source="demo_pack").first()
                if not topic:
                    topic = Topic(
                        chapter_id=None,
                        title=pack["title"],
                        description=pack.get("description", ""),
                        source="demo_pack",
                        mode_origin="open",
                        status="published",
                        order=1
                    )
                    db.add(topic)
                    db.flush()

                for s_idx, sub in enumerate(pack.get("subtopics", []), 1):
                    subtopic = db.query(Subtopic).filter_by(topic_id=topic.id, concept_tag=sub["concept_tag"]).first()
                    if not subtopic:
                        subtopic = Subtopic(
                            topic_id=topic.id,
                            title=sub["title"],
                            concept_tag=sub["concept_tag"],
                            order=sub.get("order", s_idx)
                        )
                        db.add(subtopic)
                        db.flush()

                    for lvl, exp in sub.get("explanations", {}).items():
                        existing_exp = db.query(Explanation).filter_by(subtopic_id=subtopic.id, level=lvl).first()
                        if not existing_exp:
                            db.add(Explanation(
                                subtopic_id=subtopic.id,
                                level=lvl,
                                body_markdown=exp["body_markdown"],
                                visual_spec_json=exp.get("visual_spec"),
                                source="seed"
                            ))

                    for fc in sub.get("flashcards", []):
                        existing_fc = db.query(Flashcard).filter_by(subtopic_id=subtopic.id, front=fc["front"]).first()
                        if not existing_fc:
                            db.add(Flashcard(
                                subtopic_id=subtopic.id,
                                front=fc["front"],
                                back=fc["back"],
                                concept_tag=fc.get("concept_tag", sub["concept_tag"]),
                                source="seed"
                            ))

                    for q in sub.get("questions", []):
                        existing_q = db.query(Question).filter_by(subtopic_id=subtopic.id, stem=q["stem"]).first()
                        if not existing_q:
                            db.add(Question(
                                subtopic_id=subtopic.id,
                                concept_tag=sub["concept_tag"],
                                stem=q["stem"],
                                options_json=q["options_json"],
                                correct_index=q["correct_index"],
                                difficulty=q.get("difficulty", 3),
                                expected_time_seconds=q.get("expected_time_seconds", 45),
                                explanation=q.get("explanation", ""),
                                misconception_hints_json=q.get("misconception_hints_json", {}),
                                source="seed"
                            ))
            db.commit()

        # 4. Seed Game Content (Cosmetics, Missions, Quests)
        game_data = load_json("game_content.json")
        if game_data:
            logger.info("Seeding Game Content (Cosmetics, Missions, Quests)...")
            for c in game_data.get("cosmetics", []):
                existing_c = db.query(Cosmetic).filter_by(code=c["code"]).first()
                if not existing_c:
                    db.add(Cosmetic(
                        code=c["code"],
                        name=c["name"],
                        kind=c["kind"],
                        cost=c["cost"],
                        preview_svg=c.get("preview_svg"),
                        description=c["description"]
                    ))

            for m in game_data.get("missions", []):
                existing_m = db.query(Mission).filter_by(code=m["code"]).first()
                if not existing_m:
                    db.add(Mission(
                        code=m["code"],
                        name=m["name"],
                        region=m.get("region", "Aetheria"),
                        description=m["description"],
                        stages_json=m["stages"]
                    ))

            for q in game_data.get("quests", []):
                existing_q = db.query(Quest).filter_by(code=q["code"]).first()
                if not existing_q:
                    db.add(Quest(
                        code=q["code"],
                        title=q["title"],
                        kind=q["kind"],
                        target_count=q["target_count"],
                        xp_reward=q["xp_reward"],
                        coin_reward=q["coin_reward"],
                        action_type=q["action_type"]
                    ))
            db.commit()

        # 5. Seed Demo Users & Progress
        demo_users_data = load_json("demo_users.json")
        if demo_users_data:
            logger.info("Seeding Demo Users and Leaderboard rankings...")
            seeded_users = []
            for u in demo_users_data.get("users", []):
                user = db.query(User).filter_by(username=u["username"]).first()
                if not user:
                    user = User(
                        username=u["username"],
                        email=u["email"],
                        password_hash=hash_password(u["password"]),
                        is_active=True
                    )
                    db.add(user)
                    db.flush()

                    # Find class/board if specified
                    c_id = None
                    b_id = None
                    if u.get("class_grade"):
                        c_obj = db.query(SchoolClass).filter_by(grade=u["class_grade"]).first()
                        if c_obj:
                            c_id = c_obj.id
                    if u.get("board_code"):
                        b_obj = db.query(Board).filter_by(code=u["board_code"]).first()
                        if b_obj:
                            b_id = b_obj.id

                    profile = Profile(
                        user_id=user.id,
                        display_avatar=u.get("display_avatar", "avatar-1"),
                        learner_type=u.get("learner_type", "school"),
                        preferred_mode=u.get("preferred_mode", "school"),
                        school_name=u.get("school_name"),
                        leaderboard_opt_in=True,
                        theme="system",
                        class_id=c_id,
                        board_id=b_id
                    )
                    db.add(profile)

                    # User XP & Level
                    total_xp = u.get("total_xp", 100)
                    lvl, _, _, _ = get_level_from_xp(total_xp)
                    user_xp = UserXP(
                        user_id=user.id,
                        total_xp=total_xp,
                        level=lvl,
                        week_xp=u.get("week_xp", total_xp),
                        week_start=datetime.now(timezone.utc)
                    )
                    db.add(user_xp)

                    # Streak
                    streak = Streak(
                        user_id=user.id,
                        current_streak=u.get("current_streak", 1),
                        longest_streak=u.get("longest_streak", 1),
                        last_active_date=datetime.now(timezone.utc).date()
                    )
                    db.add(streak)

                    # Game Profile
                    game_profile = GameProfile(
                        user_id=user.id,
                        coins=u.get("coins", 100),
                        avatar_frame="frame_bronze",
                        equipped_cosmetics_json={"title": "Novice Explorer", "theme": "skyforge"}
                    )
                    db.add(game_profile)

                    # Badges
                    for b_code in u.get("badges", []):
                        badge_obj = db.query(Badge).filter_by(code=b_code).first()
                        if badge_obj:
                            db.add(UserBadge(user_id=user.id, badge_id=badge_obj.id))

                seeded_users.append(user)
            db.commit()

            # Seed sample friendship pairs (e.g. alex & priya, rahul & sophia)
            if len(seeded_users) >= 2:
                u1 = seeded_users[0]
                u2 = seeded_users[1]
                existing_f = db.query(Friendship).filter_by(user_id=u1.id, friend_user_id=u2.id).first()
                if not existing_f:
                    db.add(Friendship(user_id=u1.id, friend_user_id=u2.id, status="accepted"))
                    db.add(Friendship(user_id=u2.id, friend_user_id=u1.id, status="accepted"))
                db.commit()

        logger.info("Database seeding completed successfully!")

    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
