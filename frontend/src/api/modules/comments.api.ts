import apiClient from "../axios";
import type { Comment } from "@/types/comment.types";

export const commentsApi = {
  create: (projectId: string, ticketId: string, body: string) =>
    apiClient.post<Comment>(
      `/projects/${projectId}/tickets/${ticketId}/comments`,
      { body },
    ),

  update: (
    projectId: string,
    ticketId: string,
    commentId: string,
    body: string,
  ) =>
    apiClient.patch<Comment>(
      `/projects/${projectId}/tickets/${ticketId}/comments/${commentId}`,
      { body },
    ),

  remove: (projectId: string, ticketId: string, commentId: string) =>
    apiClient.delete(
      `/projects/${projectId}/tickets/${ticketId}/comments/${commentId}`,
    ),
};
