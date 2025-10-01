# PowerShell script to kill process on port 3000 - Fixed version
Write-Host "🔥 Killing process on port 3000..." -ForegroundColor Yellow

try {
    # Get all connections on port 3000
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

    if ($connections) {
        foreach ($conn in $connections) {
            $pid = $conn.OwningProcess
            if ($pid) {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        $processName = $process.ProcessName
                        Write-Host "Found process $processName (PID: $pid) using port 3000" -ForegroundColor Red
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Host "✅ Killed process $pid" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "⚠️  Could not kill process $pid" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "No process found listening on port 3000" -ForegroundColor Green
    }
} catch {
    # Fallback method if Get-NetTCPConnection fails
    Write-Host "Using fallback method..." -ForegroundColor Yellow

    $output = netstat -ano | findstr ":3000" | findstr "LISTENING"
    if ($output) {
        if ($output -match '\s+(\d+)$') {
            $pid = $matches[1]
            Write-Host "Found process $pid using port 3000" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Killed process $pid" -ForegroundColor Green
        }
    } else {
        Write-Host "No process found listening on port 3000" -ForegroundColor Green
    }
}

# Verify port is free
Start-Sleep -Seconds 2
$checkConnections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if (-not $checkConnections) {
    Write-Host "Port 3000 is now free!" -ForegroundColor Green
} else {
    Write-Host "Port 3000 may still be in use" -ForegroundColor Yellow
}