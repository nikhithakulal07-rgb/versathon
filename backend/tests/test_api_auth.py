import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import Base, engine

client = TestClient(app)

def test_meta_endpoint():
    res = client.get("/api/meta")
    assert res.status_code == 200
    data = res.json()
    assert "demoMode" in data
    assert "aiAvailable" in data
    assert "appEnv" in data
    assert "version" in data
    # Verify no secret is returned
    assert "AI_API_KEY" not in data
    assert "SECRET_KEY" not in data

import uuid

def test_auth_signup_login_flow():
    uid = uuid.uuid4().hex[:8]
    signup_data = {
        "username": f"cadet_{uid}",
        "email": f"cadet_{uid}@learnquest.demo",
        "password": "StrongPassword123!"
    }
    # Signup
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["username"] == f"cadet_{uid}"
    assert "access_token" in res.cookies

    # Onboarding
    onboarding_data = {
        "learner_type": "school",
        "preferred_mode": "school",
        "school_name": "Antigravity High School"
    }
    res_onboard = client.post("/api/auth/me/onboarding", json=onboarding_data, cookies=res.cookies)
    assert res_onboard.status_code == 200
    assert res_onboard.json()["school_name"] == "Antigravity High School"

    # Get Me
    res_me = client.get("/api/auth/me", cookies=res.cookies)
    assert res_me.status_code == 200
    assert res_me.json()["username"] == f"cadet_{uid}"

    # Logout
    res_logout = client.post("/api/auth/logout", cookies=res.cookies)
    assert res_logout.status_code == 200

    # Login
    res_login = client.post("/api/auth/login", json={
        "username_or_email": f"cadet_{uid}",
        "password": "StrongPassword123!"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.cookies

