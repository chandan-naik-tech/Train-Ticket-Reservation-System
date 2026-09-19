@echo off
taskkill /F /IM node.exe /T >nul 2>&1

echo Starting RailVerse AI Backend...
start cmd /k "cd backend && npm run dev"

echo Starting RailVerse AI Frontend...
start cmd /k "cd frontend && npm run dev"

echo Waiting for servers to start...
timeout /t 5 /nobreak > nul

echo Opening Browser...
start http://localhost:3000
