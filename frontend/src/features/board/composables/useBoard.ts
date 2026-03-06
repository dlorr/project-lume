import { useQuery } from "@tanstack/vue-query";
import { boardsApi } from "@/api/modules/boards.api";
import { queryKeys } from "@/api/query-keys";

export function useBoard(projectId: string) {
  // ── Fetch board ──
  const {
    data: board,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.board.detail(projectId),
    queryFn: async () => {
      const { data } = await boardsApi.getBoard(projectId);
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return { board, isLoading, isError };
}
