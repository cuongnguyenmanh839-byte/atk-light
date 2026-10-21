$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$logDir = Join-Path $root ".tooling"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$tunnelLog = Join-Path $logDir "tunnel.log"
$cloudflared = Join-Path $root ".tooling\cloudflared.exe"

# 1. Start Backend if not already running on port 3001
$backendPort = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Write-Host "Khoi dong Backend (Port 3001)..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$root\backend`" && node dist/main.js" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "Backend dang chay tren Port 3001."
}

# 2. Start Frontend Vite if not already running on port 5173
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $frontendPort) {
    Write-Host "Khoi dong Frontend (Port 5173)..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$root`" && npm.cmd run dev -- --host 0.0.0.0 --port 5173" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "Frontend dang chay tren Port 5173."
}

# 3. Start Cloudflared tunnel if not already running
$cloudflaredProc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if (-not $cloudflaredProc) {
    Write-Host "Khoi dong Cloudflare Tunnel..."
    if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force -ErrorAction SilentlyContinue }
    
    # Run cloudflared with log output
    Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:5173 --logfile `"$tunnelLog`"" -WindowStyle Hidden
    
    # Wait for URL to appear in tunnel.log
    $foundUrl = $null
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $tunnelLog) {
            $content = Get-Content $tunnelLog -Raw -ErrorAction SilentlyContinue
            if ($content -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
                $foundUrl = $matches[1]
                break
            }
        }
    }
    
    if ($foundUrl) {
        & "$PSScriptRoot\save-online-link.ps1" -Url $foundUrl
    }
} else {
    Write-Host "Cloudflare Tunnel dang chay san."
}
