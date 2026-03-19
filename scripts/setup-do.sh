#!/bin/bash

# Exit on error
set -e

echo "Starting DigitalOcean Backend Setup..."

# 1. Update system and install dependencies
echo "Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 2. Install Docker (if not installed)
if ! [ -x "$(command -v docker)" ]; then
    echo "Installing Docker..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
    echo "Docker already installed."
fi

# 3. Setup Environment Variables
echo "Setting up environment variables..."
if [ ! -f clothing-pos-backend/.env ]; then
    cp clothing-pos-backend/.env.example clothing-pos-backend/.env
    echo "Created .env from .env.example. Please update it with your production secrets."
    # Use sed to set a random JWT secret for production
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your_super_secret_jwt_key_here/$JWT_SECRET/g" clothing-pos-backend/.env
else
    echo ".env file already exists."
fi

# 4. Build and Run containers
echo "Building and starting containers..."
sudo docker compose up -d --build

# 5. Setup Nginx and HTTPS (Certbot)
echo "Setting up Nginx and HTTPS for cpos.duckdns.org..."
DOMAIN="cpos.duckdns.org"
EMAIL="admin@cpos.duckdns.org" # Replace with your real email if desired

# Install Nginx and Certbot
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx Config for backend
echo "Configuring Nginx..."
sudo bash -c "cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"

# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Run Certbot (SSL)
# Note: This requires the domain to point to this server's IP and port 80 to be open.
# We use || echo to prevent the script from failing if the domain is not yet pointing.
echo "Attempting to obtain SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL || \
  echo "Certbot failed. Make sure $DOMAIN is pointing to this server's IP and try again manually: sudo certbot --nginx -d $DOMAIN"

echo "-------------------------------------------------------"
echo "Setup complete! Backend is running on port 5001."
echo "HTTPS is configured for https://$DOMAIN"
echo "MinIO Console is running on port 9001."
echo "-------------------------------------------------------"
echo "Next steps:"
echo "1. Configure your DigitalOcean Firewall to allow ports 80, 443, 9000, 9001."
echo "2. Verify your domain $DOMAIN points to this server."
echo "3. Initialize your database schema if needed."
echo "-------------------------------------------------------"
