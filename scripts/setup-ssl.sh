#!/bin/bash
set -e

DOMAIN="cpos.duckdns.org"
EMAIL="admin@cpos.duckdns.org"
BACKEND_PORT=5001

echo "====================================================="
echo " Setting up Nginx and Let's Encrypt for $DOMAIN"
echo "====================================================="

# 1. Install prerequisites
echo "[1/4] Installing Nginx and Certbot..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Configure Nginx
echo "[2/4] Configuring Nginx for $DOMAIN..."
sudo bash -c "cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Backend API proxy
    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
EOF"

# Enable configuration and restart nginx
echo "[3/4] Enabling site and restarting Nginx..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
# Remove default nginx config to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 3. Obtain SSL Certificate
echo "[4/4] Obtaining SSL certificate via Certbot..."
echo "Note: The domain ($DOMAIN) must resolve to this server's public IP address before proceeding."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL || {
  echo "--------------------------------------------------------"
  echo "⚠️ Certbot failed. Please check the following:"
  echo "1. Ensure $DOMAIN points to this DigitalOcean VPS IP address."
  echo "2. Ensure ports 80 and 443 are open in your DigitalOcean firewall."
  echo "You can retry manually later using: sudo certbot --nginx -d $DOMAIN"
  echo "--------------------------------------------------------"
  exit 1
}

echo "====================================================="
echo "✅ SSL Configuration Complete!"
echo "Your backend is now accessible securely at https://$DOMAIN"
echo "====================================================="
