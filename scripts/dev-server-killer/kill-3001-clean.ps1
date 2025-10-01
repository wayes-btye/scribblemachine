# PowerShell script to kill process on port 3001
Write-Host "Killing process on port 3001..." -ForegroundColor Yellow

try {
    # Get all connections on port 3001
    $connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        $processName = $process.ProcessName
                        Write-Host "Found process $processName (PID: $processId) using port 3001" -ForegroundColor Red
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Write-Host "Killed process $processId" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "Could not kill process $processId" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "No process found listening on port 3001" -ForegroundColor Green
    }
} catch {
    # Fallback method if Get-NetTCPConnection fails
    Write-Host "Using fallback method..." -ForegroundColor Yellow

    $output = cmd /c "netstat -ano | findstr :3001 | findstr LISTENING"
    if ($output) {
        Write-Host "Found output: $output" -ForegroundColor Yellow
        # Extract PID from netstat output (last number in the line)
        $parts = $output -split '\s+'
        $processId = $parts[-1]
        if ($processId -match '^\d+$') {
            Write-Host "Found process $processId using port 3001" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Killed process $processId" -ForegroundColor Green
        } else {
            Write-Host "Could not extract PID from output" -ForegroundColor Red
        }
    } else {
        Write-Host "No process found listening on port 3001" -ForegroundColor Green
    }
}

# Verify port is free
Start-Sleep -Seconds 2
$checkConnections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if (-not $checkConnections) {
    Write-Host "Port 3001 is now free!" -ForegroundColor Green
} else {
    Write-Host "Port 3001 may still be in use" -ForegroundColor Yellow
}