import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { ticketsApi } from "@/api/modules/tickets.api";
import { queryKeys } from "@/api/query-keys";
import type { Board, StatusWithTickets } from "@/types/board.types";
import type {
  CreateTicketPayload,
  MoveTicketPayload,
  Ticket,
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

  // ── Move ticket (optimistic) ──
  const { mutateAsync: moveTicket } = useMutation({
    mutationFn: (payload: { ticketId: string } & MoveTicketPayload) =>
      ticketsApi
        .move(projectId, payload.ticketId, {
          statusId: payload.statusId,
          order: payload.order,
        })
        .then((r) => r.data),

    /**
     * Optimistic update — update the cache immediately on drag drop.
     * If the API call fails, roll back to the previous state.
     *
     * Flow:
     *   1. User drops ticket → onMutate fires → cache updated instantly
     *   2. API call runs in background
     *   3a. Success → onSuccess invalidates to sync with server truth
     *   3b. Failure → onError rolls back to snapshot
     */
    onMutate: async ({ ticketId, statusId, order }) => {
      // Cancel any in-flight board queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: boardKey });

      // Snapshot current state for rollback
      const previousBoard = queryClient.getQueryData<Board>(boardKey);

      // Apply optimistic update to cache
      queryClient.setQueryData<Board>(boardKey, (old) => {
        if (!old) return old;

        // Find the ticket across all columns
        let movedTicket: Ticket | undefined;

        const statusesWithoutTicket = old.statuses.map((status) => ({
          ...status,
          tickets: status.tickets.filter((t) => {
            if (t.id === ticketId) {
              movedTicket = t;
              return false;
            }
            return true;
          }),
        }));

        if (!movedTicket) return old;

        // Insert ticket into target column at the correct position
        const updatedStatuses = statusesWithoutTicket.map((status) => {
          if (status.id !== statusId) return status;

          const tickets = [...status.tickets];
          tickets.splice(order, 0, {
            ...movedTicket!,
            statusId,
            order,
          });

          return { ...status, tickets };
        });

        return { ...old, statuses: updatedStatuses };
      });

      // Return snapshot so onError can roll back
      return { previousBoard };
    },

    onError: (_err, _vars, context) => {
      // Roll back to snapshot
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKey, context.previousBoard);
      }
    },

    onSuccess: () => {
      // Sync with server after optimistic update settles
      queryClient.invalidateQueries({ queryKey: boardKey });
    },
  });

  // ── Update ticket ──
  const { mutateAsync: updateTicket, isPending: isUpdating } = useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: Partial<CreateTicketPayload>;
    }) => ticketsApi.update(projectId, ticketId, payload).then((r) => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
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
