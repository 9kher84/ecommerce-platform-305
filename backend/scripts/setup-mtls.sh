#!/bin/bash
set -e

# Directory for certs
CERT_DIR="certs/mtls"
mkdir -p $CERT_DIR

echo "🔐 Generating mTLS Certificates for Zero Trust Architecture..."

# 1. Create CA (Certificate Authority)
openssl genrsa -out $CERT_DIR/ca.key 4096
openssl req -new -x509 -days 365 -key $CERT_DIR/ca.key -out $CERT_DIR/ca.crt -subj "/CN=SovereignRootCA"

# Function to generate certs
generate_cert() {
    SERVICE=$1
    echo " -> Generating cert for $SERVICE"
    openssl genrsa -out $CERT_DIR/$SERVICE.key 2048
    openssl req -new -key $CERT_DIR/$SERVICE.key -out $CERT_DIR/$SERVICE.csr -subj "/CN=$SERVICE"
    openssl x509 -req -days 365 -in $CERT_DIR/$SERVICE.csr -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -set_serial 01 -out $CERT_DIR/$SERVICE.crt
}

# 2. Generate Certs for Services
generate_cert "backend-server"
generate_cert "database-primary"
generate_cert "redis-cache"
generate_cert "vault-service"

# 3. Secure Permissions
chmod 600 $CERT_DIR/*.key
chmod 644 $CERT_DIR/*.crt

echo "✅ Certificates Generated in $CERT_DIR"
echo "⚠️  Ensure these are mounted to your containers/services!"
