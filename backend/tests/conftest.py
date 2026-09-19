import pytest
from app.db import engine, Base
from app.seed.seed import seed_database
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Ensure tables and seed data exist for the test session
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
