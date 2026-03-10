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
