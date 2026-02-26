# API Overview

## Base URL

```
Development:  http://localhost:8006/api/v1
Production:   https://your-domain.com/api/v1
```

All routes are versioned via URI (`/v1/`). Future breaking changes will be released under `/v2/` without removing `/v1/`.

---

## Authentication

All protected routes require an `access_token` httpOnly cookie set during login or registration.

In Postman or API clients, you can alternatively use the Authorization header:

```
Authorization: Bearer <access_token>
```

The refresh token endpoint requires the `refresh_token` httpOnly cookie (path-scoped to `/api/v1/auth/refresh`).

---

## Response Format

### Success Response

The response body varies by endpoint — see individual routes below.

### Error Response

All errors return a consistent shape regardless of where the error originates:

```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request",
  "path": "/api/v1/projects",
  "timestamp": "2026-02-25T10:00:00.000Z"
}
```

Validation errors return `message` as an array:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-02-25T10:00:00.000Z"
}
```

---

## HTTP Status Codes Used

| Code                        | Meaning                          | When                                       |
| --------------------------- | -------------------------------- | ------------------------------------------ |
| `200 OK`                    | Success                          | GET, PATCH, DELETE, login, logout          |
| `201 Created`               | Resource created                 | POST register, POST project, POST ticket   |
| `400 Bad Request`           | Validation failed or bad input   | Invalid DTO, delete status with tickets    |
| `401 Unauthorized`          | Not authenticated                | Missing/expired/invalid token              |
| `403 Forbidden`             | Authenticated but not authorized | Insufficient role, not a member            |
| `404 Not Found`             | Resource doesn't exist           | Invalid ID, project not found              |
| `409 Conflict`              | Duplicate resource               | Duplicate email, duplicate project key     |
| `500 Internal Server Error` | Unexpected server error          | DB connection failure, unhandled exception |

---

## Auth Endpoints

### POST `/auth/register`

Create a new user account.

**Auth required:** No

**Request body:**

```json
{
  "email": "john@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass1!"
}
```

**Validation rules:**

- `email` — valid email format
- `username` — 3–20 chars, letters/numbers/underscores/hyphens only
- `firstName` / `lastName` — 2–50 chars
- `password` — min 8 chars, max 72 chars, must contain uppercase, lowercase, number, special char

**Response `201`:**

```json
{
  "id": "uuid",
  "email": "john@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2026-02-25T10:00:00.000Z",
  "updatedAt": "2026-02-25T10:00:00.000Z"
}
```

Sets `access_token` and `refresh_token` httpOnly cookies.

---

### POST `/auth/login`

Authenticate with email and password.

**Auth required:** No

**Request body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```

**Response `200`:** Same shape as register. Sets auth cookies.

---

### POST `/auth/refresh`

Exchange a valid refresh token for a new token pair.

**Auth required:** `refresh_token` cookie

**Response `200`:**

```json
{
  "message": "Token refreshed successfully"
}
```

Sets new `access_token` and `refresh_token` cookies. Old refresh token is invalidated.

---

### POST `/auth/logout`

Invalidate the current session.

**Auth required:** Yes (access token)

**Response `200`:**

```json
{
  "message": "Logged out successfully"
}
```

Clears both cookies and removes the refresh token hash from the database.

---

## Project Endpoints

### POST `/projects`

Create a new project. The authenticated user becomes the OWNER. A default board with 4 columns (To Do, In Progress, In Review, Done) is created automatically.

**Auth required:** Yes

**Request body:**

```json
{
  "name": "My Project",
  "key": "MYP",
  "description": "Optional project description"
}
```

**Validation rules:**

- `name` — 2–100 chars
- `key` — 2–6 uppercase letters only (e.g. `MYP`, `PROJ`)
- `description` — optional, max 500 chars

**Response `201`:** Project object.

---

### GET `/projects`

List all projects the authenticated user is a member of.

**Auth required:** Yes

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "name": "My Project",
    "slug": "my-project",
    "key": "MYP",
    "myRole": "OWNER",
    "joinedAt": "2026-02-25T10:00:00.000Z",
    "_count": { "members": 3, "tickets": 12 }
  }
]
```

---

### GET `/projects/:projectId`

Get full project details including members and board.

**Auth required:** Yes — must be a project member

**Response `200`:** Project with `members[]` and `board` (with `statuses[]`).

---

### PATCH `/projects/:projectId`

Update project name or description.

**Auth required:** Yes — ADMIN or OWNER role

**Request body (all optional):**

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

---

### PATCH `/projects/:projectId/archive`

Soft-delete the project. Hides it from listings but preserves all data.

**Auth required:** Yes — OWNER role only

**Response `200`:** Updated project with `isArchived: true`.

---

### POST `/projects/:projectId/members`

Invite a user to the project by email.

**Auth required:** Yes — ADMIN or OWNER role

**Request body:**

```json
{
  "email": "teammate@example.com",
  "role": "MEMBER"
}
```

`role` must be `ADMIN` or `MEMBER` — `OWNER` cannot be assigned via invite.

---

### DELETE `/projects/:projectId/members/:userId`

Remove a member from the project.

**Auth required:** Yes — ADMIN or OWNER role

**Rules:**

- OWNER cannot be removed
- ADMIN can only remove MEMBERs — only OWNER can remove another ADMIN

**Response `200`:** `{ "message": "Member removed successfully" }`

---

## Board Endpoint

### GET `/projects/:projectId/board`

Get the full Kanban board with all columns and their tickets.

**Auth required:** Yes — must be a project member

**Response `200`:**

```json
{
  "id": "uuid",
  "name": "My Project Board",
  "projectId": "uuid",
  "statuses": [
    {
      "id": "uuid",
      "name": "To Do",
      "color": "#6B7280",
      "order": 0,
      "isDefault": true,
      "tickets": [
        {
          "id": "uuid",
          "title": "Fix login bug",
          "number": 1,
          "type": "BUG",
          "priority": "URGENT",
          "order": 0,
          "assignee": { "id": "uuid", "username": "johndoe" },
          "reporter": { "id": "uuid", "username": "janedoe" },
          "_count": { "comments": 3 }
        }
      ]
    }
  ]
}
```

Columns are ordered by `order` ASC (left to right). Tickets within each column are ordered by `order` ASC (top to bottom).

---

## Status Endpoints

### POST `/projects/:projectId/statuses`

Create a new column on the board.

**Auth required:** Yes — ADMIN or OWNER role

**Request body:**

```json
{
  "name": "Blocked",
  "color": "#EF4444",
  "order": 4,
  "isDefault": false
}
```

`color` must be a valid hex code (`#RGB` or `#RRGGBB`).

---

### PATCH `/projects/:projectId/statuses/:statusId`

Update a column's name, color, order, or default status.

**Auth required:** Yes — ADMIN or OWNER role

---

### DELETE `/projects/:projectId/statuses/:statusId`

Delete a column. **Blocked if the column contains any tickets** — move them first.

**Auth required:** Yes — ADMIN or OWNER role

**Response `200`:** `{ "message": "Status deleted successfully" }`

---

## Ticket Endpoints

### POST `/projects/:projectId/tickets`

Create a new ticket.

**Auth required:** Yes — any project member

**Request body:**

```json
{
  "title": "Fix login page styling",
  "description": "The button is misaligned on mobile",
  "type": "BUG",
  "priority": "HIGH",
  "statusId": "uuid-of-todo-column",
  "assigneeId": "uuid-of-user",
  "dueDate": "2026-03-01T00:00:00.000Z"
}
```

Only `title` and `statusId` are required. The ticket is assigned a sequential `number` scoped to the project (e.g. `MYP-1`, `MYP-2`).

**Response `201`:** Full ticket object with `status`, `assignee`, and `reporter`.

---

### GET `/projects/:projectId/tickets`

List all tickets in a project. Supports filtering via query parameters.

**Auth required:** Yes — any project member

**Query parameters (all optional):**
| Param | Type | Example |
|---|---|---|
| `statusId` | UUID | `?statusId=uuid` |
| `assigneeId` | UUID | `?assigneeId=uuid` |
| `priority` | string | `?priority=URGENT` |
| `type` | string | `?type=BUG` |

---

### GET `/projects/:projectId/tickets/:ticketId`

Get a single ticket with full details including all comments.

**Auth required:** Yes — any project member

---

### PATCH `/projects/:projectId/tickets/:ticketId`

Update ticket fields.

**Auth required:** Yes — any project member

**Request body (all optional):**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "type": "STORY",
  "priority": "LOW",
  "assigneeId": "uuid-or-null",
  "dueDate": "2026-04-01T00:00:00.000Z"
}
```

---

### PATCH `/projects/:projectId/tickets/:ticketId/move`

Move a ticket to a different column and/or position. Used for drag-and-drop.

**Auth required:** Yes — any project member

**Request body:**

```json
{
  "statusId": "uuid-of-target-column",
  "order": 0
}
```

`order` is the zero-based position within the target column. Other tickets in the column are shifted automatically.

---

### DELETE `/projects/:projectId/tickets/:ticketId`

Delete a ticket and all its comments.

**Auth required:** Yes — ticket reporter, ADMIN, or OWNER

---

## Comment Endpoints

### POST `/projects/:projectId/tickets/:ticketId/comments`

Add a comment to a ticket.

**Auth required:** Yes — any project member

**Request body:**

```json
{
  "body": "This is my comment."
}
```

**Response `201`:** Comment object with `author`.

---

### PATCH `/projects/:projectId/tickets/:ticketId/comments/:commentId`

Edit a comment. Sets `isEdited: true`.

**Auth required:** Yes — comment author only

**Request body:**

```json
{
  "body": "Updated comment text."
}
```

---

### DELETE `/projects/:projectId/tickets/:ticketId/comments/:commentId`

Delete a comment.

**Auth required:** Yes — comment author, ADMIN, or OWNER

**Response `200`:** `{ "message": "Comment deleted successfully" }`

---

## RBAC Quick Reference

| Action                              | Minimum Role    |
| ----------------------------------- | --------------- |
| View project/board/tickets/comments | MEMBER          |
| Create ticket                       | MEMBER          |
| Update any ticket                   | MEMBER          |
| Move ticket                         | MEMBER          |
| Add comment                         | MEMBER          |
| Edit own comment                    | Comment author  |
| Delete own comment                  | Comment author  |
| Delete any comment                  | ADMIN           |
| Create/update/delete status column  | ADMIN           |
| Invite member                       | ADMIN           |
| Remove MEMBER                       | ADMIN           |
| Update project settings             | ADMIN           |
| Delete own ticket                   | Ticket reporter |
| Delete any ticket                   | ADMIN           |
| Remove ADMIN                        | OWNER           |
| Archive project                     | OWNER           |
