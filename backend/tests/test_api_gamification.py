import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_cookies():
    res = client.post("/api/auth/login", json={
        "username_or_email": "alex_learner",
        "password": "Password123!"
    })
    return res.cookies

def test_xp_and_streak():
    cookies = get_auth_cookies()

    res_xp = client.get("/api/xp", cookies=cookies)
    assert res_xp.status_code == 200
    assert "total_xp" in res_xp.json()
    assert "level" in res_xp.json()

    res_st = client.get("/api/streak", cookies=cookies)
    assert res_st.status_code == 200
    assert "current_streak" in res_st.json()

def test_leaderboard_scopes():
    cookies = get_auth_cookies()

    # Global
    res_g = client.get("/api/leaderboard?scope=global&period=all", cookies=cookies)
    assert res_g.status_code == 200
    entries_g = res_g.json()
    assert len(entries_g) >= 3
    # Check that entries contain ONLY public safe fields (username, avatar, level, xp)
    assert all("email" not in e and "password" not in e for e in entries_g)

    # Class & School
    res_c = client.get("/api/leaderboard?scope=class&period=week", cookies=cookies)
    assert res_c.status_code == 200

    res_s = client.get("/api/leaderboard?scope=school&period=week", cookies=cookies)
    assert res_s.status_code == 200

def test_game_mode_missions_and_shop():
    cookies = get_auth_cookies()

    # Get missions
    res_m = client.get("/api/game/missions", cookies=cookies)
    assert res_m.status_code == 200
    missions = res_m.json()
    assert len(missions) >= 1

    m_id = missions[0]["id"]
    res_start = client.post(f"/api/game/missions/{m_id}/start", cookies=cookies)
    assert res_start.status_code == 200

    res_stage = client.post(
        f"/api/game/missions/{m_id}/complete-stage?stage=1&stars_earned=3",
        cookies=cookies
    )
    assert res_stage.status_code == 200
    assert "coins_earned" in res_stage.json()

    # Get shop cosmetics
    res_shop = client.get("/api/game/shop", cookies=cookies)
    assert res_shop.status_code == 200
    cosmetics = res_shop.json()
    assert len(cosmetics) >= 1

    # Buy a cosmetic if enough coins
    for c in cosmetics:
        if not c["is_owned"] and c["cost"] <= 100:
            res_buy = client.post(f"/api/game/shop/buy?cosmetic_id={c['id']}", cookies=cookies)
            assert res_buy.status_code == 200
            break
