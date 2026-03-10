import apiClient from "../axios";
import type {
  Ticket,
  CreateTicketPayload,
  MoveTicketPayload,
  TicketDetail,
} from "@/types/ticket.types";

export const ticketsApi = {
  getAll: (projectId: string, filters?: Record<string, string>) =>
    apiClient.get<Ticket[]>(`/projects/${projectId}/tickets`, {
      params: filters,
    }),

  getOne: (projectId: string, ticketId: string) =>
    apiClient.get<TicketDetail>(`/projects/${projectId}/tickets/${ticketId}`),

  create: (projectId: string, payload: CreateTicketPayload) =>
    apiClient.post<Ticket>(`/projects/${projectId}/tickets`, payload),

  update: (
    projectId: string,
    ticketId: string,
    payload: Partial<CreateTicketPayload> & {
      assigneeId?: string | null;
      description?: string | null;
    },
  ) =>
    apiClient.patch<Ticket>(
      `/projects/${projectId}/tickets/${ticketId}`,
      payload,
    ),

  move: (projectId: string, ticketId: string, payload: MoveTicketPayload) =>
    apiClient.patch<Ticket>(
      `/projects/${projectId}/tickets/${ticketId}/move`,
      payload,
    ),

  remove: (projectId: string, ticketId: string) =>
    apiClient.delete(`/projects/${projectId}/tickets/${ticketId}`),
};
