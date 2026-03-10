import apiClient from "../axios";
import type { Status, CreateStatusPayload } from "@/types/status.types";

export const statusesApi = {
  create: (projectId: string, payload: CreateStatusPayload) =>
    apiClient.post<Status>(`/projects/${projectId}/statuses`, payload),

  update: (
    projectId: string,
    statusId: string,
    payload: Partial<CreateStatusPayload>,
  ) =>
    apiClient.patch<Status>(
      `/projects/${projectId}/statuses/${statusId}`,
      payload,
    ),

  remove: (projectId: string, statusId: string) =>
    apiClient.delete(`/projects/${projectId}/statuses/${statusId}`),
};
