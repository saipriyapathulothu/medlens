@echo off
echo ========================================================
echo               MedLens Application Launcher
echo ========================================================
echo.
echo Checking environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH!
    echo Please install Python 3.10+ from python.org or via:
    echo     winget install Python.Python.3.11
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please install Node.js LTS from nodejs.org or via:
    echo     winget install OpenJS.NodeJS.LTS
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server on http://127.0.0.1:8000 ...
start "MedLens Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt && python run_backend.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend UI on http://localhost:5173 ...
start "MedLens Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo ========================================================
echo MedLens is booting up!
echo.
echo Frontend App:       http://localhost:5173
echo Backend API Docs:   http://127.0.0.1:8000/docs
echo Backend Health:     http://127.0.0.1:8000/api/health
echo ========================================================
echo.
pause
