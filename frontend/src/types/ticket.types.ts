import type { User } from "./auth.types";
import type { Comment } from "./comment.types";
import type { Status } from "./status.types";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketType = "TASK" | "BUG" | "STORY" | "EPIC";
type TicketUser = Pick<User, "id" | "username" | "firstName" | "lastName">;

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
  assigneeId: string | null;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  assignee: TicketUser | null;
  reporter: TicketUser;
  _count?: { comments: number };
}

export interface TicketDetail extends Ticket {
  comments: Comment[];
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
