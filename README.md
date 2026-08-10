# Village AI Nexus

## Overview
Village AI Nexus is a multi-tenant school management platform designed with modern frontend and backend technologies. It includes distinct portals for Super Admin, School Admin, Teacher, and Student, alongside an AI Student Assistant.

## Current Status
**Note: This is an ongoing one-week practical assignment.**
Currently, Epic 0 — Project Foundation has been implemented.

## Technology Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** FastAPI, Python 3.11, SQLAlchemy 2.x (Async), Alembic, Pydantic.
- **Database:** PostgreSQL 16 (Containerized).
- **Containerization:** Docker & Docker Compose.

## Architecture
This project is a modular monolith.
- **Backend Layer:** Organizes application logic into `core`, `api`, `models`, `schemas`, `repositories`, `services`, `db`, and `middleware`.
- **Frontend Layer:** Built upon Next.js App Router for optimal Server Components support, with a centralized API client located in `lib/api-client.ts`.
- **Data Layer:** Utilizes asyncpg for high-performance async database connections managed via SQLAlchemy 2.0 sessions. 

## Project Structure
```
.
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/                  # FastAPI Application Code
│   │   ├── api/              # Route definitions
│   │   ├── core/             # Configuration & Exceptions
│   │   ├── db/               # SQLAlchemy Session & Base
│   │   ├── models/           # SQLAlchemy Models
│   │   └── ...               
│   ├── tests/                # Pytest Suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js Application
│   ├── app/                  # Next.js App Router Pages
│   ├── lib/                  # Centralized Utilities & API Client
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml        # Orchestration
```

## Local Development
The project requires Docker to run seamlessly on any machine without needing local Node or Python installations.

## Environment Variables
The repository includes `.env.example` files. Create a copy named `.env` in both `frontend/` and `backend/` as needed.
- **Backend:** Defines `DATABASE_URL`, `API_V1_STR`, `CORS_ORIGINS`.
- **Frontend:** Defines `NEXT_PUBLIC_API_URL`.

## Running the Application
Use Docker Compose to spin up the Database, Backend, and Frontend:
```bash
docker compose up -d
```
- Frontend will be available at: http://localhost:3000
- Backend API will be available at: http://localhost:8000
- Health check endpoint: http://localhost:8000/api/v1/health

## Running Tests
To run backend tests (pytest):
```bash
docker compose exec backend pytest
```

To run frontend type checking:
```bash
docker compose exec frontend npx tsc --noEmit
```

## Database Migrations
Migrations are handled via Alembic. The backend container automatically runs `alembic upgrade head` on startup. 
To generate a new migration after modifying models:
```bash
docker compose exec backend alembic revision --autogenerate -m "Your description"
```

## Current Epic
Epic 0 — Project Foundation is implemented. (Waiting to begin Epic 1: Authentication & RBAC).
