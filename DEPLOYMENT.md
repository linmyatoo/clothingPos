# Deployment Guide — Remote Server (Ubuntu)

Complete guide to deploy Clothing POS on a remote VPS (DigitalOcean, AWS EC2, Hetzner, etc.) with HTTPS on all services.

## Architecture

```
Internet
  │
  ├─ https://yourdomain.com        → Nginx → Backend (port 5001)
  ├─ https://yourdomain.com:9000   → Nginx → MinIO API (port 19000)
  └─ https://yourdomain.com:9001   → Nginx → MinIO Console (port 19001)

Docker Network
  ├─ pos-backend   (Node.js Express)
  ├─ pos-db        (MariaDB 10.11)
  └─ pos-minio     (MinIO object storage)
```

All services run in Docker containers. Nginx on the host handles SSL termination and reverse proxying.

---

## Part 1 — Server Provisioning

### 1. Create a VPS

- **OS:** Ubuntu 22.04 LTS or 24.04 LTS
- **Minimum specs:** 1 vCPU, 1 GB RAM, 25 GB SSD

### 2. Open Firewall Ports

Open these inbound ports in your cloud provider's firewall:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (Let's Encrypt verification) |
| 443 | TCP | HTTPS — Backend API |
| 9000 | TCP | HTTPS — MinIO API |
| 9001 | TCP | HTTPS — MinIO Console |

### 3. Point Your Domain

Create a DNS A record pointing your domain (e.g. `cpos.duckdns.org`) to the server's public IP. Wait for DNS propagation (2–5 minutes) before continuing.

---

## Part 2 — Initial Server Setup

### 1. SSH Into the Server

```bash
ssh root@<SERVER_IP>
```

### 2. Clone the Repository

```bash
git clone <your-repo-url> clothingPos
cd clothingPos
```

### 3. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 4. Run the Main Setup Script

This script:
- Updates system packages
- Installs Docker and Docker Compose
- Generates a production JWT secret
- Builds and starts all containers
- Installs Nginx and Certbot
- Configures HTTPS for the backend API

```bash
sudo ./scripts/setup-do.sh
```

If Certbot fails, make sure your domain resolves to the server IP and re-run:

```bash
sudo certbot --nginx -d yourdomain.com
```

### 5. Configure MinIO SSL

This script sets up Nginx reverse proxy for MinIO with the same SSL certificate:

```bash
sudo ./scripts/setup-ssl-minio.sh
```

### 6. Initialize the Database

```bash
bash scripts/setup_database.sh --all
```

This runs `schema.sql` and all migrations. Default admin credentials:

- **Email:** admin@clothingpos.com
- **Password:** admin123

> **Important:** Change the admin password after first login.

---

## Part 3 — Verify Everything Works

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Backend API | `https://yourdomain.com` | API JSON response |
| MinIO Console | `https://yourdomain.com:9001` | MinIO login page |
| MinIO API | `https://yourdomain.com:9000` | MinIO XML response |

Check container status:

```bash
docker compose ps
```

Check backend logs:

```bash
docker compose logs -f backend
```

---

## Part 4 — Production Credentials

Before going live, change all default passwords. Edit `docker-compose.yml` and update:

### Change MariaDB Password

```bash
# 1. Change the password inside MariaDB
docker exec -it pos-db mysql -u root -prootpassword \
  -e "ALTER USER 'root'@'%' IDENTIFIED BY 'NEW_PASSWORD'; FLUSH PRIVILEGES;"

# 2. Update docker-compose.yml in BOTH places:
#    MYSQL_ROOT_PASSWORD (db service)
#    DB_PASSWORD (backend service)

# 3. Restart backend to pick up new credentials
docker compose up -d --build backend
```

### Change MinIO Password

```bash
# 1. Update docker-compose.yml:
#    MINIO_ROOT_PASSWORD (minio service)
#    MINIO_SECRET_KEY (backend service)

# 2. Restart MinIO and backend
docker compose up -d --build minio backend
```

### Change JWT Secret

The setup script auto-generates a JWT secret, but to rotate it:

```bash
# Generate a new secret
openssl rand -base64 32

# Update JWT_SECRET in docker-compose.yml (backend service)
# Then restart
docker compose up -d --build backend
```

---

## Part 5 — Redeploying (Backend Updates)

When you push changes to the backend code, redeploy on the server:

```bash
cd ~/clothingPos
git pull origin main
docker compose up -d --build backend
```

This only rebuilds the backend container. Database and MinIO stay running with zero downtime.

---

## Part 6 — Useful Commands

### View Logs

```bash
docker compose logs -f backend     # Backend logs
docker compose logs -f db          # MariaDB logs
docker compose logs -f minio       # MinIO logs
docker compose logs -f             # All services
```

### Restart a Service

```bash
docker compose restart backend
docker compose restart db
docker compose restart minio
```

### Stop All Services

```bash
docker compose down
```

### Start All Services

```bash
docker compose up -d
```

### Reset Database (Destroys All Data)

```bash
docker compose down
docker volume rm clothingpos_db-data
docker compose up -d
bash scripts/setup_database.sh --all
```

### Renew SSL Certificates

Certbot auto-renews via systemd timer, but you can manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Check Nginx Config

```bash
sudo nginx -t
sudo systemctl status nginx
```

---

## Part 7 — Troubleshooting

### Backend won't start

```bash
docker compose logs backend
```

Common causes:
- Database not ready yet → `docker compose restart backend`
- Wrong DB password → check `DB_PASSWORD` matches `MYSQL_ROOT_PASSWORD`

### Can't reach the server on HTTPS

1. Check firewall allows ports 80, 443, 9000, 9001
2. Check domain DNS points to the server: `dig yourdomain.com`
3. Check Nginx is running: `sudo systemctl status nginx`
4. Check Certbot certificate exists: `sudo certbot certificates`

### MinIO upload fails

1. Check MinIO container is running: `docker compose ps minio`
2. Check MinIO SSL proxy config: `cat /etc/nginx/sites-available/minio`
3. Check `MINIO_PUBLIC_PROTOCOL` is `https` in `docker-compose.yml`

### Database connection refused

```bash
docker compose logs db
```

MariaDB can take a few seconds on first boot. If it keeps failing, check the password in `docker-compose.yml` matches across both the `db` and `backend` services.
