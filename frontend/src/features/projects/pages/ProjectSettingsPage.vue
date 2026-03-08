<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useProjects } from "../composables/useProjects";
import { queryKeys } from "@/api/query-keys";
import type { ProjectWithMeta } from "@/types/project.types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();

const projectId = route.params.projectId as string;

const { updateProject, isUpdating, archiveProject, isArchiving } =
  useProjects();

const cached = queryClient.getQueryData<ProjectWithMeta[]>(
  queryKeys.projects.all(),
);
const project = cached?.find((p) => p.id === projectId);

const name = ref(project?.name ?? "");
const description = ref(project?.description ?? "");

async function handleSave() {
  if (!name.value.trim()) return;
  await updateProject({
    projectId,
    payload: {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
    },
  });
}

async function handleArchive() {
  if (
    !confirm("Archive this project? It will be hidden from your projects list.")
  )
    return;
  await archiveProject(projectId);
  router.push({ name: "projects" });
}
</script>

<template>
  <div class="max-w-xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="page-title">Project settings</h1>
      <p class="page-subtitle">Manage details for {{ project?.name }}</p>
    </div>

    <!-- General -->
    <div class="card p-5 flex flex-col gap-4 mb-4">
      <h2 class="text-sm font-semibold text-foreground">General</h2>

      <AppInput v-model="name" label="Project name" placeholder="My Project" />

      <div class="flex flex-col gap-1">
        <label class="block text-xs font-medium text-muted-foreground mb-0.5">
          Description
          <span class="text-muted-foreground/60 font-normal ml-1"
            >optional</span
          >
        </label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="What is this project about?"
          class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
        />
      </div>

      <AppButton
        variant="primary"
        :loading="isUpdating"
        class="self-start"
        @click="handleSave"
      >
        Save changes
      </AppButton>
    </div>

    <!-- Danger zone -->
    <div class="card p-5 border-red-500/30 flex flex-col gap-3">
      <h2 class="text-sm font-semibold text-red-500">Danger zone</h2>
      <p class="text-xs text-muted-foreground">
        Archiving hides this project from the projects list. Tickets and board
        data are preserved.
      </p>
      <AppButton
        variant="danger"
        :loading="isArchiving"
        class="self-start"
        @click="handleArchive"
      >
        Archive project
      </AppButton>
    </div>
  </div>
</template>
