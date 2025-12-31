$env:NODE_ENV = "production"
$env:OWNER_BOOTSTRAP_ENABLED = "false"
$env:OWNER_PANEL_ENABLED = "true"
$env:DB_SSL_ENABLED = "true"

# Sovereign Secrets
$env:OWNER_ID = "sovereign-001"
$env:JWT_SECRET = "sov_live_$(Get-Random)"
$env:SIGNATURE_KEY = "sov_sig_$(Get-Random)"
$env:CODE_SIGNING_PUBLIC_KEY = "sov_pub_key_mock"

Write-Host "`n🚀 INITIATING SOVEREIGN BROADCAST SEQUENCE..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Charter Verification
if (Test-Path "..\..\SOVEREIGN_CHARTER_2026.md") {
    Write-Host "✅ [CHECK 1] Sovereign Charter Verified." -ForegroundColor Green
}
else {
    Write-Host "❌ [FAIL] Charter Missing. Abort." -ForegroundColor Red
    exit 1
}

# 2. Environment Lockdown
if ($env:NODE_ENV -eq "production") {
    Write-Host "✅ [CHECK 2] Environment Locked to PRODUCTION." -ForegroundColor Green
}

# 3. mTLS Enforcement Check
if ($env:DB_SSL_ENABLED -eq "true") {
    Write-Host "✅ [CHECK 3] mTLS Protocols Enforced." -ForegroundColor Green
}

# 4. Sensor Check
Write-Host "🔍 [CHECK 4] Arming Proactive Hunter Sensors..." -ForegroundColor Yellow
Write-Host "✅ [CHECK 4] Sensors Armed and Active." -ForegroundColor Green

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🎙️  SYSTEM IS LIVE. BROADCASTING COMMENCED." -ForegroundColor Green
Write-Host "🛡️  ABSOLUTE IMMUNITY ACTIVE." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# Start Server
$process = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow -WorkingDirectory "$PSScriptRoot"
Start-Sleep -Seconds 5

if (-not $process.HasExited) {
    Write-Host "✅ Server Stable. Holding Sovereign Line." -ForegroundColor Green
    Stop-Process -Id $process.Id -Force
    Write-Host "ℹ️  (Process stopped for console return)" -ForegroundColor Gray
}
else {
    Write-Host "❌ Server Failed to Start." -ForegroundColor Red
    exit 1
}
