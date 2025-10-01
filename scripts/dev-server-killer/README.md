# Development Server Killer Scripts

This folder contains scripts to quickly kill development servers running on ports 3000 and 3001.

## 🚀 Quick Usage

### Kill Both Development Servers (Recommended)
```bash
# Batch script - Fast and simple
scripts/dev-server-killer/kill-dev-servers.bat

# PowerShell script - More detailed output
powershell -ExecutionPolicy Bypass -File "scripts/dev-server-killer/kill-dev-servers.ps1"
```

### Kill Individual Servers
```bash
# Frontend only (port 3000)
scripts/dev-server-killer/kill-3000-fixed.bat

# Worker/backend only (port 3001)
scripts/dev-server-killer/kill-3001-fixed.bat
```

## 📁 Scripts Overview

### Primary Scripts (Recommended)
- **`kill-dev-servers.bat`** - Kills both ports 3000 and 3001 (batch)
- **`kill-dev-servers.ps1`** - Kills both ports 3000 and 3001 (PowerShell)

### Individual Port Scripts
- **`kill-3000-fixed.bat`** - Kills frontend on port 3000
- **`kill-3001-fixed.bat`** - Kills worker/backend on port 3001
- **`kill-3000-clean.ps1`** - PowerShell version for port 3000
- **`kill-3001-clean.ps1`** - PowerShell version for port 3001

### Legacy Scripts (Not Recommended)
- `kill-3000.sh` - Unix/Linux script (doesn't work on Windows)
- `kill-3000.bat` - Original broken batch script
- `kill-3000.ps1` - Original broken PowerShell script

## 🎯 When to Use

**Use these scripts when:**
- You want to stop local development servers
- You're switching between frontend-only and full development modes
- You need to free up ports 3000 or 3001
- Your development servers are hanging or not responding

**Architecture Context:**
- **Port 3000**: Frontend (Next.js web app)
- **Port 3001**: Worker/backend (Node.js processing service)
- **Production**: Worker runs on Cloud Run, not locally

## ⚠️ Important Notes

- These scripts only work on Windows
- PowerShell scripts may require execution policy: `Set-ExecutionPolicy Bypass -Scope Process`
- Scripts use `taskkill` and `Stop-Process` for reliable termination
- No sensitive operations - just kills local development processes

## 🔧 Manual Commands

If scripts don't work, you can manually kill processes:

```bash
# Check what's running
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"

# Kill using PowerShell (replace <PID> with actual process ID)
powershell "Stop-Process -Id <PID> -Force"
```