@echo off
setlocal enabledelayedexpansion

echo ################################################
echo #   TikTok Live Game - Python Backend         #
echo ################################################
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.9+ 
    pause
    exit /b 1
)

:: Set up virtual environment
if not exist "server-python\venv" (
    echo [INFO] Creating Virtual Environment...
    python -m venv server-python\venv
)

echo [INFO] Installing Dependencies...
call server-python\venv\Scripts\activate.bat
pip install -r server-python\requirements.txt

echo.
echo [SUCCESS] Everything is ready!
echo.
echo Starting Python Backend on port 3000...
start "TikTok Backend (Python)" cmd /k "call server-python\venv\Scripts\activate.bat && python server-python\main.py"

echo Starting React Frontend...
start "TikTok Frontend (React)" cmd /k "cd client && npm run dev"

echo.
echo Game handles:
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:5173 (usually)
echo.
echo Open the Frontend URL in your browser.
echo.
pause
