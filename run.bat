@echo off
title AI Document Intelligence System Launcher
echo =======================================================
echo     AI Document Intelligence System Launcher
echo =======================================================
echo.

echo [+] Launching FastAPI Backend (Uvicorn) in a new window...
start "DocIntel Backend Server" cmd /c "cd /d "%~dp0\backend" && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [+] Launching Vite React Frontend in a new window...
start "DocIntel Frontend Client" cmd /c "cd /d "%~dp0\frontend" && npm run dev"

echo.
echo =======================================================
echo  Servers initialized!
echo  - Frontend Client: http://localhost:5173
echo  - Backend API: http://127.0.0.1:8000
echo =======================================================
echo.
pause
