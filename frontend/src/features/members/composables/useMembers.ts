import { useQuery } from "@tanstack/vue-query";
import { projectsApi } from "@/api/modules/projects.api";
import { queryKeys } from "@/api/query-keys";

export function useMembers(projectId: string) {
  const { data: members } = useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: async () => {
      const { data } = await projectsApi.getOne(projectId);
      return data.members;
    },
    staleTime: 1000 * 60 * 5, // members don't change often
  });

  return { members };
}
