@echo off
echo Killing process on port 3000...

rem Find process using port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Found process %%a using port 3000
    taskkill /PID %%a /F
    echo Killed process %%a
)

echo Verifying port 3000 is free...
netstat -ano | findstr ":3000"
if errorlevel 1 (
    echo ✅ Port 3000 is now free!
) else (
    echo ⚠️  Port 3000 may still be in use
)

pause