#!/bin/bash
set -e

DOMAIN="cpos.duckdns.org"

echo "====================================================="
echo " Setting up Nginx SSL Reverse Proxy for MinIO  "
echo "====================================================="

echo "[1/3] Verifying SSL certificate for $DOMAIN exists..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "⚠️ SSL certificate not found for $DOMAIN!"
    echo "Please ensure you have run the setup-ssl.sh script first."
    exit 1
fi

echo "[2/3] Configuring Nginx to proxy MinIO with SSL..."

sudo bash -c "cat > /etc/nginx/sites-available/minio <<EOF
server {
    listen 9000 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # To allow special characters in headers
    ignore_invalid_headers off;
    # Allow any size file to be uploaded. Set to a value such as 1000m; to restrict file size to a specific value
    client_max_body_size 0;
    # To disable buffering
    proxy_buffering off;

    location / {
        proxy_pass http://127.0.0.1:19000;
        proxy_set_header Host \\\$http_host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}

server {
    listen 9001 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ignore_invalid_headers off;
    client_max_body_size 0;
    proxy_buffering off;

    location / {
        proxy_pass http://127.0.0.1:19001;
        proxy_set_header Host \\\$http_host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        
        # WebSockets
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }
}
EOF"

echo "[3/3] Enabling MinIO Nginx site and restarting Nginx..."
sudo ln -sf /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "====================================================="
echo "✅ MinIO SSL Configuration Complete!"
echo "API URL:     https://$DOMAIN:9000"
echo "Console URL: https://$DOMAIN:9001"
echo "NOTE: Make sure ports 9000 and 9001 are open in your server firewall!"
echo "====================================================="
