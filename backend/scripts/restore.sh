#!/bin/bash
# ========================================================================
# RESTORE SCRIPT FOR E-COMMERCE PLATFORM
# ========================================================================
# This script restores database and files from a backup archive.
#
# Usage: ./restore.sh <backup_file>
# Example: ./restore.sh backups/ecommerce_backup_20251209_020000.tar.gz
# ========================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# ========================================================================
# CONFIGURATION
# ========================================================================

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/ecommerce_backup_20251209_020000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"
DB_DATABASE="${DB_DATABASE:-ecommerce_db}"

# Temporary directory
TEMP_DIR="./temp_restore_$$"

# ========================================================================
# FUNCTIONS
# ========================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

cleanup() {
    log "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

# ========================================================================
# MAIN RESTORE PROCESS
# ========================================================================

log "========================================="
log "Starting restore process..."
log "Backup file: $BACKUP_FILE"
log "========================================="

# 1. Extract backup archive
log "Extracting backup archive..."
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted directory
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "ecommerce_backup_*" | head -n 1)

if [ -z "$EXTRACTED_DIR" ]; then
    error "Failed to find extracted backup directory"
    exit 1
fi

log "✅ Backup extracted to: $EXTRACTED_DIR"

# 2. Restore PostgreSQL Database
if [ -f "$EXTRACTED_DIR/database.dump" ]; then
    log "Restoring PostgreSQL database..."
    
    # Warning prompt
    read -p "⚠️  This will OVERWRITE the current database. Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Drop existing database (if exists) and recreate
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_DATABASE;"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_DATABASE;"
    
    # Restore from dump
    pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_DATABASE" \
        --verbose \
        --no-owner \
        --no-acl \
        "$EXTRACTED_DIR/database.dump"
    
    if [ $? -eq 0 ]; then
        log "✅ Database restored successfully"
    else
        error "❌ Database restore failed"
        exit 1
    fi
else
    log "⚠️  No database dump found in backup"
fi

# 3. Restore uploads directory
if [ -f "$EXTRACTED_DIR/uploads.tar.gz" ]; then
    log "Restoring uploads directory..."
    tar -xzf "$EXTRACTED_DIR/uploads.tar.gz" -C ./
    log "✅ Uploads directory restored"
else
    log "⚠️  No uploads backup found"
fi

# 4. Restore logs directory
if [ -f "$EXTRACTED_DIR/logs.tar.gz" ]; then
    log "Restoring logs directory..."
    tar -xzf "$EXTRACTED_DIR/logs.tar.gz" -C ./
    log "✅ Logs directory restored"
else
    log "⚠️  No logs backup found"
fi

# 5. Restore .env file (if needed)
if [ -f "$EXTRACTED_DIR/env.enc" ]; then
    log "Encrypted .env file found in backup"
    read -p "Restore .env file? (yes/no): " confirm_env
    if [ "$confirm_env" = "yes" ]; then
        openssl enc -aes-256-cbc -d -in "$EXTRACTED_DIR/env.enc" -out .env.restored -k "${ENCRYPTION_KEY:-backup_key_2024}"
        log "✅ .env file decrypted to .env.restored (review before using)"
    fi
fi

# ========================================================================
# COMPLETION
# ========================================================================

log "========================================="
log "✅ Restore completed successfully!"
log "========================================="
log ""
log "Next steps:"
log "1. Restart the application"
log "2. Verify data integrity"
log "3. Check logs for any errors"

exit 0
