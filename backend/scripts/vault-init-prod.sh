#!/bin/bash
# سكريت تهيئة Vault للإنتاج
set -e

VAULT_ADDR=${VAULT_ADDR:-http://localhost:8200}
VAULT_TOKEN=${VAULT_TOKEN:-root-token-123}

echo "🔐 تهيئة HashiCorp Vault للإنتاج..."

# 1. تمكين مسار secrets
curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
  -X POST -d '{"type":"kv-v2"}' \
  $VAULT_ADDR/v1/sys/mounts/secret

# 2. تخزين أسرار المشروع
curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
  -X POST -d '{
    "data": {
      "JWT_SECRET": "'$(openssl rand -hex 64)'",
      "ENCRYPTION_KEY": "'$(openssl rand -hex 32)'",
      "DB_PASSWORD": "'$(openssl rand -hex 16)'",
      "REDIS_PASSWORD": "'$(openssl rand -hex 16)'"
    }
  }' \
  $VAULT_ADDR/v1/secret/data/ecommerce/production

echo "✅ تم تهيئة Vault بنجاح"
