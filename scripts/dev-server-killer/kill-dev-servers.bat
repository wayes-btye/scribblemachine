@echo off
setlocal enabledelayedexpansion

echo Killing development servers on ports 3000 and 3001...

rem Kill process on port 3000
echo.
echo Checking port 3000 (frontend)...
set "pid3000="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    set "pid3000=%%a"
)

if defined pid3000 (
    echo Found process !pid3000! using port 3000
    taskkill /PID !pid3000! /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo Successfully killed process !pid3000! on port 3000
    ) else (
        echo Failed to kill process !pid3000! - trying PowerShell...
        powershell "Stop-Process -Id !pid3000! -Force -ErrorAction SilentlyContinue"
    )
) else (
    echo No process found on port 3000
)

rem Kill process on port 3001
echo.
echo Checking port 3001 (worker/backend)...
set "pid3001="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    set "pid3001=%%a"
)

if defined pid3001 (
    echo Found process !pid3001! using port 3001
    taskkill /PID !pid3001! /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo Successfully killed process !pid3001! on port 3001
    ) else (
        echo Failed to kill process !pid3001! - trying PowerShell...
        powershell "Stop-Process -Id !pid3001! -Force -ErrorAction SilentlyContinue"
    )
) else (
    echo No process found on port 3001
)

echo.
echo Verifying both ports are free...
timeout /t 2 /nobreak >nul

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
set "port3000free=%errorlevel%"

netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
set "port3001free=%errorlevel%"

if %port3000free% equ 1 (
    echo ✅ Port 3000 is free!
) else (
    echo ⚠️  Port 3000 may still be in use
)

if %port3001free% equ 1 (
    echo ✅ Port 3001 is free!
) else (
    echo ⚠️  Port 3001 may still be in use
)

echo.
echo Development server cleanup complete!