#!/usr/bin/env pwsh
# Git History Security Audit Script

Write-Host "`n🔐 بدء فحص أمان Git History...`n" -ForegroundColor Cyan

# Check for .env files
Write-Host "1️⃣ البحث عن ملفات .env في التاريخ..." -ForegroundColor Yellow
$envFiles = git log --all --full-history --pretty=format: --name-only -- "*/.env" "*.env" | Sort-Object -Unique | Where-Object { $_ -ne "" }

if ($envFiles) {
    Write-Host "❌ تحذير: وجدت ملفات .env في التاريخ:" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    $envCount = ($envFiles | Measure-Object).Count
}
else {
    Write-Host "✅ لا توجد ملفات .env في التاريخ" -ForegroundColor Green
    $envCount = 0
}

# Check for vault_secrets.json
Write-Host "`n2️⃣ البحث عن ملفات vault_secrets.json في التاريخ..." -ForegroundColor Yellow
$vaultFiles = git log --all --full-history --pretty=format: --name-only -- "*/vault_secrets.json" | Sort-Object -Unique | Where-Object { $_ -ne "" }

if ($vaultFiles) {
    Write-Host "❌ تحذير: وجدت ملفات vault_secrets.json في التاريخ:" -ForegroundColor Red
    $vaultFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    $vaultCount = ($vaultFiles | Measure-Object).Count
}
else {
    Write-Host "✅ لا توجد ملفات vault_secrets.json في التاريخ" -ForegroundColor Green
    $vaultCount = 0
}

# Check current .gitignore
Write-Host "`n3️⃣ التحقق من .gitignore الحالي..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $requiredPatterns = @('.env', 'vault_secrets.json', '*.pem', '*.key')
    $missingPatterns = @()
    
    foreach ($pattern in $requiredPatterns) {
        if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
            $missingPatterns += $pattern
        }
    }
    
    if ($missingPatterns.Count -gt 0) {
        Write-Host "⚠️ أنماط مفقودة في .gitignore:" -ForegroundColor Yellow
        $missingPatterns | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    }
    else {
        Write-Host "✅ .gitignore يحتوي على جميع الأنماط المطلوبة" -ForegroundColor Green
    }
}
else {
    Write-Host "❌ ملف .gitignore غير موجود!" -ForegroundColor Red
}

# Check for Git tag
Write-Host "`n4️⃣ التحقق من علامة الأمان..." -ForegroundColor Yellow
$securityTag = git tag -l "v1.0.0-secured"
if ($securityTag) {
    Write-Host "✅ علامة الأمان موجودة: $securityTag" -ForegroundColor Green
}
else {
    Write-Host "⚠️ علامة الأمان غير موجودة" -ForegroundColor Yellow
}

# Final summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 ملخص الفحص الأمني" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$totalIssues = $envCount + $vaultCount

if ($totalIssues -eq 0) {
    Write-Host "✅ النتيجة: نظيف - لا توجد ملفات أسرار في تاريخ Git" -ForegroundColor Green
    Write-Host "✅ الحالة: جاهز للإنتاج" -ForegroundColor Green
    Write-Host "`n📋 التفاصيل:" -ForegroundColor Cyan
    Write-Host "   - ملفات .env في التاريخ: $envCount" -ForegroundColor Green
    Write-Host "   - ملفات vault_secrets.json في التاريخ: $vaultCount" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ النتيجة: وجدت $totalIssues ملف حساس في التاريخ" -ForegroundColor Red
    Write-Host "⚠️ الحالة: يتطلب تطهير Git History" -ForegroundColor Yellow
    Write-Host "`nراجع: backend/reports/GIT_HISTORY_CLEANUP_GUIDE.md" -ForegroundColor Yellow
    exit 1
}
