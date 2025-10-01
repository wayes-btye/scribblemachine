# PowerShell script to kill process on port 3000
Write-Host "Killing process on port 3000..." -ForegroundColor Yellow

# Find and kill process on port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
         Where-Object { $_.State -eq 'Listen' } |
         Select-Object -ExpandProperty OwningProcess

if ($process) {
    $processName = (Get-Process -Id $process -ErrorAction SilentlyContinue).ProcessName
    Write-Host "Found process $processName (PID: $process) using port 3000" -ForegroundColor Red
    Stop-Process -Id $process -Force
    Write-Host "Killed process $process" -ForegroundColor Green
} else {
    Write-Host "No process found listening on port 3000" -ForegroundColor Green
}

# Verify port is free
$checkProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
                Where-Object { $_.State -eq 'Listen' }

if (-not $checkProcess) {
    Write-Host "✅ Port 3000 is now free!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port 3000 may still be in use" -ForegroundColor Yellow
}

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")