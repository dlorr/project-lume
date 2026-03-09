<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useProjects } from "../composables/useProjects";
import { queryKeys } from "@/api/query-keys";
import type { ProjectWithMeta } from "@/types/project.types";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import { ArrowLeft } from "lucide-vue-next";
import AppConfirmModal from "@/components/ui/AppConfirmModal.vue";

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

const showArchiveConfirm = ref(false);

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

async function handleArchiveConfirm() {
  await archiveProject(projectId);
  showArchiveConfirm.value = false;
  router.push({ name: "projects" });
}
</script>

<template>
  <div class="max-w-xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <AppButton
        variant="ghost"
        size="icon"
        @click="router.push({ name: 'board', params: { projectId } })"
      >
        <ArrowLeft class="w-4 h-4" />
      </AppButton>
      <div>
        <h1 class="page-title">Project settings</h1>
        <p class="page-subtitle">Manage details for {{ project?.name }}</p>
      </div>
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
        class="self-start"
        @click="showArchiveConfirm = true"
      >
        Archive project
      </AppButton>
    </div>
  </div>

  <!-- Archive confirmation modal -->
  <AppConfirmModal
    v-if="showArchiveConfirm"
    title="Archive project"
    :description="`Are you sure you want to archive '${project?.name}'? It will be hidden from your projects list. Tickets and board data are preserved.`"
    confirm-label="Archive project"
    :loading="isArchiving"
    @confirm="handleArchiveConfirm"
    @cancel="showArchiveConfirm = false"
  />
</template>
