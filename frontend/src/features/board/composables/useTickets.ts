import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { ticketsApi } from "@/api/modules/tickets.api";
import { queryKeys } from "@/api/query-keys";
import type {
  CreateTicketPayload,
  MoveTicketPayload,
} from "@/types/ticket.types";

export function useTickets(projectId: string) {
  const queryClient = useQueryClient();
  const boardKey = queryKeys.board.detail(projectId);

  // ── Create ticket ──
  const { mutateAsync: createTicket, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketsApi.create(projectId, payload).then((r) => r.data),

    onSuccess: () => {
      // Refetch board so new ticket appears in correct column
      queryClient.invalidateQueries({ queryKey: boardKey });
    },
  });

  // ── Move ticket ──
  const { mutateAsync: moveTicket } = useMutation({
    mutationFn: (payload: { ticketId: string } & MoveTicketPayload) =>
      ticketsApi
        .move(projectId, payload.ticketId, {
          statusId: payload.statusId,
          order: payload.order,
        })
        .then((r) => r.data),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(projectId, variables.ticketId),
      });
    },
  });

  // ── Update ticket ──
  const { mutateAsync: updateTicket, isPending: isUpdating } = useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: Partial<CreateTicketPayload> & {
        assigneeId?: string | null;
        description?: string | null;
      };
    }) => ticketsApi.update(projectId, ticketId, payload).then((r) => r.data),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(projectId, variables.ticketId),
      });
    },
  });

  // ── Delete ticket ──
  const { mutateAsync: deleteTicket } = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.remove(projectId, ticketId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
    },
  });

  return {
    createTicket,
    isCreating,
    moveTicket,
    updateTicket,
    isUpdating,
    deleteTicket,
  };
}
