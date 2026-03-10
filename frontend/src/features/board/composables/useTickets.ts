import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { ticketsApi } from "@/api/modules/tickets.api";
import { queryKeys } from "@/api/query-keys";
import type {
  CreateTicketPayload,
  MoveTicketPayload,
} from "@/types/ticket.types";
import { useToast } from "@/composables/useToast";

export function useTickets(projectId: string) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const boardKey = queryKeys.board.detail(projectId);

  const { mutateAsync: createTicket, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      ticketsApi.create(projectId, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
      toast.success("Ticket created");
    },
    onError: () => toast.error("Failed to create ticket"),
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
      toast.success("Ticket moved");
    },
    onError: () => toast.error("Failed to move ticket"),
  });

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
      toast.success("Ticket updated");
    },
    onError: () => toast.error("Failed to update ticket"),
  });

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
