from app.config.routes import DEFAULT_ROUTES
from app.database.seed import seed_database


if __name__ == "__main__":
    print(f"Configured {len(DEFAULT_ROUTES)} default routes. Initializing database...")
    seed_database()
