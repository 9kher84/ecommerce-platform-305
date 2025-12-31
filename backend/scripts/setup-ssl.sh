#!/bin/bash
# ========================================================================
# LET'S ENCRYPT SSL CERTIFICATE SETUP SCRIPT
# ========================================================================
# This script obtains and configures SSL certificates using Let's Encrypt
#
# Usage: ./setup-ssl.sh yourdomain.com
# ========================================================================

set -e

# Check if domain is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 example.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@$DOMAIN"  # Change this to your email

echo "========================================="
echo "Let's Encrypt SSL Setup"
echo "========================================="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# 1. Install Certbot (if not installed)
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    
    # For Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    # For CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    else
        echo "ERROR: Unable to install Certbot automatically"
        echo "Please install Certbot manually: https://certbot.eff.org/"
        exit 1
    fi
    
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# 2. Stop Nginx temporarily (if running)
if systemctl is-active --quiet nginx; then
    echo "Stopping Nginx temporarily..."
    sudo systemctl stop nginx
    NGINX_WAS_RUNNING=true
else
    NGINX_WAS_RUNNING=false
fi

# 3. Obtain SSL certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully"
else
    echo "❌ Failed to obtain SSL certificate"
    exit 1
fi

# 4. Update Nginx configuration
echo "Updating Nginx configuration..."
NGINX_CONF="./nginx/nginx.conf"

if [ -f "$NGINX_CONF" ]; then
    # Replace yourdomain.com with actual domain
    sed -i "s/yourdomain.com/$DOMAIN/g" "$NGINX_CONF"
    echo "✅ Nginx configuration updated"
else
    echo "⚠️  Nginx configuration file not found: $NGINX_CONF"
fi

# 5. Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# 6. Start/Restart Nginx
if [ "$NGINX_WAS_RUNNING" = true ]; then
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
else
    echo "Starting Nginx..."
    sudo systemctl start nginx
fi

echo "✅ Nginx started successfully"

# 7. Enable automatic renewal
echo "Setting up automatic certificate renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "✅ Automatic renewal enabled"

# 8. Test automatic renewal
echo "Testing automatic renewal..."
sudo certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Automatic renewal test passed"
else
    echo "⚠️  Automatic renewal test failed (but certificate is still valid)"
fi

# ========================================================================
# COMPLETION
# ========================================================================

echo ""
echo "========================================="
echo "✅ SSL Setup Completed Successfully!"
echo "========================================="
echo ""
echo "Certificate details:"
echo "  Domain: $DOMAIN"
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  Expires: $(sudo certbot certificates | grep 'Expiry Date' | head -1)"
echo ""
echo "Next steps:"
echo "1. Visit https://$DOMAIN to verify SSL is working"
echo "2. Test SSL configuration: https://www.ssllabs.com/ssltest/"
echo "3. Certificates will auto-renew before expiration"
echo ""
echo "To manually renew: sudo certbot renew"
echo "========================================="

exit 0
