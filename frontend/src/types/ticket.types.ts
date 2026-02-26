import type { User } from "./auth.types";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketType = "TASK" | "BUG" | "STORY" | "EPIC";

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  type: TicketType;
  priority: TicketPriority;
  order: number;
  number: number;
  dueDate: string | null;
  projectId: string;
  statusId: string;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, "id" | "username" | "firstName" | "lastName"> | null;
  reporter: Pick<User, "id" | "username" | "firstName" | "lastName">;
  _count?: { comments: number };
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  statusId: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface MoveTicketPayload {
  statusId: string;
  order: number;
}
