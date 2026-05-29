#!/bin/bash
# Sovereign Platform - Production Backup Script
# Place this in crontab, e.g., 0 2 * * * /path/to/backup_production.sh

set -e

BACKUP_DIR="/backups/sovereign_db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME=${DB_DATABASE:-"sovereign_db"}
DB_USER=${DB_USER:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo "🔄 Starting backup for database $DB_NAME..."

# Execute pg_dump and compress
export PGPASSWORD=$DB_PASSWORD
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
unset PGPASSWORD

echo "✅ Backup successfully created at $BACKUP_FILE"

# Clean up backups older than 14 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
echo "🧹 Old backups cleaned."

# Optional: Upload to AWS S3
# if [ -n "$AWS_S3_BUCKET" ]; then
#   aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
#   echo "☁️ Uploaded to S3."
# fi
