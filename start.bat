@echo off
title Billing App Launcher
echo ===================================================
echo             Starting Billing App Setup            
echo ===================================================
echo.

:: Check if Docker is running
echo [1/3] Checking Docker daemon status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo Docker is running.
echo.

:: Start PostgreSQL via Docker Compose
echo [2/3] Starting PostgreSQL container...
docker compose up -d
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start PostgreSQL container.
    echo.
    pause
    exit /b 1
)
echo PostgreSQL container is up and running.
echo.

:: Launch Next.js Dev Server
echo [3/3] Starting Next.js Dev Server...
echo Application will be available at: http://localhost:3000
echo Press Ctrl+C in this window to stop the server.
echo.
pnpm dev
