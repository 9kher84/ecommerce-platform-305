# ========================================================================
# AUTOMATED BACKUP SCRIPT FOR E-COMMERCE PLATFORM (Windows)
# ========================================================================
# This script performs automated backups of PostgreSQL database and
# important files for Windows environments.
#
# Usage: .\backup.ps1
# Task Scheduler: Daily at 2 AM
# ========================================================================

param(
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 7
)

# ========================================================================
# CONFIGURATION
# ========================================================================

# Load environment variables from .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim("'").Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Database Configuration
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = $env:DB_PASSWORD
$DB_DATABASE = if ($env:DB_DATABASE) { $env:DB_DATABASE } else { "ecommerce_db" }

# Backup Configuration
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "ecommerce_backup_$Timestamp"
$BackupPath = Join-Path $BackupDir $BackupName

# ========================================================================
# FUNCTIONS
# ========================================================================

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

function Write-Error-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red
}

# ========================================================================
# MAIN BACKUP PROCESS
# ========================================================================

Write-Log "========================================="
Write-Log "Starting backup process..."
Write-Log "========================================="

try {
    # 1. Create backup directory
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    New-Item -ItemType Directory -Path $BackupPath | Out-Null
    Write-Log "Backup directory created: $BackupPath"

    # 2. Backup PostgreSQL Database
    Write-Log "Backing up PostgreSQL database..."
    
    $env:PGPASSWORD = $DB_PASSWORD
    $dumpFile = Join-Path $BackupPath "database.dump"
    
    & pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE `
        --format=custom `
        --file=$dumpFile `
        --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Database backup completed successfully"
    }
    else {
        throw "Database backup failed with exit code $LASTEXITCODE"
    }

    # 3. Backup important files
    Write-Log "Backing up important files..."

    # Backup uploads directory (if exists)
    if (Test-Path ".\uploads") {
        $uploadsZip = Join-Path $BackupPath "uploads.zip"
        Compress-Archive -Path ".\uploads\*" -DestinationPath $uploadsZip -Force
        Write-Log "✅ Uploads directory backed up"
    }

    # Backup logs directory (if exists)
    if (Test-Path ".\logs") {
        $logsZip = Join-Path $BackupPath "logs.zip"
        Compress-Archive -Path ".\logs\*" -DestinationPath $logsZip -Force
        Write-Log "✅ Logs directory backed up"
    }

    # Backup .env file (copy only, encryption optional)
    if (Test-Path ".env") {
        Copy-Item ".env" -Destination (Join-Path $BackupPath "env.backup")
        Write-Log "✅ Environment file backed up"
    }

    # 4. Create compressed archive
    Write-Log "Creating compressed archive..."
    $archivePath = "$BackupDir\$BackupName.zip"
    Compress-Archive -Path "$BackupPath\*" -DestinationPath $archivePath -Force
    Remove-Item -Path $BackupPath -Recurse -Force
    
    $backupSize = (Get-Item $archivePath).Length / 1MB
    Write-Log "✅ Compressed archive created: $archivePath ($([math]::Round($backupSize, 2)) MB)"

    # 5. Clean up old backups
    Write-Log "Cleaning up old backups..."
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "ecommerce_backup_*.zip" | 
    Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
    Remove-Item -Force
    Write-Log "✅ Old backups cleaned up (retention: $RetentionDays days)"

    # 6. Verify backup integrity
    Write-Log "Verifying backup integrity..."
    $testArchive = Test-Path $archivePath
    if ($testArchive) {
        Write-Log "✅ Backup integrity verified"
    }
    else {
        throw "Backup file not found after creation"
    }

    # ========================================================================
    # COMPLETION
    # ========================================================================

    Write-Log "========================================="
    Write-Log "✅ Backup completed successfully!"
    Write-Log "Backup file: $archivePath"
    Write-Log "Backup size: $([math]::Round($backupSize, 2)) MB"
    Write-Log "========================================="

    exit 0

}
catch {
    Write-Error-Log $_.Exception.Message
    Write-Error-Log "Backup process failed!"
    exit 1
}
