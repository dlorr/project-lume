# Backend Architecture

## Overview

TicketFlow follows a **modular, feature-based architecture** built on NestJS. Each feature owns its controller, service, module, and DTOs. Shared concerns (guards, decorators, filters, helpers) live in `common/`.

The architecture is designed around three principles:

- **Separation of concerns** — transport layer (controllers) never contains business logic
- **Single responsibility** — each service handles one domain
- **Fail fast** — invalid requests are rejected at the DTO layer before reaching services

---

## Layer Diagram

```
HTTP Request
     │
     ▼
┌─────────────────────────────────┐
│         Global Middleware        │
│  cookie-parser, CORS, Pino HTTP  │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│         Guards (NestJS)          │
│  JwtAuthGuard → JwtAccessStrategy│
│  JwtRefreshGuard (refresh only)  │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│      Global ValidationPipe       │
│  whitelist, forbidNonWhitelisted │
│  transform, implicitConversion   │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│           Controller             │
│  Routes, param extraction only   │
│  No business logic               │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│            Service               │
│  Business logic, RBAC checks     │
│  Prisma transactions             │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│         PrismaService            │
│  Single DB client instance       │
│  Injected globally               │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│          PostgreSQL              │
└─────────────────────────────────┘
```

---

## Module Breakdown

### `AppModule` (root)

The entry point of the dependency injection tree. Registers all global providers:

- `ConfigModule` (global) — environment variable access anywhere
- `LoggerModule` (Pino) — structured logging
- `PrismaModule` (global) — database client singleton

All feature modules are imported here.

---

### `PrismaModule`

Marked `@Global()` — registered once, available everywhere without re-importing.

`PrismaService` extends `PrismaClient` directly and implements `OnModuleInit` and `OnModuleDestroy` to manage the connection lifecycle explicitly. This ensures the database connection is established on startup (fail fast) and closed gracefully on shutdown (no dangling connections).

---

### `AuthModule`

Handles all authentication concerns. Does not handle user data persistence directly — delegates to `UsersService`.

Contains:

- `AuthService` — registration, login, token generation, logout
- `JwtAccessStrategy` — validates access tokens from httpOnly cookie or Bearer header
- `JwtRefreshStrategy` — validates refresh tokens + DB hash comparison
- DTOs with full class-validator rules

Exports `AuthService` for potential use by other modules.

---

### `UsersModule`

Lightweight service responsible only for user queries. Intentionally thin — it provides lookups that `AuthService` and JWT strategies need.

Exported so `AuthModule` can import it without circular dependencies.

---

### `ProjectsModule`

Handles project lifecycle and membership management. Most complex module in terms of business rules.

Key design decisions:

- Project creation uses a Prisma `$transaction` to atomically create the project, add the creator as OWNER, create the default board, and seed default statuses
- Slug generation is handled in the service with a uniqueness loop
- Role checks use `getProjectMember` + `assertRole` helpers from `common/`

---

### `BoardsModule`

Intentionally minimal — the board is auto-created with the project and has no independent lifecycle. The controller exposes a single `GET` endpoint that returns the full board with all columns and their tickets in order.

---

### `StatusesModule`

Manages Kanban columns. Key rules enforced at the service level:

- Cannot delete a column that still contains tickets
- Column names must be unique per board
- Only one column can be marked `isDefault` per board — setting a new default unsets the previous one

---

### `TicketsModule`

Core domain module. Uses Prisma transactions in two places:

1. Ticket creation — to atomically generate the scoped ticket number and create the ticket
2. Ticket moving — to shift other tickets' order values and place the moved ticket atomically

Filtering is handled via optional query parameters mapped directly to Prisma `where` clauses.

---

### `CommentsModule`

Simple CRUD with ownership-based authorization. Edit is restricted to the comment author. Delete allows the author OR an ADMIN/OWNER (for moderation).

---

## Common Layer

### `GlobalExceptionFilter`

Registered globally in `main.ts`. Catches all exceptions — `HttpException`, Prisma errors, runtime errors — and normalizes them into a consistent `ErrorResponse` shape. Prevents raw stack traces from leaking to the client.

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}
```

### `project-access.helper.ts`

The backbone of project-scoped RBAC. Two exported functions:

`getProjectMember(prisma, projectId, userId)` — queries `ProjectMember` and throws `404` if project doesn't exist or `403` if user is not a member. Returns the membership record including the user's role.

`assertRole(userRole, requiredRole, message?)` — enforces the role hierarchy (OWNER > ADMIN > MEMBER). Throws `403` if the user's role is below the required level.

### `@CurrentUser()` decorator

Extracts `request.user` (set by `JwtAccessStrategy`) into a controller parameter cleanly. Avoids boilerplate `@Req() req` usage across every controller method.

---

## Validation Strategy

All incoming request bodies are validated by NestJS's global `ValidationPipe` before reaching controllers.

Configuration:

```
whitelist: true              → strip unknown properties silently
forbidNonWhitelisted: true   → throw 400 if unknown properties are sent
transform: true              → convert plain JSON to typed DTO instances
enableImplicitConversion     → coerce query param strings to numbers/booleans
```

DTOs use `class-validator` decorators. Validation errors return a `400 Bad Request` with an array of descriptive messages — no custom error handling needed at the service level for input validation.

---

## Error Handling Strategy

| Layer             | Mechanism                            | Example                     |
| ----------------- | ------------------------------------ | --------------------------- |
| DTO validation    | `ValidationPipe` + `class-validator` | Invalid email format → 400  |
| Business rules    | NestJS `HttpException` subclasses    | Duplicate project key → 409 |
| RBAC              | `ForbiddenException` in helpers      | Non-member access → 403     |
| Not found         | `NotFoundException` in services      | Missing ticket → 404        |
| Unexpected errors | `GlobalExceptionFilter` catch-all    | DB connection failure → 500 |

All errors go through `GlobalExceptionFilter` which normalizes them into the consistent `ErrorResponse` shape regardless of where they originate.

---

## Logging Strategy

Pino is used over Winston for three reasons:

- 5–8x faster due to async logging
- Structured JSON output natively (ideal for log aggregators)
- First-class NestJS integration via `nestjs-pino`

In development: `pino-pretty` formats logs in a human-readable colorized format.
In production: raw JSON output consumed by Datadog, CloudWatch, or Grafana Loki.

`autoLogging: true` means every HTTP request and response is logged automatically without any code in controllers.

---

## Configuration Strategy

`@nestjs/config` with `registerAs` namespaces configuration into typed slices:

```typescript
configService.get('jwt.accessSecret'); // JWT namespace
configService.get('app.port'); // App namespace
configService.get('database.url'); // Database namespace
```

This avoids a flat `process.env` object and makes it easy to inject only the config slice a module needs.
