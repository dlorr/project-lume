import { useQuery } from "@tanstack/vue-query";
import { ticketsApi } from "@/api/modules/tickets.api";
import { queryKeys } from "@/api/query-keys";
import { computed, type Ref } from "vue";

export function useTicketDetail(
  projectId: string,
  ticketId: Ref<string | null>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.tickets.detail(projectId, ticketId.value ?? ""),
    ),
    queryFn: async () => {
      const { data } = await ticketsApi.getOne(projectId, ticketId.value!);
      return data;
    },
    enabled: () => !!ticketId.value,
  });
}
