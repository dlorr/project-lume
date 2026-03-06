import type { User } from "./auth.types";
import type { Status } from "./status.types";

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface Project {
  id: string;
  name: string;
  slug: string;
  key: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithMeta extends Project {
  myRole: Role;
  joinedAt: string;
  _count: {
    members: number;
    tickets: number;
  };
}

export interface ProjectMember {
  id: string;
  role: Role;
  joinedAt: string;
  user: Pick<User, "id" | "email" | "username" | "firstName" | "lastName">;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  board: {
    id: string;
    name: string;
    projectId: string;
    statuses: Status[];
  };
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
}
