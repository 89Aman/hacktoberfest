Write-Host "Starting Campus Rescue..." -ForegroundColor Cyan

# 1. Start FastAPI backend in background
Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    & .venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload
} -ArgumentList $PSScriptRoot\..

# 2. Start React Vite Frontend
Write-Host "Starting React Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location "$PSScriptRoot\..\frontend"
npm run dev
