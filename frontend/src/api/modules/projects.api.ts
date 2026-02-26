import apiClient from "../axios";
import type {
  Project,
  ProjectWithMeta,
  CreateProjectPayload,
  ProjectMember,
} from "@/types/project.types";

export const projectsApi = {
  getAll: () => apiClient.get<ProjectWithMeta[]>("/projects"),

  getOne: (projectId: string) =>
    apiClient.get<Project>(`/projects/${projectId}`),

  create: (payload: CreateProjectPayload) =>
    apiClient.post<Project>("/projects", payload),

  update: (projectId: string, payload: Partial<CreateProjectPayload>) =>
    apiClient.patch<Project>(`/projects/${projectId}`, payload),

  archive: (projectId: string) =>
    apiClient.patch<Project>(`/projects/${projectId}/archive`),

  inviteMember: (
    projectId: string,
    payload: { email: string; role?: "ADMIN" | "MEMBER" },
  ) => apiClient.post<ProjectMember>(`/projects/${projectId}/members`, payload),

  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`),
};
