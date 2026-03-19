# Clothing POS System

A complete Point of Sale (POS) system designed for clothing stores, featuring real-time inventory management across multiple branches, sales reporting, and image storage.

## 🚀 Tech Stack

### Backend
- **Framework:** Node.js (Express)
- **Database:** MariaDB (Relational Data)
- **Object Storage:** MinIO (Product Images)
- **Security:** JWT Authentication, Helmet (Header Protection), Express Rate Limit
- **Deployment:** Docker & Docker Compose

### Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Charts:** Recharts (Analytics Dashboard)

---

## 🛠️ Project Structure

```text
/
├── clothing-pos-backend/     # Express API, MariaDB configuration, Dockerfile
├── clothing-pos-frontend/    # Next.js Application, Tailwind UI
├── scripts/                  # Deployment scripts (DigitalOcean)
└── docker-compose.yml        # Orchestration for Backend, DB, and MinIO
```

---

## ⚙️ Getting Started (Recommended: Docker)

The easiest way to run the entire backend stack is using Docker Compose.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for frontend development)

### 1. Setup Backend
1.  Navigate to the backend directory: `cd clothing-pos-backend`
2.  Create `.env` from the example: `cp .env.example .env`
3.  Return to root and start services:
    ```bash
    docker-compose up --build -d
    ```
    - **Backend:** `http://localhost:5001`
    - **MariaDB:** `localhost:3306`
    - **MinIO Console:** `http://localhost:9001` (user: `minioadmin` / pass: `minioadmin123`)

### 2. Setup Frontend
1.  Navigate to the frontend directory: `cd clothing-pos-frontend`
2.  Install dependencies: `npm install`
3.  Run the development server:
    ```bash
    npm run dev
    ```
    - **Frontend:** `http://localhost:3000`

---

## 🔒 Security Features

- **JWT-based Authentication**: Secure user login and role-based access control.
- **Role-Based Access (RBAC)**: Admins have full access, while Employees are restricted to the POS interface.
- **SQL Injection Prevention**: All database queries use parameterized placeholders.
- **Brute-Force Protection**: Rate limiting is applied to all API endpoints.
- **Hardened Headers**: Helmet middleware is used to secure HTTP headers.
- **Password Hashing**: Bcryptjs with salt rounds for secure password storage.

---

## ☁️ Deployment (DigitalOcean)

To deploy the backend to a DigitalOcean Droplet:

1.  Upload the project to your Droplet.
2.  Make the setup script executable:
    ```bash
    chmod +x scripts/setup-do.sh
    ```
3.  Run the script:
    ```bash
    ./scripts/setup-do.sh
    ```
    *This script installs Docker, generates a production JWT secret, and starts all backend services.*

---

## 📝 License

This project is for demonstration purposes. Feel free to use and modify for your own needs.
