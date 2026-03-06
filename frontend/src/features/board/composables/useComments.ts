import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { commentsApi } from "@/api/modules/comments.api";
import { queryKeys } from "@/api/query-keys";

export function useComments(projectId: string, ticketId: string) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.detail(projectId, ticketId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.board.detail(projectId),
    });
  }

  // ── Create comment ──
  const { mutateAsync: addComment, isPending: isAdding } = useMutation({
    mutationFn: (body: string) =>
      commentsApi.create(projectId, ticketId, body).then((r) => r.data),
    onSuccess: invalidate,
  });

  // ── Update comment ──
  const { mutateAsync: editComment } = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      commentsApi
        .update(projectId, ticketId, commentId, body)
        .then((r) => r.data),
    onSuccess: invalidate,
  });

  // ── Remove comment ──
  const { mutateAsync: removeComment } = useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.remove(projectId, ticketId, commentId),
    onSuccess: invalidate,
  });

  return { addComment, isAdding, editComment, removeComment };
}
