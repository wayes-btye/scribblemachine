# PowerShell script to kill development servers on ports 3000 and 3001
Write-Host "Killing development servers on ports 3000 and 3001..." -ForegroundColor Yellow

function Kill-ProcessOnPort {
    param(
        [int]$Port,
        [string]$ServiceName
    )

    Write-Host "`nChecking port $Port ($ServiceName)..." -ForegroundColor Cyan

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                if ($processId) {
                    try {
                        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($process) {
                            $processName = $process.ProcessName
                            Write-Host "Found process $processName (PID: $processId) using port $Port" -ForegroundColor Red
                            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                            Write-Host "Killed process $processId on port $Port" -ForegroundColor Green
                        }
                    } catch {
                        Write-Host "Could not kill process $processId on port $Port" -ForegroundColor Yellow
                    }
                }
            }
        } else {
            Write-Host "No process found on port $Port" -ForegroundColor Green
        }
    } catch {
        # Fallback method
        Write-Host "Using fallback method for port $Port..." -ForegroundColor Yellow
        $output = cmd /c "netstat -ano | findstr :$Port | findstr LISTENING"

        if ($output) {
            $parts = $output -split '\s+'
            $processId = $parts[-1]
            if ($processId -match '^\d+$') {
                Write-Host "Found process $processId using port $Port" -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process $processId on port $Port" -ForegroundColor Green
            } else {
                Write-Host "Could not extract PID from output for port $Port" -ForegroundColor Red
            }
        } else {
            Write-Host "No process found on port $Port" -ForegroundColor Green
        }
    }
}

# Kill processes on both ports
Kill-ProcessOnPort -Port 3000 -ServiceName "frontend"
Kill-ProcessOnPort -Port 3001 -ServiceName "worker/backend"

# Verify ports are free
Write-Host "`nVerifying both ports are free..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

$port3000Connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001Connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if (-not $port3000Connections) {
    Write-Host "✅ Port 3000 is free!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port 3000 may still be in use" -ForegroundColor Yellow
}

if (-not $port3001Connections) {
    Write-Host "✅ Port 3001 is free!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port 3001 may still be in use" -ForegroundColor Yellow
}

Write-Host "`nDevelopment server cleanup complete!" -ForegroundColor Green