/**
 * Centralized query key registry.
 *
 * Vue Query uses these to identify and invalidate cached data.
 * Keeping them here prevents the same data being cached under
 * different keys in different components — a common bug.
 *
 * Convention: arrays from most general to most specific.
 *   ['projects']           → all projects
 *   ['projects', id]       → one project
 *   ['board', projectId]   → board for a project
 */
export const queryKeys = {
  projects: {
    all: () => ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
    members: (id: string) => ["projects", id, "members"] as const,
  },
  board: {
    detail: (projectId: string) => ["board", projectId] as const,
  },
  tickets: {
    all: (projectId: string) => ["tickets", projectId] as const,
    detail: (projectId: string, ticketId: string) =>
      ["tickets", projectId, ticketId] as const,
  },
};
