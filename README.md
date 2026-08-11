# Village AI Nexus

## Overview
Village AI Nexus is a multi-tenant school management application with an integrated AI Student Assistant. 

Designed as a practical engineering project inspired by the Village AI Nexus assignment, this platform provides a unified workspace for managing schools, users, and academics, while empowering students with an interactive, context-aware AI learning assistant. 

The platform supports four roles:
- **SUPER_ADMIN**: System-wide platform administration
- **SCHOOL_ADMIN**: Tenant-scoped school management
- **TEACHER**: Class and attendance management
- **STUDENT**: Academic dashboard and AI Assistant access

Each role receives a dedicated, specialized experience. The architecture uses a modular FastAPI backend, Next.js frontend, PostgreSQL, SQLAlchemy, Alembic, and an AI provider abstraction.

> [!NOTE]
> This project is a mini implementation designed as an engineering assignment, rather than a claim of being a complete production deployment.

---

## Core Features

### Authentication
- JWT-based authentication
- Secure `HttpOnly` cookies
- bcrypt password hashing
- Login / Logout workflows
- Current user session resolution

### RBAC
Authorization is enforced **server-side** with four distinct roles:
- `SUPER_ADMIN`
- `SCHOOL_ADMIN`
- `TEACHER`
- `STUDENT`

### Multi-Tenancy
Each school represents a distinct tenant.
- Ordinary users are permanently scoped to their assigned school.
- `SUPER_ADMIN` can operate across schools using explicitly authorized context.
- Frontend filtering is NOT the security boundary. Backend authorization and tenant-aware repositories enforce strict isolation at the database level.

### School Management
- Create, View, Update schools
- Track school statistics
- Manage active/inactive states

### Student Management
- Create, View, Update, Search, and Filter students
- Pagination support
- Track grade, section, parent information, and status
- Student ownership enforcement for student accounts

### Teacher Management
- Teacher CRUD
- Teacher-to-user linking
- Teacher-to-school isolation
- Search and pagination

### Class Management
- Class CRUD
- Track grade and section
- Assign teachers to classes
- Strict school isolation

### Attendance
- Teacher marks attendance (Present / Absent)
- Class-level bulk attendance logging
- Calculate attendance percentage
- Track student attendance history
- School-level attendance metrics
- Tenant-isolated records

### AI Student Assistant
- Exclusive student-only access
- Real-time streaming responses
- Persistent conversations and messages
- Conversational history/context awareness
- AI provider abstraction (Supports OpenAI, Gemini, and Fake providers)
- Stop generation, Retry, and Regenerate actions
- Markdown rendering and code blocks
- Secure conversation ownership enforcement

---

## Product Roles

| Role | Purpose | Main Capabilities |
|------|---------|------------------|
| **SUPER_ADMIN** | System-wide school administration | Manage all schools, cross-tenant visibility |
| **SCHOOL_ADMIN**| Manages their own school's ecosystem | Manage students, teachers, classes for their school |
| **TEACHER** | Manages assigned classes and attendance | View assigned classes, mark attendance |
| **STUDENT** | Views personal academic information | View attendance, interact with AI Assistant |

---

## Feature Matrix

| Feature | Super Admin | School Admin | Teacher | Student |
|---------|-------------|--------------|---------|---------|
| Manage Schools | ✅ | ❌ | ❌ | ❌ |
| Manage School Admins | ✅ | ❌ | ❌ | ❌ |
| Manage Teachers | ✅ | ✅ | ❌ | ❌ |
| Manage Students | ✅ | ✅ | ❌ | ❌ |
| Manage Classes | ✅ | ✅ | ❌ | ❌ |
| View Assigned Classes | ✅ | ✅ | ✅ | ❌ |
| Mark Attendance | ❌ | ❌ | ✅ | ❌ |
| View Own Attendance | ❌ | ❌ | ❌ | ✅ |
| Use AI Assistant | ❌ | ❌ | ❌ | ✅ |

---

## Dashboards

### Super Admin Dashboard
Provides a system-wide overview including:
- Total Schools, Students, Teachers, and Classes
- School performance overview
- Quick administration actions

### School Admin Dashboard
Provides tenant-scoped insights:
- Total Students, Teachers, and Classes
- Today's attendance snapshot
- School-specific metrics
- Quick management actions

### Teacher Dashboard
Provides class-level insights:
- Assigned classes overview
- Student counts per class
- Today's attendance tracking and completion percentage
- Class workspace access
- Quick attendance actions

### Student Dashboard
Provides personal academic and learning insights:
- Personal identity and context
- Attendance percentage and Present/Absent totals
- Today's attendance status
- Class and Teacher information
- Recent attendance history
- **AI Assistant access** and recent AI conversations

---

## Screens / User Experience

The application leverages a premium monochrome visual system:
- **Black, White, and Neutral Gray** palette
- Thin borders and minimal shadows
- Typography-focused layouts with generous whitespace
- Restrained interactions and responsive layouts

Reusable UI primitives implemented include Button, Card, Badge, Input, Select, Table, EmptyState, ErrorState, and Loading components. The UI features a role-aware sidebar navigation and a responsive dashboard shell.

---

## Technology Stack

**Backend:**
- Python 3
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- Pytest
- Uvicorn

**Frontend:**
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Lucide React (Icons)
- React Markdown (AI formatting)

---

## Architecture

**Backend Flow:**
```mermaid
graph TD
    NextJS[Next.js Client] --> API[FastAPI API]
    API --> Services[Service Layer]
    Services --> Repos[Repository Layer]
    Repos --> SA[SQLAlchemy]
    SA --> DB[(PostgreSQL)]
```

**AI Flow:**
```mermaid
graph TD
    Student[Student] --> UI[Next.js AI UI]
    UI --> API[FastAPI AI Endpoint]
    API --> AIService[AI Service]
    AIService --> AIProvider{AI Provider}
    AIProvider --> OpenAI[OpenAIProvider]
    AIProvider --> Gemini[GeminiProvider]
    AIProvider --> Fake[FakeAIProvider]
```
> [!NOTE]
> The provider abstraction allows the AI implementation to be hot-swapped (e.g. for testing) without rewriting the service layer.

---

## Repository Structure

```
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── ai/               # AI provider abstractions
│   │   ├── api/              # API routers and endpoints
│   │   ├── core/             # Config and security
│   │   ├── db/               # Database session and seed
│   │   ├── models/           # SQLAlchemy models
│   │   ├── repositories/     # Data access layer
│   │   ├── schemas/          # Pydantic validation models
│   │   └── services/         # Business logic (e.g. AIService)
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # UI Primitives, Layouts, Features
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utils and API client
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## Authentication & RBAC

- **Authentication ("Who are you?"):** Uses bcrypt for password hashing and JWT for token generation. Tokens are passed to the client and securely stored in `HttpOnly` cookies.
- **Authorization ("What are you allowed to do?"):** Enforced via FastAPI dependencies (`require_roles()`) that check the current user's role against endpoint permissions.

---

## Multi-Tenant Architecture

- Users have a `school_id` where applicable.
- **Tenant-aware repositories** strictly enforce school boundaries during database queries.
- `get_current_school()` resolves tenant context directly from the authenticated JWT identity.
- Ordinary users *cannot* override their school context via URL parameters (e.g., `?school_id=`) or request body values.
- `SUPER_ADMIN` users bypass standard tenant checks and can operate globally under explicit authorization rules.

---

## AI Student Assistant

### Conversations
Students can create, view, open, and delete conversations, as well as send messages within them. All conversations are persistent and owned securely by the student.

### Context
The AI service loads recent conversation messages (history) to provide context-aware responses and conversational continuity.

### Provider Abstraction
The backend implements `AIProvider`, `OpenAIProvider`, `GeminiProvider`, and `FakeAIProvider`. 
The `FakeAIProvider` exists to allow deterministic testing and local development without relying on external API calls or incurring costs.

---

## Real-Time AI Streaming

**Frontend:**
Uses `fetch()` returning a `ReadableStream`, which is processed by a `TextDecoder` to render markdown progressively using an `AbortController` for cancellation. The UX ensures responses begin appearing immediately without long loading states, supports "Stop Generation", auto-scrolling, and handles markdown/code blocks smoothly.

**Backend:**
Uses FastAPI's `StreamingResponse` with `text/event-stream` media type. The AI Service streams chunks from the provider directly to the client, persisting the final assistant message to the database once the stream completes.

---

## Database & Migrations

The database is **PostgreSQL**, managed asynchronously with `asyncpg` and **SQLAlchemy 2.x**. 
Schema evolution is strictly managed via **Alembic** migrations.

**Core Entities:**
- User
- School
- Student
- Teacher
- Class (`class_.py`)
- Attendance
- Conversation
- Message

---

## API Overview

Key endpoint groups:
- `/api/v1/auth`: Login, Logout, Profile
- `/api/v1/schools`: School CRUD
- `/api/v1/students`: Student CRUD
- `/api/v1/teachers`: Teacher CRUD
- `/api/v1/classes`: Class CRUD
- `/api/v1/attendance`: Attendance logging and retrieval
- `/api/v1/dashboard`: Role-specific metric aggregation
- `/api/v1/ai`: Conversational endpoints
  - `POST /api/v1/ai/conversations/{id}/messages/stream` (Streaming completion)

---

## Environment Configuration

Use the `.env.example` files to configure your local environment. 

**Backend (`backend/.env`):**
```env
PROJECT_NAME="Village AI Nexus"
API_V1_STR="/api/v1"
DATABASE_URL="postgresql+asyncpg://village_user:village_password@localhost:5432/village_db"
CORS_ORIGINS=["http://localhost:3000"]
AI_PROVIDER=openai
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o-mini
```

**Frontend (`frontend/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> [!CAUTION]
> Never commit actual `.env` files containing real secrets to version control.

---

## Local Development Setup

1. **Clone repository**
2. **Configure environment:** Copy `.env.example` to `.env` in both `backend` and `frontend` directories.
3. **Start PostgreSQL:** Use Docker to spin up the database.
   ```bash
   docker compose up db -d
   ```
4. **Setup Backend:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
5. **Apply migrations:**
   ```bash
   alembic upgrade head
   ```
6. **Seed development data:**
   ```bash
   python setup_test_db.py
   ```
7. **Start backend:**
   ```bash
   uvicorn app.main:app --reload
   ```
8. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Alternatively, you can run the entire stack using Docker:
```bash
docker compose up -d
```

---

## Seed / Demo Data

Running `python setup_test_db.py` creates the following demo accounts (Password for all is `password123`):

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | `super_admin@example.com` | `password123` |
| SCHOOL_ADMIN | `schoola_admin@example.com` | `password123` |
| TEACHER | `schoola_teacher@example.com` | `password123` |
| STUDENT | `schoola_student@example.com` | `password123` |
| SCHOOL_ADMIN | `schoolb_admin@example.com` | `password123` |
| TEACHER | `schoolb_teacher@example.com` | `password123` |
| STUDENT | `schoolb_student@example.com` | `password123` |

> [!WARNING]
> These credentials are for local development/demo purposes only. Do not expose them in production.

---

## Testing

The backend test suite is written in `pytest`. It covers authentication, RBAC, tenant isolation, schools, students, teachers, classes, attendance, dashboards, and the AI Assistant flows.

Run tests using:
```bash
cd backend
source .venv/bin/activate
pytest
```
*Current test pass rate: 40/40 tests passing successfully.*
*Note: Code coverage percentage was not explicitly measured.*

---

## Security

Security controls implemented for the scope of this assignment include:
- bcrypt password hashing
- `HttpOnly` authentication cookies
- JWT tokens
- Explicit Role-Based Access Control (RBAC)
- Multi-tenant data isolation
- Server-side authorization checks
- Student resource ownership enforcement
- AI conversation ownership validation
- Database constraints and relationship handling
- API keys kept exclusively on the backend

---

## Design System

The application uses a **Premium Black & White Design System** characterized by:
- Clarity and visual hierarchy
- Generous whitespace
- Consistent interaction patterns
- Accessibility considerations
- Fully responsive layouts
- Role-specific navigation and UX paths

---

## Known Limitations

- Student ↔ Class relationships are inferred dynamically through grade and section matching, rather than explicit many-to-many associations.
- The AI Assistant provides general knowledge and does not currently utilize curriculum-specific RAG (Retrieval-Augmented Generation).
- Dashboard visualizations use lightweight CSS/SVG rather than heavy charting libraries to maintain performance.

---

## Future Improvements

*FUTURE WORK (Not currently implemented)*
- Curriculum-aware RAG for the AI assistant
- Advanced AI moderation and safety guardrails
- Parent portals
- Assignment and Timetable management
- Comprehensive exam and results tracking
- System audit logs
- Automated deployments (CI/CD) and E2E testing

---

## Assignment Requirement Traceability

| Assignment Requirement | Implementation | Status |
|-------------------------|----------------|--------|
| Authentication & Roles | `backend/app/api/v1/endpoints/auth.py`, `backend/app/api/deps.py` | ✅ Implemented |
| School Management | `backend/app/api/v1/endpoints/schools.py`, `backend/app/repositories/school.py` | ✅ Implemented |
| Student Management | `backend/app/api/v1/endpoints/students.py`, `backend/app/repositories/student.py` | ✅ Implemented |
| Attendance | `backend/app/api/v1/endpoints/attendance.py`, `backend/app/repositories/attendance.py` | ✅ Implemented |
| Dashboards | `backend/app/api/v1/endpoints/dashboard.py`, `backend/app/repositories/dashboard.py` | ✅ Implemented |
| Data Security & Isolation | `backend/app/api/deps.py` (`verify_school_access`, `get_current_school`) | ✅ Implemented |
| AI Student Assistant | `backend/app/api/v1/endpoints/ai.py`, `backend/app/services/ai.py` | ✅ Implemented |

---

## Demo Flow

To demonstrate the application capabilities:

1. **Super Admin**: Login → System overview → Schools list → School management
2. **School Admin**: Login → School dashboard → Students → Teachers → Classes → Attendance overview
3. **Teacher**: Login → Teacher dashboard → Assigned classes → Open class workspace → Mark bulk attendance
4. **Student**: Login → Student dashboard → View attendance → View class information → Open AI Assistant
5. **AI Demonstration**: Open AI Assistant → Ask "Explain photosynthesis in simple words" → Observe real-time streamed markdown response and conversation persistence.
6. **Security Demonstration**: Attempt unauthorized cross-school or cross-student access via direct API calls (Expected: 403 / 404).

---

## Verification Status

- Backend Tests (`pytest`): **PASS** (40/40)
- Frontend Build (`npm run build`): **ENVIRONMENT BLOCKED** (npm not installed in validation environment)

## Project Status

Village AI Nexus currently contains the complete assignment scope:
Authentication, RBAC, Multi-tenancy, School Management, Student Management, Teacher Management, Class Management, Attendance, Dashboards, AI Student Assistant, and Real-time AI streaming.

**Status: Assignment-ready implementation**
