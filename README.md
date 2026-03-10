# Project Lume

A full-stack Kanban project management application. Organize work into projects, manage tickets across customizable boards, collaborate with team members, and track progress — all in a clean, responsive interface.

---

## Monorepo Structure

```
project-lume/
├── backend/      # NestJS REST API
│   ├── docs/     # Backend architecture, API, database, auth flow docs
│   └── README.md
├── frontend/     # Vue 3 SPA
│   ├── docs/     # Frontend architecture, state management, kanban logic docs
│   └── README.md
├── .gitignore
└── README.md     # ← you are here
```

---

## Tech Stack

### Backend

- **NestJS** v11 — REST API framework
- **Prisma** v7 — ORM and database migrations
- **PostgreSQL** — primary database
- **JWT** — authentication via httpOnly cookies
- **Pino** — structured logging

### Frontend

- **Vue 3** — Composition API + `<script setup>`
- **TypeScript** — end-to-end type safety
- **TailwindCSS v4** — utility-first styling
- **TanStack Vue Query** — server state management
- **Pinia** — client state management
- **Vite** — build tool

---

## Features

- **Authentication** — register, login, logout with JWT httpOnly cookies and automatic token refresh
- **Projects** — create, update, and archive projects with unique project keys
- **Kanban Board** — view tickets organized by status columns
- **Tickets** — create, edit, move between columns, delete with role-based permissions
- **Comments** — add, edit, and delete comments on tickets
- **Members** — invite members by email, assign roles (Owner, Admin, Member), remove members
- **Dark Mode** — system preference detection with manual toggle
- **Responsive** — mobile-friendly with collapsible sidebar

### Planned Features

- Drag and drop ticket reordering (Phase 5.2)
- Due dates on tickets (Phase 5.3)
- Filter and search tickets (Phase 5.1)
- User profile and password management (Phase 5.4)
- Forgot / reset password via email (Phase 5.5)
- In-app notifications (Phase 5.6)
- Scrum Board view (Sprint planning, backlog, velocity tracking) (Phase 6)

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 2. Clone

```bash
git clone <repo-url>
cd project-lume
```

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your values
```

### 5. Set up database

```bash
cd backend
npx prisma migrate dev
cd ..
```

### 6. Run

```bash
npm run dev
```

- Frontend: `http://localhost:3006`
- Backend API: `http://localhost:8006/api/v1`

See `backend/README.md` and `frontend/README.md` for detailed setup instructions and environment variable references.

---

## Scripts (run from root)

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start backend + frontend simultaneously  |
| `npm run dev:backend`  | Start backend only                       |
| `npm run dev:frontend` | Start frontend only                      |
| `npm run build`        | Build both for production                |
| `npm run install:all`  | Install dependencies for both workspaces |

---

## Documentation

| Document                                 | Description                                         |
| ---------------------------------------- | --------------------------------------------------- |
| `backend/README.md`                      | Backend setup, scripts, env vars                    |
| `backend/docs/backend-architecture.md`   | Module structure, layer diagram                     |
| `backend/docs/database-schema.md`        | All tables, relationships, ERD                      |
| `backend/docs/auth-flow.md`              | JWT, cookies, refresh token flow                    |
| `backend/docs/api-overview.md`           | All endpoints with request/response shapes          |
| `frontend/README.md`                     | Frontend setup, scripts, env vars, folder structure |
| `frontend/docs/frontend-architecture.md` | Layer diagram, routing, error handling              |
| `frontend/docs/state-management.md`      | Pinia vs Vue Query, cache strategy                  |
| `frontend/docs/kanban-logic.md`          | Board data flow, ticket lifecycle, comments         |
