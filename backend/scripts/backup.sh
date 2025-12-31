#!/bin/bash
# ========================================================================
# AUTOMATED BACKUP SCRIPT FOR E-COMMERCE PLATFORM
# ========================================================================
# This script performs automated backups of PostgreSQL database and
# important files, then uploads them to cloud storage (optional).
#
# Usage: ./backup.sh
# Cron: 0 2 * * * /path/to/backup.sh  # Daily at 2 AM
# ========================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# ========================================================================
# CONFIGURATION
# ========================================================================

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Backup Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ecommerce_backup_${TIMESTAMP}"
RETENTION_DAYS=7

# Database Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"
DB_DATABASE="${DB_DATABASE:-ecommerce_db}"

# S3 Configuration (Optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_ENABLED="${BACKUP_S3_ENABLED:-false}"

# Notification Configuration (Optional)
NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL:-}"

# ========================================================================
# FUNCTIONS
# ========================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

send_notification() {
    if [ -n "$NOTIFY_EMAIL" ]; then
        echo "$2" | mail -s "$1" "$NOTIFY_EMAIL"
    fi
}

# ========================================================================
# MAIN BACKUP PROCESS
# ========================================================================

log "========================================="
log "Starting backup process..."
log "========================================="

# 1. Create backup directory
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

log "Backup directory created: $BACKUP_PATH"

# 2. Backup PostgreSQL Database
log "Backing up PostgreSQL database..."
export PGPASSWORD="$DB_PASSWORD"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_DATABASE" \
    --format=custom \
    --file="$BACKUP_PATH/database.dump" \
    --verbose

if [ $? -eq 0 ]; then
    log "✅ Database backup completed successfully"
else
    error "❌ Database backup failed"
    send_notification "Backup Failed" "Database backup failed at $(date)"
    exit 1
fi

# 3. Backup important files
log "Backing up important files..."

# Backup uploads directory (if exists)
if [ -d "./uploads" ]; then
    tar -czf "$BACKUP_PATH/uploads.tar.gz" ./uploads
    log "✅ Uploads directory backed up"
fi

# Backup logs directory (if exists)
if [ -d "./logs" ]; then
    tar -czf "$BACKUP_PATH/logs.tar.gz" ./logs
    log "✅ Logs directory backed up"
fi

# Backup .env file (encrypted)
if [ -f ".env" ]; then
    # Encrypt .env file before backup (requires openssl)
    openssl enc -aes-256-cbc -salt -in .env -out "$BACKUP_PATH/env.enc" -k "${ENCRYPTION_KEY:-backup_key_2024}"
    log "✅ Environment file backed up (encrypted)"
fi

# 4. Create compressed archive
log "Creating compressed archive..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"  # Remove uncompressed directory
cd ..

BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "✅ Compressed archive created: $BACKUP_FILE ($BACKUP_SIZE)"

# 5. Upload to S3 (if enabled)
if [ "$S3_ENABLED" = "true" ] && [ -n "$S3_BUCKET" ]; then
    log "Uploading backup to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/" --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log "✅ Backup uploaded to S3 successfully"
    else
        error "⚠️ S3 upload failed (backup still available locally)"
    fi
fi

# 6. Clean up old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "ecommerce_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
log "✅ Old backups cleaned up (retention: $RETENTION_DAYS days)"

# 7. Verify backup integrity
log "Verifying backup integrity..."
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log "✅ Backup integrity verified"
else
    error "❌ Backup integrity check failed"
    send_notification "Backup Integrity Failed" "Backup file is corrupted: $BACKUP_FILE"
    exit 1
fi

# ========================================================================
# COMPLETION
# ========================================================================

log "========================================="
log "✅ Backup completed successfully!"
log "Backup file: $BACKUP_FILE"
log "Backup size: $BACKUP_SIZE"
log "========================================="

send_notification "Backup Successful" "Backup completed successfully at $(date)\nFile: $BACKUP_FILE\nSize: $BACKUP_SIZE"

exit 0
