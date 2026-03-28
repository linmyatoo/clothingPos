# Full Deployment Guide (DigitalOcean VPS)

This guide provides end-to-end instructions on how to set up the server infrastructure, perform the initial deployment of the Clothing POS platform, and handle subsequent backend API updates.

---

## Part 1: Prerequisites & Infrastructure Prep

### 1. Provision Server
Deploy a DigitalOcean Droplet (VPS). An Ubuntu 22.04 (LTS) or 24.04 (LTS) image is highly recommended. 

### 2. Configure Firewall
In your DigitalOcean Cloud Panel firewall settings, ensure the following **Inbound Rules (Ports)** are open:
*   **22** (SSH) - Setup and Remote Access
*   **80** (HTTP) - Nginx / Let's Encrypt Certificate generation
*   **443** (HTTPS) - Secure Backend API Traffic
*   **9000** (Custom) - Secure MinIO API Traffic
*   **9001** (Custom) - Secure MinIO Console

### 3. Point Domain Name (DuckDNS)
Ensure that your domain (`cpos.duckdns.org`) is actively pointing to the public IP address of your DigitalOcean droplet. **Wait 2-5 minutes** after updating to ensure DNS propagation before running the SSL scripts.

---

## Part 2: Initial Server Setup & Deployment

1. **SSH into the server:**
   ```bash
   ssh root@<YOUR_DROPLET_IP>
   ```

2. **Clone the Repository:**
   ```bash
   git clone <your-repository-url> clothingPos
   cd clothingPos
   ```

3. **Make Setup Scripts Executable:**
   *Make sure all scripts have execution permissions.*
   ```bash
   chmod +x scripts/*.sh
   ```

4. **Run the Primary Setup Script `setup-do.sh`:**
   This script automates system updates, installs Docker, creates a production `.env` file, spins up all Docker containers (Database, MinIO, Backend API), and automatically binds your backend to `cpos.duckdns.org` using Let's Encrypt SSL.
   ```bash
   sudo ./scripts/setup-do.sh
   ```

5. **Run the MinIO SSL Script `setup-ssl-minio.sh`:**
   Since Docker handles MinIO separately, this script configures Nginx to reverse proxy MinIO traffic on ports `9000` and `9001` using the SSL certificates generated in the previous step.
   ```bash
   sudo ./scripts/setup-ssl-minio.sh
   ```

### Verification
Once BOTH scripts successfully finish, your services are running fully securely:
*   **Backend API Check**: Navigate to `https://cpos.duckdns.org/`
*   **MinIO Console Check**: Navigate to `https://cpos.duckdns.org:9001` (Default credentials matching `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`)

---

## Part 3: Redeployment Routine (Backend API Updates)

When you make changes to the backend (i.e. modifying `clothing-pos-backend/`) and push them to your repository, follow these steps to redeploy the latest code directly on the server **without** affecting your database or MinIO data.

1. **SSH into your server and enter the project folder:**
   ```bash
   cd ~/clothingPos
   ```

2. **Pull the latest code from Git:**
   ```bash
   git pull origin main
   ```
   *(Change `main` if you are using a different branch.)*

3. **Rebuild and restart the Backend Container only:**
   Docker Compose will automatically recognize the changes to the Dockerfile context, rebuild the backend image, and spin it back up, replacing the old instance. 
   ```bash
   docker compose up -d --build backend
   ```

That's it! Your database (`pos-db`) and storage (`pos-minio`) will continue running uninterrupted, resulting in a zero configuration reload of your application layer. 

> **Tip:** You can check the logs of your rebuilt backend at any time with:
> `docker compose logs -f backend`
