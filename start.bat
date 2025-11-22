@echo off
echo.
echo ============================================
echo    AI Council - Starting Application
echo ============================================
echo.

REM Check if virtual environment exists
if not exist "council-env" (
    echo [*] Creating virtual environment...
    python -m venv council-env
    echo.
)

REM Activate virtual environment
echo [*] Activating environment...
call council-env\Scripts\activate.bat

REM Install/update dependencies
echo [*] Installing dependencies...
pip install -q -r requirements.txt
echo.

REM Check if Ollama is running
echo [*] Checking Ollama connection...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo.
    echo [!] Warning: Ollama doesn't seem to be running
    echo.
    echo Please start Ollama in another terminal with:
    echo   ollama serve
    echo.
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b
) else (
    echo [+] Ollama is running
)

echo.
echo ============================================
echo   Starting AI Council Server
echo ============================================
echo.
echo   Open your browser and visit:
echo   http://localhost:6969
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

REM Start the application
python ./ai-council/app.py

pause
