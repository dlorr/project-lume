import apiClient from "../axios";
import type {
  Ticket,
  CreateTicketPayload,
  MoveTicketPayload,
} from "@/types/ticket.types";

export const ticketsApi = {
  getAll: (projectId: string, filters?: Record<string, string>) =>
    apiClient.get<Ticket[]>(`/projects/${projectId}/tickets`, {
      params: filters,
    }),

  getOne: (projectId: string, ticketId: string) =>
    apiClient.get<Ticket>(`/projects/${projectId}/tickets/${ticketId}`),

  create: (projectId: string, payload: CreateTicketPayload) =>
    apiClient.post<Ticket>(`/projects/${projectId}/tickets`, payload),

  update: (
    projectId: string,
    ticketId: string,
    payload: Partial<CreateTicketPayload>,
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
