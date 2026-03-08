import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { projectsApi } from "@/api/modules/projects.api";
import { queryKeys } from "@/api/query-keys";
import type { CreateProjectPayload } from "@/types/project.types";
import { useToast } from "@/composables/useToast";

export function useProjects() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // ── Fetch all projects ──
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: async () => {
      const { data } = await projectsApi.getAll();
      return data;
    },
  });

  // ── Create project ──
  const { mutateAsync: createProject, isPending: isCreating } = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await projectsApi.create(payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      toast.success("Project created", `${data.name} is ready.`);
    },
    onError: () => {
      toast.error("Failed to create project", "Please try again.");
    },
  });

  // ── Update project ──
  const { mutateAsync: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: { name: string; description?: string };
    }) => projectsApi.update(projectId, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      toast.success("Project updated");
    },
    onError: () => toast.error("Failed to update project"),
  });

  // ── Archive project ──
  const { mutateAsync: archiveProject, isPending: isArchiving } = useMutation({
    mutationFn: (projectId: string) => projectsApi.archive(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      toast.success("Project archived");
    },
    onError: () => toast.error("Failed to archive project"),
  });

  return {
    projects,
    isLoading,
    isError,
    error,
    createProject,
    isCreating,
    updateProject,
    isUpdating,
    archiveProject,
    isArchiving,
  };
}
