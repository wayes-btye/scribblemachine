@echo off
setlocal enabledelayedexpansion

echo Killing process on port 3001...

rem Find process using port 3001 (more robust parsing)
set "pid="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    set "pid=%%a"
)

if defined pid (
    echo Found process !pid! using port 3001
    taskkill /PID !pid! /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo Successfully killed process !pid!
    ) else (
        echo Failed to kill process !pid! - trying alternative method...
        powershell "Stop-Process -Id !pid! -Force -ErrorAction SilentlyContinue"
    )
) else (
    echo No process found listening on port 3001
)

echo Verifying port 3001 is free...
timeout /t 2 /nobreak >nul

rem Check if port is still in use
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 1 (
    echo ✅ Port 3001 is now free!
) else (
    echo ⚠️  Port 3001 may still be in use
)

echo Done!