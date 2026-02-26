# Database Schema

## Overview

TicketFlow uses PostgreSQL with Prisma ORM. All tables use `snake_case` column names (SQL convention) while Prisma exposes them as `camelCase` in TypeScript via `@map()` directives.

Primary keys use UUID (`@default(uuid())`) for broad tooling compatibility and native PostgreSQL support via `gen_random_uuid()`.

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────┐
│     User     │       │   ProjectMember    │       │   Project    │
│──────────────│       │───────────────────│       │──────────────│
│ id (PK)      │──┐    │ id (PK)           │    ┌──│ id (PK)      │
│ email        │  └───▶│ userId (FK)       │    │  │ name         │
│ username     │       │ projectId (FK)    │◀───┘  │ slug         │
│ firstName    │       │ role              │       │ key          │
│ lastName     │       │ joinedAt          │       │ description  │
│ hashPassword │       └───────────────────┘       │ isArchived   │
│ isActive     │                                    └──────┬───────┘
│ refreshToken │                                           │ (1)
└──────┬───────┘                                           │
       │                                                   ▼ (1)
       │                                           ┌──────────────┐
       │                                           │    Board     │
       │ (reporter)                                │──────────────│
       │         ┌─────────────────────────────────│ id (PK)      │
       │         │                                 │ name         │
       │         ▼                                 │ projectId(FK)│
       │  ┌──────────────┐                         └──────┬───────┘
       │  │    Ticket    │                                │
       │  │──────────────│                                ▼
       │  │ id (PK)      │       ┌──────────────────────────────┐
       │  │ title        │       │           Status             │
       │  │ description  │       │──────────────────────────────│
       │  │ type         │◀──────│ id (PK)                      │
       │  │ priority     │       │ name                         │
       │  │ order        │       │ color                        │
       │  │ number       │       │ order                        │
       │  │ dueDate      │       │ isDefault                    │
       │  │ statusId(FK) │       │ boardId (FK)                 │
       │  │ projectId(FK)│       └──────────────────────────────┘
       └─▶│ reporterId   │
          │ assigneeId(FK│──────▶ User (assignee)
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │   Comment    │
          │──────────────│
          │ id (PK)      │
          │ body         │
          │ isEdited     │
          │ ticketId(FK) │
          │ authorId(FK) │──────▶ User (author)
          └──────────────┘
```

---

## Tables

### `users`

Stores all registered user accounts.

| Column            | Type          | Constraints                     | Notes                                |
| ----------------- | ------------- | ------------------------------- | ------------------------------------ |
| `id`              | `UUID`        | PK, default `gen_random_uuid()` |                                      |
| `email`           | `VARCHAR`     | UNIQUE, NOT NULL                | Used for login                       |
| `username`        | `VARCHAR`     | UNIQUE, NOT NULL                | Public handle                        |
| `hashed_password` | `TEXT`        | NOT NULL                        | bcrypt hash                          |
| `first_name`      | `VARCHAR`     | NOT NULL                        |                                      |
| `last_name`       | `VARCHAR`     | NOT NULL                        |                                      |
| `is_active`       | `BOOLEAN`     | NOT NULL, default `true`        | Soft deactivation                    |
| `refresh_token`   | `TEXT`        | NULLABLE                        | bcrypt hash of current refresh token |
| `created_at`      | `TIMESTAMPTZ` | NOT NULL, default `now()`       |                                      |
| `updated_at`      | `TIMESTAMPTZ` | NOT NULL, auto-updated          |                                      |

**Design notes:**

- `refresh_token` stores a **hash**, never the raw token. Null means logged out.
- `is_active` enables soft account deactivation without deleting data. All related records (tickets, comments) remain intact.
- No `role` column — roles are project-scoped and live in `project_members`.

---

### `projects`

A project is the top-level container for a board, statuses, tickets, and team members.

| Column        | Type          | Constraints               | Notes                              |
| ------------- | ------------- | ------------------------- | ---------------------------------- |
| `id`          | `UUID`        | PK                        |                                    |
| `name`        | `VARCHAR`     | NOT NULL                  | Display name                       |
| `slug`        | `VARCHAR`     | UNIQUE, NOT NULL          | URL-friendly, e.g. `my-project`    |
| `key`         | `VARCHAR`     | UNIQUE, NOT NULL          | Short uppercase prefix, e.g. `MYP` |
| `description` | `TEXT`        | NULLABLE                  |                                    |
| `is_archived` | `BOOLEAN`     | NOT NULL, default `false` | Soft delete                        |
| `created_at`  | `TIMESTAMPTZ` | NOT NULL, default `now()` |                                    |
| `updated_at`  | `TIMESTAMPTZ` | NOT NULL, auto-updated    |                                    |

**Design notes:**

- `slug` is used in URLs: `/projects/my-project`
- `key` is used for human-readable ticket references: `MYP-1`, `MYP-42`
- `is_archived` is a soft delete — archived projects are hidden but data is preserved. Hard deletes cascade via Prisma relations.
- `key` cannot be changed after creation — it would invalidate all existing ticket references.

---

### `project_members`

Junction table that links users to projects with an assigned role. Implements the many-to-many relationship between users and projects with additional role data.

| Column       | Type          | Constraints                | Notes                   |
| ------------ | ------------- | -------------------------- | ----------------------- |
| `id`         | `UUID`        | PK                         |                         |
| `user_id`    | `UUID`        | FK → users, CASCADE        |                         |
| `project_id` | `UUID`        | FK → projects, CASCADE     |                         |
| `role`       | `ENUM(Role)`  | NOT NULL, default `MEMBER` | OWNER, ADMIN, or MEMBER |
| `joined_at`  | `TIMESTAMPTZ` | NOT NULL, default `now()`  |                         |

**Unique constraints:**

- `(user_id, project_id)` — a user can only be a member of a project once

**Design notes:**

- Cascade delete on both FKs means removing a user or project automatically removes memberships
- There is exactly one OWNER per project — enforced at the application level (service layer), not DB level
- Role hierarchy: OWNER (3) > ADMIN (2) > MEMBER (1)

---

### `boards`

A board is the Kanban board for a project. One board per project in the MVP.

| Column       | Type          | Constraints                    | Notes                   |
| ------------ | ------------- | ------------------------------ | ----------------------- |
| `id`         | `UUID`        | PK                             |                         |
| `name`       | `VARCHAR`     | NOT NULL                       | e.g. `My Project Board` |
| `project_id` | `UUID`        | FK → projects, UNIQUE, CASCADE |                         |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`      |                         |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated         |                         |

**Design notes:**

- `UNIQUE` on `project_id` enforces the one-board-per-project rule at the database level
- Auto-created via Prisma transaction when a project is created
- Future: remove the `UNIQUE` constraint to support multiple boards per project (Scrum sprints)

---

### `statuses`

Represents a column on the Kanban board (e.g. "To Do", "In Progress", "Done").

| Column       | Type      | Constraints                 | Notes                                 |
| ------------ | --------- | --------------------------- | ------------------------------------- |
| `id`         | `UUID`    | PK                          |                                       |
| `name`       | `VARCHAR` | NOT NULL                    | Column label                          |
| `color`      | `VARCHAR` | NOT NULL, default `#6B7280` | Hex color code                        |
| `order`      | `INTEGER` | NOT NULL                    | Left-to-right position (0 = leftmost) |
| `is_default` | `BOOLEAN` | NOT NULL, default `false`   | New tickets go here                   |
| `board_id`   | `UUID`    | FK → boards, CASCADE        |                                       |

**Unique constraints:**

- `(board_id, order)` — no two columns on the same board can have the same position
- `(board_id, name)` — no two columns on the same board can have the same name

**Design notes:**

- `order` is used for client-side column positioning (drag-to-reorder columns future feature)
- `is_default` marks the column where new tickets are placed if no `statusId` is specified
- Only one status per board should have `is_default = true` — enforced at the service level
- Deleting a status with tickets is blocked at the service level to prevent data loss

---

### `tickets`

The core work item — represents a card on the Kanban board.

| Column        | Type                   | Constraints                | Notes                                   |
| ------------- | ---------------------- | -------------------------- | --------------------------------------- |
| `id`          | `UUID`                 | PK                         |                                         |
| `title`       | `VARCHAR`              | NOT NULL                   | Short summary                           |
| `description` | `TEXT`                 | NULLABLE                   | Detailed description                    |
| `type`        | `ENUM(TicketType)`     | NOT NULL, default `TASK`   | TASK, BUG, STORY, EPIC                  |
| `priority`    | `ENUM(TicketPriority)` | NOT NULL, default `MEDIUM` | LOW, MEDIUM, HIGH, URGENT               |
| `order`       | `INTEGER`              | NOT NULL                   | Position within the column (0 = top)    |
| `number`      | `INTEGER`              | NOT NULL                   | Scoped sequential ID within the project |
| `due_date`    | `TIMESTAMPTZ`          | NULLABLE                   |                                         |
| `project_id`  | `UUID`                 | FK → projects, CASCADE     |                                         |
| `status_id`   | `UUID`                 | FK → statuses              | Current column                          |
| `assignee_id` | `UUID`                 | FK → users, NULLABLE       | Who is working on it                    |
| `reporter_id` | `UUID`                 | FK → users, NOT NULL       | Who created it                          |
| `created_at`  | `TIMESTAMPTZ`          | NOT NULL, default `now()`  |                                         |
| `updated_at`  | `TIMESTAMPTZ`          | NOT NULL, auto-updated     |                                         |

**Unique constraints:**

- `(project_id, number)` — ticket numbers are unique within a project (MYP-1 can only exist once in the MYP project)

**Design notes:**

- `number` is auto-incremented per project inside a Prisma transaction to prevent race conditions
- Combined with the project `key`, `number` gives human-readable IDs: `MYP-42`
- `order` is used for drag-and-drop positioning within a column. When a ticket is moved, affected tickets' order values are shifted atomically in a transaction.
- Two separate FK relations to `users` (assignee + reporter) — named relations required in Prisma schema

---

### `comments`

Comments are attached to tickets for team discussion.

| Column       | Type          | Constraints               | Notes                     |
| ------------ | ------------- | ------------------------- | ------------------------- |
| `id`         | `UUID`        | PK                        |                           |
| `body`       | `TEXT`        | NOT NULL                  | Comment content           |
| `is_edited`  | `BOOLEAN`     | NOT NULL, default `false` | Shown as "(edited)" in UI |
| `ticket_id`  | `UUID`        | FK → tickets, CASCADE     |                           |
| `author_id`  | `UUID`        | FK → users                |                           |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` |                           |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated    |                           |

**Design notes:**

- Cascade delete on `ticket_id` — deleting a ticket removes all its comments
- `is_edited` is set to `true` on any update — displayed in the UI for transparency
- Edit is restricted to the comment author (enforced at service level)
- Delete is allowed by the author OR an ADMIN/OWNER (for moderation)

---

## Enums

### `Role`

```
OWNER   → Created the project, full control
ADMIN   → Can manage members and settings
MEMBER  → Can create/update tickets and comments
```

### `TicketPriority`

```
LOW → MEDIUM → HIGH → URGENT
```

### `TicketType`

```
TASK   → General work item
BUG    → Something broken
STORY  → User-facing feature
EPIC   → Large body of work (future use)
```

---

## Cascade Behavior

| Parent deleted  | Child behavior                        |
| --------------- | ------------------------------------- |
| User deleted    | ProjectMember rows deleted            |
| Project deleted | Members, Board, Tickets all deleted   |
| Board deleted   | All Statuses deleted                  |
| Ticket deleted  | All Comments deleted                  |
| Status deleted  | Blocked — tickets must be moved first |

---

## Indexes (Auto-created by Prisma)

Prisma automatically creates indexes for:

- All `@id` fields (primary keys)
- All `@unique` fields and `@@unique` composites
- All foreign key fields

No additional manual indexes are defined in the MVP schema. For production at scale, consider adding:

- Index on `tickets.project_id` + `tickets.status_id` (board query)
- Index on `tickets.assignee_id` (assignment filter)
- Index on `project_members.user_id` (user's project list)
