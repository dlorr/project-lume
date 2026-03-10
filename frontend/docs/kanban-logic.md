# Kanban Logic

This document explains the data flow, component structure, and business logic of the Kanban board feature.

---

## Data Shape

The board endpoint returns a single nested object containing all statuses with their tickets:

```
GET /projects/:projectId/board

Board
└── statuses: StatusWithTickets[]
    └── status
        ├── id, name, color, order, isDefault
        └── tickets: Ticket[]
            └── ticket
                ├── id, title, type, priority, order, number
                ├── statusId, projectId
                ├── assignee: { id, firstName, lastName, username } | null
                ├── reporter: { id, firstName, lastName, username }
                └── _count: { comments }
```

A single `GET /board` call loads everything needed to render the full board. Tickets are not fetched separately.

When a ticket is opened in the detail modal, a second request fires:

```
GET /projects/:projectId/tickets/:ticketId

TicketDetail (extends Ticket)
└── comments: Comment[]
    └── comment
        ├── id, body, isEdited, authorId
        └── author: { id, firstName, lastName, username }
```

---

## Component Tree

```
BoardPage
└── KanbanBoard
    ├── KanbanColumn (× n statuses)
    │   └── TicketCard (× n tickets)
    ├── CreateTicketModal
    │   └── AppModal
    └── TicketDetailModal
        └── AppModal
```

**BoardPage** owns the board query and project context. It passes the board data down to `KanbanBoard`.

**KanbanBoard** owns modal state — which modal is open, which ticket is selected. It receives `board`, `projectId`, and `projectKey` as props.

**KanbanColumn** receives a single `StatusWithTickets` object. It renders ticket cards and emits events upward — it owns no state of its own.

**TicketCard** is a pure display component. It emits a `click` event with the ticket object. It uses `computed()` for `priority` and `type` so they react to prop changes.

**TicketDetailModal** is self-contained — it fetches its own full ticket detail via `useTicketDetail`. The `ticket` prop (from the board cache) is used only for the initial display while the detail query loads.

---

## Ticket Number vs Ticket ID

Each ticket has two identifiers:

| Field    | Type    | Purpose                                      |
| -------- | ------- | -------------------------------------------- |
| `id`     | UUID    | Database primary key — used in all API calls |
| `number` | Integer | Human-readable sequential number per project |

`number` is auto-incremented per project on the backend (not globally). The display format is `{projectKey}-{number}` — e.g. `MFP-4`. The `projectKey` comes from the project object, not the ticket itself.

---

## Ticket Order

Tickets within a column are ordered by the `order` field (integer, 0-based). When a ticket is moved:

1. The backend shifts all tickets in the target column at `order >= newOrder` up by 1
2. The moved ticket is assigned the new order value

This happens atomically in a Prisma `$transaction`.

> **Note:** Drag and drop UI is planned for Phase 5.2. Currently, tickets can be moved between columns via the status dropdown in the ticket detail modal. The `order` is set to `0` (top of column) on a modal move.

---

## Creating a Ticket

```
User clicks + on a column
  → CreateTicketModal opens with statusId pre-filled
  → User fills form (title required, rest optional)
  → Submit → POST /projects/:id/tickets
  → onSuccess → invalidate board query
  → Board refetches → new ticket appears in column
```

The backend assigns:

- `number`: max existing number + 1 (per project)
- `order`: max existing order in target column + 1 (appended to bottom)
- `reporterId`: the authenticated user's id

---

## Inline Ticket Editing

The ticket detail modal uses **field-level inline editing** — each field has its own independent edit state. Only one field can be in edit mode at a time via a single `editingField` ref.

```typescript
type EditableField =
  | "title"
  | "description"
  | "type"
  | "priority"
  | "assignee"
  | null;
const editingField = ref<EditableField>(null);
const editValue = ref<string>("");
```

When a field is saved:

```
saveField('priority')
  → build payload: { priority: editValue }
  → PATCH /projects/:id/tickets/:ticketId
  → onSuccess → invalidate board + ticket detail queries
  → board cache updates (card reflects new priority)
  → ticket detail refetches (modal reflects new priority)
```

Clearing a field (e.g. removing assignee, clearing description) sends `null` explicitly — not `undefined`. The backend `UpdateTicketDto` handles `null` to clear the field in the database.

---

## Moving a Ticket

The status dropdown in the ticket detail modal header allows moving a ticket between columns:

```
User selects new status from dropdown
  → handleMoveTicket(newStatusId)
  → PATCH /projects/:id/tickets/:ticketId/move
     { statusId: newStatusId, order: 0 }
  → onSuccess → invalidate board + ticket detail queries
  → board refetches → ticket appears in new column
  → ticket detail refetches → status dropdown updates
```

---

## Comments

Comments are fetched as part of the ticket detail response (`TicketDetail.comments[]`). They are not a separate query — invalidating `tickets.detail(projectId, ticketId)` refetches the ticket with its comments.

The comment count shown on `TicketCard` comes from `ticket._count.comments` in the board cache. When a comment is added or deleted, both the ticket detail query **and** the board query are invalidated so the card count updates.

```typescript
function invalidate() {
  queryClient.invalidateQueries({
    queryKey: queryKeys.tickets.detail(projectId, ticketId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.board.detail(projectId),
  });
}
```

---

## Deleting a Ticket

Deletion requires OWNER, ADMIN, or being the reporter of the ticket (enforced on the backend). The frontend does not check roles before showing the delete button — the backend will reject unauthorized attempts.

```
User clicks Delete ticket
  → AppConfirmModal opens
  → User confirms
  → DELETE /projects/:id/tickets/:ticketId
  → onSuccess → invalidate board query → modal closes
```

---

## Known Limitations

| Limitation                                           | Planned Fix                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| Drag and drop not implemented                        | Phase 5.2                                                      |
| No real-time updates between users                   | Future — requires WebSockets                                   |
| Comment count on other users' cards requires refresh | Resolved when WebSockets added                                 |
| Move ticket always places at order 0 (top)           | Fixed when drag and drop is implemented                        |
| Scrum Board view not implemented                     | Future — sprint planning, backlog management, and velocity     |
|                                                      | tracking planned as an alternative board view alongside Kanban |
