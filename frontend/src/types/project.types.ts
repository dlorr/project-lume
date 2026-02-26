import type { User } from "./auth.types";

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

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
}
