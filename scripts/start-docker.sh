#!/bin/bash

# Exit on any error
set -e

# Change to the directory where the script is located (project root if placed there)
cd "$(dirname "$0")"

echo "====================================================="
echo " Starting Database, Storage, and Backend Services "
echo "====================================================="

# 1. Start the database (MariaDB) and storage (MinIO) services
echo "[1/3] Starting 'db' and 'minio' services..."
docker compose up -d db minio

# 2. Add an optional wait time to allow the DB to initialize
echo "[2/3] Waiting for database to initialize..."
sleep 5

# 3. Build and run the backend service
echo "[3/3] Building and starting the 'backend' service..."
docker compose up -d --build backend

echo "====================================================="
echo " All services started successfully!"
echo "-----------------------------------------------------"
echo " Backend URL     : http://localhost:5001"
echo " MinIO Console   : http://localhost:9001 (minioadmin / minioadmin123)"
echo " Database        : localhost:3306 (root / rootpassword)"
echo "====================================================="

# Display the running containers
docker compose ps
