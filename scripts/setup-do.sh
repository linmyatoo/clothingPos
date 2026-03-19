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

echo "-------------------------------------------------------"
echo "Setup complete! Backend is running on port 5001."
echo "MinIO Console is running on port 9001."
echo "-------------------------------------------------------"
echo "Next steps:"
echo "1. Configure your DigitalOcean Firewall to allow ports 5001, 9000, 9001 (if not using Nginx)."
echo "2. Setup Nginx and SSL (Certbot) for production-grade security."
echo "3. Initialize your database schema if needed."
echo "-------------------------------------------------------"
