
Write-Host "============ PERFORMANCE DIAGNOSTIC ============" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray

# 1. Baseline
$proc = Get-Process -Name node -ErrorAction SilentlyContinue | Sort-Object WorkingSet -Descending | Select-Object -First 1

if ($null -eq $proc) {
    Write-Error "Node process not found! Is the server running?"
    exit 1
}

$baseline_cpu = $proc.CPU
$baseline_mem = [math]::Round($proc.WorkingSet / 1MB, 2)
Write-Host "BASELINE (PID: $($proc.Id)): Memory: $baseline_mem MB" -ForegroundColor Green

# 2. Light Load
Write-Host "`nSTARTING LIGHT LOAD TEST (5 conns, 5s)..." -ForegroundColor Yellow
$p1 = Start-Process cmd -ArgumentList "/c npx autocannon -c 5 -d 5 --json http://localhost:5000/api/health > test1.json" -NoNewWindow -PassThru
$p1.WaitForExit()

try {
    if (Test-Path "test1.json") {
        $content1 = Get-Content "test1.json" -Raw
        $res1 = $content1 | ConvertFrom-Json
        
        $proc = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
        $after1_mem = [math]::Round($proc.WorkingSet / 1MB, 2)
        $delta1 = [math]::Round($after1_mem - $baseline_mem, 2)
        
        $isError = $false
        if ($res1.non2xx -gt 0) { $isError = $true }
        
        Write-Host "   Success: $($res1.'2xx')" -ForegroundColor $(if ($isError) { "Red" }else { "Green" })
        Write-Host "   Errors: $($res1.non2xx)" -ForegroundColor $(if ($isError) { "Red" }else { "Green" })
        Write-Host "   Latency p99: $($res1.latency.p99) ms" -ForegroundColor Cyan
        Write-Host "   Mem Delta: $delta1 MB" -ForegroundColor Cyan
    }
    else {
        Write-Host "Test 1 failed to produce output" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error reading test1 results: $_"
}

Start-Sleep -Seconds 5

# 3. Medium Load
Write-Host "`nSTARTING MEDIUM LOAD TEST (20 conns, 10s)..." -ForegroundColor Yellow
$p2 = Start-Process cmd -ArgumentList "/c npx autocannon -c 20 -d 10 --json http://localhost:5000/api/health > test2.json" -NoNewWindow -PassThru
$p2.WaitForExit()

try {
    if (Test-Path "test2.json") {
        $content2 = Get-Content "test2.json" -Raw
        $res2 = $content2 | ConvertFrom-Json
        
        $proc = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
        $after2_mem = [math]::Round($proc.WorkingSet / 1MB, 2)
        $delta2 = [math]::Round($after2_mem - $baseline_mem, 2)

        $isError = $false
        if ($res2.non2xx -gt 0) { $isError = $true }

        Write-Host "   Success: $($res2.'2xx')" -ForegroundColor $(if ($isError) { "Red" }else { "Green" })
        Write-Host "   Errors: $($res2.non2xx)" -ForegroundColor $(if ($isError) { "Red" }else { "Green" })
        Write-Host "   Latency p99: $($res2.latency.p99) ms" -ForegroundColor Cyan
        Write-Host "   Mem Delta: $delta2 MB" -ForegroundColor Cyan
    }
    else {
        Write-Host "Test 2 failed to produce output" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error reading test2 results: $_"
}

Write-Host "`n============ DIAGNOSTIC COMPLETE ============" -ForegroundColor Cyan
