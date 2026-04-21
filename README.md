# Clothing POS System

A Point of Sale system for clothing stores with multi-branch inventory management, sales reporting, and image storage.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, JWT, Helmet, Rate Limiting |
| Database | MariaDB 10.11 |
| Object Storage | MinIO |
| Frontend | Next.js, React, Tailwind CSS, Recharts |
| Deployment | Docker Compose, Nginx, Let's Encrypt |

## Project Structure

```
clothingPos/
├── clothing-pos-backend/     # Express API, Dockerfile, schema
├── clothing-pos-frontend/    # Next.js application
├── scripts/                  # Setup & deployment scripts
└── docker-compose.yml        # DB + MinIO + Backend orchestration
```

## Quick Start (Local Development)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+

### 1. Start Backend Services

From the project root:

```bash
docker compose up -d --build
```

This starts MariaDB, MinIO, and the backend API:

| Service | URL | Credentials |
|---|---|---|
| Backend API | http://localhost:5001 | — |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin123 |
| MariaDB | localhost:3306 | root / rootpassword |

### 2. Initialize the Database

```bash
bash scripts/setup_database.sh --all
```

Default admin login: `admin@clothingpos.com` / `admin123`

### 3. Start Frontend

```bash
cd clothing-pos-frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Security

- JWT authentication with role-based access (Admin / Employee)
- Parameterized SQL queries (injection prevention)
- Bcrypt password hashing
- Helmet HTTP header hardening
- Rate limiting on all endpoints

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full remote server setup guide.

## License

This project is for demonstration purposes. Use and modify freely.
