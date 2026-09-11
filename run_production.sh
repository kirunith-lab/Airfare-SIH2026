#!/usr/bin/env bash
set -e

echo "========================================================================="
echo " SIH26056: Real-time Airfare Price Index for India - Production Launcher"
echo "========================================================================="
echo ""

echo "[1/3] Building React Frontend with Vite..."
cd frontend
npm install
npm run build
cd ..
echo "[OK] Frontend built to frontend/dist"

echo ""
echo "[2/3] Checking Backend Python Environment..."
cd backend
python3 -c "import fastapi, uvicorn, pydantic, httpx" >/dev/null 2>&1 || {
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
}
echo "[OK] Backend dependencies verified."

echo ""
echo "[3/3] Initializing Database & Starting Server..."
python3 -m app.database.seed

echo ""
echo "========================================================================="
echo " SERVER ACTIVE ON: http://127.0.0.1:8000/"
echo " - Frontend Dashboard:   http://127.0.0.1:8000/"
echo " - REST API Endpoints:   http://127.0.0.1:8000/api/v1/"
echo " - Interactive Swagger:  http://127.0.0.1:8000/docs"
echo "========================================================================="
echo ""

uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
