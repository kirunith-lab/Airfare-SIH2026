from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.analytics import router as analytics_router
from app.api.backtest import router as backtest_router
from app.api.export import router as export_router
from app.api.flights import router as flights_router
from app.api.health import router as health_router
from app.api.index import router as index_router
from app.api.ingest import router as ingest_router
from app.api.metadata import router as metadata_router
from app.api.quality import router as quality_router
from app.api.routes import router as routes_router
from app.database.schema import init_db
from app.database.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized and seeded on startup
    init_db()
    seed_database()
    yield


app = FastAPI(
    title="SIH26056: Real-time Airfare Price Index for India API",
    description="Statistical Laspeyres & Jevons Airfare Index, DGCA Benchmark Backtesting, Lead-Time Booking Intelligence, and Data Quality Engine.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routes
API_PREFIX = "/api/v1"
app.include_router(health_router, prefix="/api")
app.include_router(routes_router, prefix=API_PREFIX)
app.include_router(flights_router, prefix=API_PREFIX)
app.include_router(index_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(backtest_router, prefix=API_PREFIX)
app.include_router(quality_router, prefix=API_PREFIX)
app.include_router(metadata_router, prefix=API_PREFIX)
app.include_router(ingest_router, prefix=API_PREFIX)
app.include_router(export_router, prefix=API_PREFIX)

# Also expose on /api for backward compatibility
app.include_router(routes_router, prefix="/api")
app.include_router(flights_router, prefix="/api")
app.include_router(index_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(backtest_router, prefix="/api")
app.include_router(quality_router, prefix="/api")
app.include_router(metadata_router, prefix="/api")
app.include_router(ingest_router, prefix="/api")
app.include_router(export_router, prefix="/api")

# Check for production frontend build (Docker container, all-in-one cloud deploy, or local preview)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if not frontend_dist.exists():
    frontend_dist = Path(__file__).resolve().parent.parent / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(frontend_dist / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes or documentation
        if full_path.startswith("api") or full_path in ("docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "project": "SIH26056 - Real-time Airfare Price Index for India",
            "version": "1.0.0",
            "docs_url": "/docs",
            "status": "OPERATIONAL",
        }
