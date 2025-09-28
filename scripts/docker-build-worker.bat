@echo off
REM Docker Build Script for Worker Service
REM Run this from the repository root directory

echo Starting worker service Docker build...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not running or not accessible.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo Docker is running. Building worker image...
echo.

REM Build Docker image from repository root
docker build -f services/worker/Dockerfile -t coloringpage-worker:latest .

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Docker image built successfully!
    echo Image name: coloringpage-worker:latest
    echo.
    echo To test the container locally:
    echo   docker run --env-file services/worker/.env coloringpage-worker:latest
    echo.
) else (
    echo.
    echo ❌ Docker build failed!
    echo Check the error messages above.
    echo.
)

pause