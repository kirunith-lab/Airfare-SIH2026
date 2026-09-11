@echo off
echo =========================================================================
echo  SIH26056: Real-time Airfare Price Index for India - Production Launcher
echo =========================================================================
echo.

echo [1/3] Building React Frontend with Vite...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b %ERRORLEVEL%
)
cd ..
echo [OK] Frontend built to frontend\dist

echo.
echo [2/3] Checking Backend Python Environment...
cd backend
python -c "import fastapi, uvicorn, pydantic, httpx" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing backend dependencies...
    pip install -r requirements.txt
)
echo [OK] Backend dependencies verified.

echo.
echo [3/3] Initializing Database & Starting Server...
python -m app.database.seed

echo.
echo =========================================================================
echo  SERVER ACTIVE ON: http://127.0.0.1:8000/
echo  - Frontend Dashboard:   http://127.0.0.1:8000/
echo  - REST API Endpoints:   http://127.0.0.1:8000/api/v1/
echo  - Interactive Swagger:  http://127.0.0.1:8000/docs
echo =========================================================================
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
