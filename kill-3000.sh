#!/bin/bash

echo "🔥 Killing process on port 3000..."

# Find and kill process on port 3000
PID=$(lsof -ti:3000 2>/dev/null)

if [ -n "$PID" ]; then
    echo "Found process $PID using port 3000"
    kill -9 $PID
    echo "✅ Killed process $PID"
else
    echo "No process found on port 3000"
fi

# Verify port is free
sleep 1
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Port 3000 may still be in use"
else
    echo "✅ Port 3000 is now free!"
fi