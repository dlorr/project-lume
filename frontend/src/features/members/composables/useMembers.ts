import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { projectsApi } from "@/api/modules/projects.api";
import { queryKeys } from "@/api/query-keys";
import { useToast } from "@/composables/useToast";

export function useMembers(projectId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: projectDetail, isLoading } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      const { data } = await projectsApi.getOne(projectId);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { mutateAsync: inviteMember, isPending: isInviting } = useMutation({
    mutationFn: (payload: { email: string; role: "ADMIN" | "MEMBER" }) =>
      projectsApi.inviteMember(projectId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(projectId),
      });
      toast.success("Member invited", `${variables.email} has been added.`);
    },
    onError: () =>
      toast.error("Failed to invite member", "Check the email and try again."),
  });

  // ── Remove member ──
  const { mutateAsync: removeMember } = useMutation({
    mutationFn: (memberId: string) =>
      projectsApi.removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(projectId),
      });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  return {
    projectDetail,
    isLoading,
    inviteMember,
    isInviting,
    removeMember,
  };
}
