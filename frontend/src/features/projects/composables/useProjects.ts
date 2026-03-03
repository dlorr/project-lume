import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { projectsApi } from "@/api/modules/projects.api";
import { queryKeys } from "@/api/query-keys";
import type { CreateProjectPayload } from "@/types/project.types";

/**
 * useProjects — server state for the projects list.
 *
 * Returns:
 *   projects     → reactive array of ProjectWithMeta
 *   isLoading    → true on first fetch
 *   isError      → true if fetch failed
 *   createProject → mutation function
 *   isCreating   → true while create is in flight
 */
export function useProjects() {
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
  const {
    mutateAsync: createProject,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await projectsApi.create(payload);
      return data;
    },
    onSuccess: () => {
      // Invalidate the projects list so it refetches with the new project
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
    },
  });

  return {
    projects,
    isLoading,
    isError,
    error,
    createProject,
    isCreating,
    createError,
  };
}
