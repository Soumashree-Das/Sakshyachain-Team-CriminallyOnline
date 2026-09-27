# SākshyaChain — Multi-Tenant Legal & Investigation Digital Vault

[![Docker](https://img.shields.io/badge/Docker-Containerized-blue.svg?logo=docker)](https://www.docker.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Express.js-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**SākshyaChain** is an enterprise-grade, multi-tenant digital vault and chain-of-custody management system designed for legal, judicial, and law enforcement agencies. It features **PKI digital signature verification & stamping**, **Directed Acyclic Graph (DAG) audit trails**, **Break-Glass emergency access**, and **strict multi-level role gateways**.

---

## Key System Features

- **Executive / Boss Portal (Level 4 Clearance)**:
  - Full system oversight for Judicial Magistrates, Senior Authorities, and Compliance Auditors.
  - PKI Digital Signature Stamping & Verification.
  - Audit Trail DAG Graph visualization and security breach alert logs.
  - User directory management & supervisor oversight.

- **Field / Employee Portal (Level 3 / Level 2 Clearance)**:
  - Operational workspace for Chief Investigating Officers and Field Investigators.
  - Restricted access isolation (Boss user IDs, audit DAGs, and profile switching disabled without logout).
  - Case file management, digital evidence upload, and AI Legal Assistant interface.

- **Zero-Trust Security Architecture**:
  - **AES-256-GCM Envelope Encryption** for evidence vault files.
  - **Multi-Factor Authentication (MFA OTP)** with 120s TTL and 3-attempt lockout. The prototype code is `246810`; it is masked on the sign-in screen and documented in [demo credentials and access flow](DEMO_CREDENTIALS_AND_ACCESS_FLOW.md).
  - **Break-Glass Emergency Access** granting temporary 30-minute elevated privileges.
  - **CORS & IP Whitelist Firewall** enforcing subnet and origin security boundaries.

---

## Quick Start: Running with Docker (Recommended)

The entire full-stack application (React frontend + Express API server + Nginx reverse proxy) is fully containerized.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Docker Compose installed.

### 1. Launch Containers
```bash
# Build and start all services in detached mode
docker compose up -d
```

### 2. Verify Container Health
```bash
# Check container status
docker compose ps
```

### 3. Access Application
- **Frontend Web Portal**: [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost)
- **Backend REST API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Stop Containers
```bash
docker compose down
```

---

## Running Locally (Without Docker)

### Prerequisites
- Node.js v20 or higher
- npm v10 or higher

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy the `.env.example` file in the `server` directory to `.env`:
```bash
cp server/.env.example server/.env
```

### 3. Start Development Servers
```bash
npm run dev:all
```
- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:5000`

---

## Repository Directory Structure

```
SakshyaChain/
├── client/                     # React Frontend Application
│   ├── src/                    # Components, Contexts, Pages & Services
│   ├── Dockerfile              # Multi-stage Nginx + Vite container build
│   └── nginx.conf              # SPA routing & unified /api/ reverse proxy
├── server/                     # Express REST API Backend
│   ├── src/                    # Auth, Routes, Services & Security Middleware
│   ├── data/                   # Persistent JSON Database & Audit Ledger
│   ├── .env.example            # Environment variables template (No secrets)
│   └── Dockerfile              # Node.js Alpine container build
├── docker-compose.yml          # Full-stack container orchestration
├── .dockerignore               # Container build context exclusions
├── .gitignore                  # Git tracked file exclusions (.env, keys, modules)
└── README.md                   # System documentation & usage guide
```

---

## Security & Secret Protection Guarantee

- **No Secrets Exposed**: All sensitive configuration options (JWT secrets, master keys, Supabase credentials) are managed strictly via environment variables (`.env`).
- `.env` files, generated private key pairs (`server/data/vault/keys/`), and binary uploads are excluded via `.gitignore` and `.dockerignore`.

---

## License
This project is licensed under the MIT License.
