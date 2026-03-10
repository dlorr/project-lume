# Project Lume — Frontend

Vue 3 frontend for Project Lume, a full-stack Kanban project management application. Built with TypeScript, TailwindCSS v4, Pinia, and TanStack Vue Query.

---

## Tech Stack

| Layer            | Technology                                               |
| ---------------- | -------------------------------------------------------- |
| Framework        | Vue 3 (Composition API + `<script setup>`)               |
| Language         | TypeScript                                               |
| Build Tool       | Vite                                                     |
| Styling          | TailwindCSS v4                                           |
| State Management | Pinia (client state) + TanStack Vue Query (server state) |
| Routing          | Vue Router 4                                             |
| HTTP Client      | Axios                                                    |
| Form Validation  | vee-validate + yup                                       |
| Icons            | lucide-vue-next                                          |
| Drag and Drop    | @formkit/drag-and-drop _(planned — Phase 5.2)_           |

---

## Prerequisites

- Node.js 18+
- npm 9+
- Backend running on `http://localhost:8006` (see `backend/README.md`)

---

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:3006`.

---

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8006/api/v1
VITE_APP_NAME=Project Lume
VITE_PORT=3006
```

| Variable        | Description                                   |
| --------------- | --------------------------------------------- |
| `VITE_API_URL`  | Full backend API base URL — no trailing slash |
| `VITE_APP_NAME` | App name displayed in the UI                  |
| `VITE_PORT`     | Port the Vite dev server runs on              |

> All `VITE_` prefixed variables are exposed to the browser. Never put secrets here.

---

## Available Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Type-check and build for production
npm run preview    # Preview the production build locally
npm run type-check # Run TypeScript type checking only
```

---

## Folder Structure

```
frontend/
├── public/
│   └── logo.svg                  # App favicon and logo mark
├── src/
│   ├── api/
│   │   ├── axios.ts              # Axios instance, interceptors, token refresh
│   │   ├── query-keys.ts         # Centralized TanStack Query key registry
│   │   └── modules/
│   │       ├── auth.api.ts       # Login, register, logout, refresh
│   │       ├── projects.api.ts   # Projects CRUD, member management
│   │       ├── boards.api.ts     # Board fetch
│   │       ├── tickets.api.ts    # Tickets CRUD, move
│   │       ├── statuses.api.ts   # Status management
│   │       └── comments.api.ts   # Comments CRUD
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AppButton.vue     # Button — variants: primary, ghost, danger, outline
│   │   │   ├── AppInput.vue      # Text input with label + error
│   │   │   ├── AppModal.vue      # Modal wrapper with Teleport + Escape + backdrop
│   │   │   ├── AppToast.vue      # Single toast notification
│   │   │   ├── AppToastContainer.vue  # Toast stack — teleported to body
│   │   │   ├── AppConfirmModal.vue    # Reusable destructive action confirmation
│   │   │   ├── AppSpinner.vue    # Loading spinner — sizes: sm, md, lg
│   │   │   └── AppBadge.vue      # Status/role badge
│   │   └── feedback/
│   │       ├── EmptyState.vue        # Empty list placeholder with icon + action slot
│   │       ├── ErrorState.vue        # Error placeholder
│   │       ├── SkeletonCard.vue      # Ticket card skeleton loader
│   │       ├── SkeletonBoard.vue     # Full board skeleton loader
│   │       └── SkeletonProjectCard.vue  # Project card skeleton loader
│   ├── composables/
│   │   └── useToast.ts           # Toast state and helpers (module-level singleton)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/       # LoginForm, RegisterForm
│   │   │   ├── composables/
│   │   │   │   └── useAuth.ts    # login, register, logout actions
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.vue
│   │   │   │   └── RegisterPage.vue
│   │   │   └── schemas/
│   │   │       └── auth.schemas.ts  # yup validation schemas for auth forms
│   │   ├── projects/
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.vue
│   │   │   │   └── CreateProjectModal.vue
│   │   │   ├── composables/
│   │   │   │   └── useProjects.ts   # getAll, create, update, archive
│   │   │   ├── pages/
│   │   │   │   ├── ProjectsPage.vue
│   │   │   │   └── ProjectSettingsPage.vue
│   │   │   └── schemas/
│   │   │       └── project.schemas.ts
│   │   ├── board/
│   │   │   ├── components/
│   │   │   │   ├── KanbanBoard.vue       # Board container, manages modals
│   │   │   │   ├── KanbanColumn.vue      # Single status column
│   │   │   │   ├── TicketCard.vue        # Draggable ticket card
│   │   │   │   ├── CreateTicketModal.vue
│   │   │   │   └── TicketDetailModal.vue # Full ticket detail + inline editing + comments
│   │   │   ├── composables/
│   │   │   │   ├── useBoard.ts           # Board query
│   │   │   │   ├── useTickets.ts         # Ticket mutations with toast + cache invalidation
│   │   │   │   ├── useTicketDetail.ts    # Single ticket query (staleTime: 0)
│   │   │   │   └── useComments.ts        # Comment mutations
│   │   │   ├── pages/
│   │   │   │   └── BoardPage.vue
│   │   │   └── schemas/
│   │   │       └── ticket.schemas.ts
│   │   └── members/
│   │       ├── composables/
│   │       │   └── useMembers.ts    # Project detail + invite + remove
│   │       └── pages/
│   │           └── MembersPage.vue
│   ├── layouts/
│   │   ├── AppLayout.vue         # Sidebar + topbar — authenticated pages
│   │   └── AuthLayout.vue        # Centered card — login/register
│   ├── pages/
│   │   └── NotFoundPage.vue      # 404 catch-all
│   ├── router/
│   │   ├── index.ts              # Route definitions
│   │   └── guards.ts             # requiresAuth navigation guard
│   ├── stores/
│   │   ├── auth.store.ts         # Current user — persisted to localStorage
│   │   └── ui.store.ts           # Sidebar, theme, modal state
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── project.types.ts
│   │   ├── board.types.ts
│   │   ├── ticket.types.ts
│   │   ├── status.types.ts
│   │   ├── comment.types.ts
│   │   └── common.types.ts       # ApiError
│   ├── utils/
│   │   └── ticket.utils.ts       # priorityConfig, typeConfig, getInitials, formatDate
│   ├── App.vue                   # Root — mounts toast container, inits theme
│   ├── main.ts                   # App bootstrap — Pinia, Router, VueQuery
│   └── style.css                 # Global CSS, design tokens, Tailwind layers
├── .env.example
├── index.html
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Design System

The app uses CSS custom properties for theming, defined in `style.css`. Light mode is the default (`:root`), dark mode activates via the `.dark` class on `<html>`.

### Color Tokens

| Token          | Light     | Dark      |
| -------------- | --------- | --------- |
| `--background` | `#F4F6F9` | `#0F1623` |
| `--foreground` | `#1A2332` | `#E8EDF5` |
| `--primary`    | `#3B5BDB` | `#4C6EF5` |
| `--card`       | `#FFFFFF` | `#151E2E` |
| `--border`     | `#DDE2EC` | `#253045` |
| `--muted`      | `#EAEEf4` | `#182030` |

### Typography

- Display (headings): **Plus Jakarta Sans** — 600/700/800
- Body: **Inter** — 400/500/600

---

## Authentication Flow

Authentication uses **httpOnly cookies** — the browser handles cookie storage automatically. The frontend never stores or reads the access token directly.

```
Login → POST /auth/login → server sets access_token + refresh_token cookies
Every request → browser sends cookies automatically (withCredentials: true)
401 response → Axios interceptor → POST /auth/refresh → retry original request
Refresh fails → clear localStorage + redirect to /auth/login
Logout → POST /auth/logout → server clears cookies → queryClient.clear()
```

See `src/api/axios.ts` for the full interceptor implementation.
See `docs/frontend-architecture.md` for deeper architecture detail.
