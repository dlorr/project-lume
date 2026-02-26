# TicketFlow — Backend

A production-ready Kanban ticket tracking system built with NestJS, PostgreSQL, and Prisma. Designed with clean architecture, JWT authentication, role-based access control, and scalability in mind.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Running Migrations](#running-migrations)
- [API Overview](#api-overview)
- [Authentication Flow](#authentication-flow)
- [Role-Based Access](#role-based-access)
- [Scripts](#scripts)

---

## Project Overview

TicketFlow is a SaaS-style project management backend inspired by Jira. It supports Kanban boards with customizable columns, ticket management, team collaboration through comments, and project membership with role-based permissions.

**Current Phase: Kanban MVP**

- Scrum boards and sprint management are planned for a future phase
- The architecture is intentionally designed to support these additions without major refactoring

---

## Tech Stack

| Layer            | Technology                                                 |
| ---------------- | ---------------------------------------------------------- |
| Framework        | [NestJS](https://nestjs.com) v11 + TypeScript              |
| Database         | PostgreSQL                                                 |
| ORM              | [Prisma](https://prisma.io) v6/v7                          |
| Authentication   | JWT (access + refresh tokens) via `@nestjs/jwt` + Passport |
| Validation       | `class-validator` + `class-transformer`                    |
| Logging          | [Pino](https://getpino.io) via `nestjs-pino`               |
| Password Hashing | `bcrypt`                                                   |
| Cookie Handling  | `cookie-parser`                                            |

---

## Features

- **JWT Authentication** — httpOnly cookie-based access + refresh tokens with rotation
- **Role-Based Access Control** — per-project roles (OWNER, ADMIN, MEMBER)
- **Project Management** — create, update, archive projects with member invitations
- **Kanban Board** — auto-created with each project, fully customizable columns
- **Ticket Management** — full CRUD, drag-and-drop ordering, priority, type, assignment
- **Comments** — threaded comments with edit/delete and author enforcement
- **Security** — timing attack prevention, user enumeration protection, token revocation
- **Validation** — strict DTO validation with whitelist and forbidNonWhitelisted

---

## Folder Structure

```
src/
├── common/                     # Shared utilities used across all modules
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   └── roles.decorator.ts          # @Roles() metadata decorator
│   ├── filters/
│   │   └── http-exception.filter.ts    # Global exception filter
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Protects routes with access token
│   │   ├── jwt-refresh.guard.ts        # Protects refresh endpoint
│   │   └── roles.guard.ts              # Reserved for future system-level roles
│   └── helpers/
│       └── project-access.helper.ts    # RBAC: project membership + role assertion
│
├── config/                     # Namespaced environment configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── modules/                    # Feature modules (one per domain)
│   ├── auth/                   # Registration, login, refresh, logout
│   ├── users/                  # User lookup service
│   ├── projects/               # Project CRUD + member management
│   ├── boards/                 # Kanban board view
│   ├── statuses/               # Board column management
│   ├── tickets/                # Ticket CRUD + move + assign
│   └── comments/               # Ticket comments
│
├── prisma/                     # Prisma client service + global module
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── generated/                  # Auto-generated Prisma client (gitignored)
│   └── prisma/
│
├── app.module.ts               # Root module
└── main.ts                     # Bootstrap + global middleware

prisma/
├── schema.prisma               # Database schema (source of truth)
├── migrations/                 # Migration history
└── seed.ts                     # Optional seed script

docs/                           # Architecture and technical documentation
```

---

## Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher
- npm v9 or higher

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable                 | Description                                      | Example                                            |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------- |
| `NODE_ENV`               | Runtime environment                              | `development`                                      |
| `PORT`                   | HTTP server port                                 | `8000`                                             |
| `DATABASE_URL`           | PostgreSQL connection string                     | `postgresql://user:pass@localhost:5432/ticketflow` |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens (min 32 chars)  | `your-secret-here`                                 |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime                            | `15m`                                              |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens (min 32 chars) | `your-other-secret`                                |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                           | `7d`                                               |
| `BCRYPT_ROUNDS`          | bcrypt cost factor                               | `12`                                               |
| `APP_ORIGIN`             | Frontend origin for CORS (production only)       | `https://yourapp.com`                              |

> **Never commit `.env` to version control.** Only `.env.example` (with no real values) should be committed.

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/dlorr/project-lume.git
cd project-lume/backend

# 2. Install dependencies
# This also runs `prisma generate` via the postinstall script
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the development server
npm run start:dev
```

The API will be available at `http://localhost:8006/api/v1`

---

## Running Migrations

```bash
# Create and apply a new migration (development)
npx prisma migrate dev --name your-migration-name

# Apply migrations in production (no schema drift check)
npx prisma migrate deploy

# Reset database and re-run all migrations (development only — destroys data)
npx prisma migrate reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual database browser)
npx prisma studio
```

---

## API Overview

All routes are prefixed with `/api/v1`.

### Auth

| Method | Route            | Description                 | Auth Required  |
| ------ | ---------------- | --------------------------- | -------------- |
| POST   | `/auth/register` | Register a new user         | No             |
| POST   | `/auth/login`    | Login with email + password | No             |
| POST   | `/auth/refresh`  | Refresh access token        | Refresh cookie |
| POST   | `/auth/logout`   | Logout and clear cookies    | Yes            |

### Projects

| Method | Route                           | Description          | Min Role      |
| ------ | ------------------------------- | -------------------- | ------------- |
| POST   | `/projects`                     | Create a new project | Authenticated |
| GET    | `/projects`                     | List my projects     | Authenticated |
| GET    | `/projects/:id`                 | Get project details  | MEMBER        |
| PATCH  | `/projects/:id`                 | Update project       | ADMIN         |
| PATCH  | `/projects/:id/archive`         | Archive project      | OWNER         |
| POST   | `/projects/:id/members`         | Invite a member      | ADMIN         |
| DELETE | `/projects/:id/members/:userId` | Remove a member      | ADMIN         |

### Board

| Method | Route                 | Description           | Min Role |
| ------ | --------------------- | --------------------- | -------- |
| GET    | `/projects/:id/board` | Get full Kanban board | MEMBER   |

### Statuses

| Method | Route                              | Description     | Min Role |
| ------ | ---------------------------------- | --------------- | -------- |
| POST   | `/projects/:id/statuses`           | Create a column | ADMIN    |
| PATCH  | `/projects/:id/statuses/:statusId` | Update a column | ADMIN    |
| DELETE | `/projects/:id/statuses/:statusId` | Delete a column | ADMIN    |

### Tickets

| Method | Route                                  | Description               | Min Role         |
| ------ | -------------------------------------- | ------------------------- | ---------------- |
| POST   | `/projects/:id/tickets`                | Create a ticket           | MEMBER           |
| GET    | `/projects/:id/tickets`                | List tickets (filterable) | MEMBER           |
| GET    | `/projects/:id/tickets/:ticketId`      | Get ticket details        | MEMBER           |
| PATCH  | `/projects/:id/tickets/:ticketId`      | Update ticket             | MEMBER           |
| PATCH  | `/projects/:id/tickets/:ticketId/move` | Move ticket (drag-drop)   | MEMBER           |
| DELETE | `/projects/:id/tickets/:ticketId`      | Delete ticket             | Reporter / ADMIN |

### Comments

| Method | Route                                                 | Description    | Min Role       |
| ------ | ----------------------------------------------------- | -------------- | -------------- |
| POST   | `/projects/:id/tickets/:ticketId/comments`            | Add comment    | MEMBER         |
| PATCH  | `/projects/:id/tickets/:ticketId/comments/:commentId` | Edit comment   | Author only    |
| DELETE | `/projects/:id/tickets/:ticketId/comments/:commentId` | Delete comment | Author / ADMIN |

---

## Authentication Flow

Tokens are stored in **httpOnly cookies** — JavaScript cannot read them, which eliminates XSS-based token theft.

```
POST /auth/login
  → validates credentials
  → generates access token (15m) + refresh token (7d)
  → stores hashed refresh token in database
  → sets both as httpOnly cookies
  → returns public user data in body

Protected requests
  → browser automatically sends access_token cookie
  → JwtAuthGuard validates it via JwtAccessStrategy
  → request.user is populated with safe user data

POST /auth/refresh (when access token expires)
  → browser sends refresh_token cookie (path-scoped)
  → JwtRefreshStrategy validates signature + DB hash comparison
  → new token pair issued, old refresh token rotated
  → new cookies set

POST /auth/logout
  → refresh token hash cleared from database
  → both cookies cleared from browser
```

---

## Role-Based Access

Roles are **project-scoped** — a user can be OWNER in one project and MEMBER in another.

| Role     | Permissions                                       |
| -------- | ------------------------------------------------- |
| `OWNER`  | Full control including archive, remove any member |
| `ADMIN`  | Manage members, statuses, update project settings |
| `MEMBER` | Create/update tickets, add comments               |

Role enforcement happens in the **service layer** via `project-access.helper.ts`, not at the guard level, because roles require the project context (projectId) to be meaningful.

---

## Scripts

```bash
npm run start:dev       # Start with hot reload
npm run start:prod      # Start production build
npm run build           # Compile TypeScript
npm run lint            # ESLint
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npx prisma generate     # Regenerate Prisma client
npx prisma migrate dev  # Run migrations (dev)
npx prisma studio       # Open DB browser
```
