@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   TraceGraph AI - Backend Setup ^& Startup Launcher
echo ========================================================
echo.

:: Step 1: Python check
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in System PATH.
    echo Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

echo [1/5] Checking Python environment...
python -c "import sys; print(f'Detected Python {sys.version.split()[0]}')"

:: Step 2: Install ML dependencies
echo.
echo [2/5] Installing/verifying ML dependencies (services/ml)...
cd services\ml
pip install xgboost scikit-learn joblib networkx pyarrow pandas numpy pytest -q
cd ..\..

:: Step 3: Install API dependencies
echo.
echo [3/5] Installing/verifying API dependencies (services/api)...
cd services\api
pip install fastapi uvicorn pydantic pyarrow pandas pytest httpx -q
cd ..\..

:: Step 4: Run batch prediction CLI
echo.
echo [4/5] Running ML batch prediction pipeline (predict.py)...
cd services\ml
set "PYTHONPATH=src"
python scripts/predict.py --input data/generated/sih26146-synthetic-60000-v2/events.csv --manifest data/generated/sih26146-synthetic-60000-v2/manifest.json --model-run artifacts/runs/sih26146-cpu-demo-2026-v1 --output artifacts/predictions/demo-predictions.json
cd ..\..

:: Step 5: Launch FastAPI server
echo.
echo ========================================================
echo [5/5] Launching TraceGraph AI Backend API Server...
echo.
echo Server Base URL:      http://127.0.0.1:8000/api/v1
echo OpenAPI Docs:        http://127.0.0.1:8000/docs
echo ReDoc UI:            http://127.0.0.1:8000/redoc
echo.
echo Press Ctrl+C to stop the server.
echo ========================================================
echo.

cd services\api
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
