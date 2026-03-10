# Frontend Architecture

## Overview

The frontend is a Vue 3 single-page application using the Composition API exclusively. It communicates with the NestJS backend over a REST API using httpOnly cookies for authentication.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                     Pages / Views                    │
│   ProjectsPage  BoardPage  MembersPage  SettingsPage │
└────────────────────────┬────────────────────────────┘
                         │ calls
┌────────────────────────▼────────────────────────────┐
│                    Composables                       │
│  useProjects  useBoard  useTickets  useComments      │
│  useMembers   useAuth   useToast    useTicketDetail  │
└──────────┬─────────────────────────┬────────────────┘
           │ server state            │ client state
┌──────────▼──────────┐   ┌──────────▼──────────────┐
│  TanStack Vue Query │   │         Pinia            │
│  (cache, refetch,   │   │  auth.store (user)       │
│   invalidation)     │   │  ui.store (theme,        │
└──────────┬──────────┘   │    sidebar, modal)       │
           │              └─────────────────────────-┘
┌──────────▼──────────────────────────────────────────┐
│                    API Modules                       │
│  auth.api  projects.api  tickets.api  comments.api  │
└──────────┬──────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────┐
│               Axios Instance (axios.ts)              │
│  - baseURL from VITE_API_URL                   │
│  - withCredentials: true                             │
│  - 401 interceptor → refresh → retry                │
│  - 500+ interceptor → toast error                   │
└─────────────────────────────────────────────────────┘
```

---

## Key Architecture Decisions

### 1. Composition API Only

Every component uses `<script setup lang="ts">`. No Options API. This gives better TypeScript inference, smaller bundle size, and more composable logic.

### 2. Feature-Based Folder Structure

Code is organized by feature (`features/auth`, `features/board`, `features/projects`) rather than by type (`components`, `services`, `stores`). Each feature owns its components, composables, pages, and schemas. Shared UI lives in `components/ui` and `components/feedback`.

### 3. Server State vs Client State

A strict separation is maintained:

| What             | Where                            |
| ---------------- | -------------------------------- |
| Who is logged in | Pinia `auth.store`               |
| Is sidebar open  | Pinia `ui.store`                 |
| Projects list    | TanStack Vue Query               |
| Board + tickets  | TanStack Vue Query               |
| Members list     | TanStack Vue Query               |
| Toast messages   | Module-level `ref` in `useToast` |

Pinia never holds server data. Vue Query never holds UI state.

### 4. Composable-First API Integration

Pages never import API modules directly. Every API call goes through a composable:

```
❌ Page → projectsApi.getAll()
✅ Page → useProjects() → projectsApi.getAll()
```

This means if the API or caching strategy changes, only the composable changes — not every page that uses it.

### 5. Type Safety End-to-End

Every API response has a corresponding TypeScript interface in `src/types/`. API modules are typed at the call site:

```typescript
apiClient.get<ProjectWithMeta[]>("/projects");
```

The `Ticket` and `TicketDetail` types are intentionally separate — `Ticket` is the lightweight version returned by the board endpoint, `TicketDetail` extends it with `comments[]` and is only returned by the single ticket endpoint.

---

## Routing

Routes are split into two layout groups:

```
/auth/*          → AuthLayout (no guard)
  /auth/login
  /auth/register

/*               → AppLayout (requiresAuth guard)
  /projects
  /projects/:projectId/board
  /projects/:projectId/settings
  /projects/:projectId/members

/:pathMatch(.*)* → NotFoundPage (404)
```

The `requiresAuth` guard in `src/router/guards.ts` checks `authStore.user`. If null, redirects to `/auth/login?redirect=<original-path>`. After login, the user is sent to the original path.

Child routes inside the `AppLayout` parent inherit `meta: { requiresAuth: true }` automatically — they do not need to repeat it.

---

## Token Refresh Flow

```
Request → 401 response
  └─ Is it a /auth/refresh or /auth/login request?
       ├─ Yes → skip refresh (avoid infinite loop)
       └─ No → set _retry flag → POST /auth/refresh
                  ├─ Success → retry original request with new cookie
                  └─ Failure → localStorage.removeItem('auth_user')
                               window.location.href = '/auth/login'
                               (full page reload clears all Vue/Pinia/Query state)
```

The `_retry` flag on the original request config prevents the interceptor from attempting a refresh more than once per request.

---

## Component Communication Patterns

### Parent → Child

Props only. No prop drilling beyond 2 levels — if data needs to go deeper, it goes through a composable.

### Child → Parent

`defineEmits` with typed event signatures.

### Cross-Component / Global

- Server data → Vue Query cache (invalidate to sync)
- UI state → Pinia store
- Toast notifications → `useToast` module-level singleton

### Modal Pattern

Modals use `<Teleport to="body">` to escape any `overflow: hidden` stacking context. They are conditionally rendered with `v-if` (not `v-show`) so they fully mount/unmount and reset state on open/close.

---

## Error Handling Strategy

| Error Type                                 | Handling                                         |
| ------------------------------------------ | ------------------------------------------------ |
| Form validation                            | Inline under the field via vee-validate          |
| Auth form errors (wrong password etc.)     | Inline `serverError` ref under the submit button |
| Mutation failures (create, update, delete) | Toast notification via `onError` in useMutation  |
| 500+ server errors                         | Global Axios interceptor → toast                 |
| 401 unauthorized                           | Axios interceptor → refresh or redirect          |
| Route not found                            | Vue Router catch-all → `NotFoundPage`            |

---

## Build and Deployment

```bash
npm run build
```

Output goes to `frontend/dist/`. This is a static SPA — serve it from any static host (Nginx, Vercel, Netlify, etc.).

The backend must be configured with the correct `FRONTEND_URL` for CORS, and cookies must be served over HTTPS in production (`Secure` flag on cookies).
