# State Management

Project Lume uses two complementary state management tools. They solve different problems and are never used interchangeably.

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    State Categories                      │
├──────────────────────────┬──────────────────────────────┤
│      Client State        │       Server State           │
│         Pinia            │    TanStack Vue Query        │
├──────────────────────────┼──────────────────────────────┤
│  Who is logged in        │  Projects list               │
│  Is sidebar open         │  Board + tickets             │
│  Current theme (dark)    │  Members list                │
│  Active modal            │  Ticket detail + comments    │
└──────────────────────────┴──────────────────────────────┘
```

---

## Pinia — Client State

Pinia stores hold UI and session state that does not come from the server and does not need caching or background refetching.

### `auth.store.ts`

Holds the currently authenticated user object. Persisted to `localStorage` so the user survives a page refresh without needing to re-authenticate.

```typescript
// What it stores
user: User | null

// Key methods
setUser(user: User)   // called after login / register
clearUser()           // called on logout
```

The store is seeded from `localStorage` on app boot. It is the source of truth for "is the user logged in" — the router guard reads from it.

**Why not Vue Query?**
The current user is not fetched from the server on every navigation. It is set once on login and cleared on logout. It needs to survive page refresh (localStorage). These are client state characteristics, not server state.

### `ui.store.ts`

Holds global UI flags that need to be shared across components.

```typescript
sidebarOpen: boolean; // sidebar expanded or collapsed
isDark: boolean; // dark mode active
activeModal: string | null; // which modal is open (if any)
```

`initTheme()` is called once in `App.vue` on mount. It reads from `localStorage` first, then falls back to the OS `prefers-color-scheme` media query.

---

## TanStack Vue Query — Server State

Vue Query manages all data that originates from the backend. It provides automatic caching, background refetching, loading/error states, and cache invalidation.

### Query Key Registry

All query keys are defined in `src/api/query-keys.ts`. This prevents the same data from being cached under different keys in different parts of the app.

```typescript
queryKeys.projects.all(); // ['projects']
queryKeys.projects.detail(id); // ['projects', id]
queryKeys.projects.members(id); // ['projects', id, 'members']
queryKeys.board.detail(projectId); // ['board', projectId]
queryKeys.tickets.detail(projectId, ticketId); // ['tickets', projectId, ticketId]
```

### Global Query Defaults

Set in `main.ts`:

```typescript
staleTime: 1000 * 60; // data is fresh for 1 minute
retry: 1; // retry failed requests once
refetchOnWindowFocus: false; // don't refetch when tab regains focus
```

The board query overrides `staleTime` to 30 seconds since board data changes more frequently. The ticket detail query sets `staleTime: 0` so it always refetches when a modal opens.

### Cache Invalidation Strategy

After every mutation, the relevant queries are invalidated to trigger a background refetch:

| Mutation                    | Invalidates                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| Create project              | `projects.all()`                                                  |
| Update / archive project    | `projects.all()`                                                  |
| Create ticket               | `board.detail(projectId)`                                         |
| Update ticket               | `board.detail(projectId)` + `tickets.detail(projectId, ticketId)` |
| Move ticket                 | `board.detail(projectId)` + `tickets.detail(projectId, ticketId)` |
| Delete ticket               | `board.detail(projectId)`                                         |
| Add / edit / delete comment | `board.detail(projectId)` + `tickets.detail(projectId, ticketId)` |
| Invite / remove member      | `projects.detail(projectId)` + `projects.members(projectId)`      |

### Cache Clearing on Logout

When the user logs out, `queryClient.clear()` is called before redirecting. This prevents the next user who logs in on the same browser session from seeing the previous user's cached data.

```typescript
async function logout() {
  await authApi.logout();
  authStore.clearUser();
  queryClient.clear(); // ← wipes entire Vue Query cache
  router.push({ name: "login" });
}
```

---

## useToast — Notification State

Toasts are not Pinia or Vue Query — they use a module-level `ref` inside `useToast.ts`. Because the composable is imported as a module singleton, all callers share the same `toasts` array.

```typescript
// Module-level — shared across all imports
const toasts = ref<Toast[]>([]);

export function useToast() {
  // All callers access the same toasts ref
  return { toasts, add, remove, success, error, info, warning };
}
```

`AppToastContainer` is mounted once in `App.vue` and reads from this shared ref. Any composable in the app can call `useToast().success(...)` and the container will display it.

---

## What Never Goes in Pinia

- Projects list — use `useProjects()`
- Tickets / board data — use `useBoard()`, `useTickets()`
- Members — use `useMembers()`
- Comments — use `useComments()`
- Any data that has a loading or error state

If you find yourself writing `isLoading` or `isError` in a Pinia store, that data belongs in Vue Query instead.

---

## What Never Goes in Vue Query

- Is the sidebar open
- Is dark mode active
- The logged-in user object
- Which modal is currently open
- Toast messages

If you find yourself writing `staleTime` or `invalidateQueries` for this data, it belongs in Pinia instead.
