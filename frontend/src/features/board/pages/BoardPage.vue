<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { useBoard } from "../composables/useBoard";
import { useProjects } from "@/features/projects/composables/useProjects";
import KanbanBoard from "../components/KanbanBoard.vue";
import AppSpinner from "@/components/ui/AppSpinner.vue";
import AppButton from "@/components/ui/AppButton.vue";

const route = useRoute();
const router = useRouter();

const projectId = route.params.projectId as string;

const { board, isLoading, isError } = useBoard(projectId);
const { projects } = useProjects();

// Get project info from already-cached projects list
// No extra API call needed — Vue Query already has this data
const project = computed(() => projects.value?.find((p) => p.id === projectId));
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Page header -->
    <div class="flex items-center gap-3 mb-6 shrink-0">
      <AppButton
        variant="ghost"
        size="icon"
        @click="router.push({ name: 'projects' })"
      >
        <ArrowLeft class="w-4 h-4" />
      </AppButton>

      <div>
        <h1 class="page-title">{{ project?.name ?? "Board" }}</h1>
        <p class="page-subtitle">
          {{
            board?.statuses.reduce((acc, s) => acc + s.tickets.length, 0) ?? 0
          }}
          tickets across
          {{ board?.statuses.length ?? 0 }} columns
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center flex-1">
      <AppSpinner size="lg" />
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="card p-6 text-center">
      <p class="text-sm text-red-500 font-medium">Failed to load board</p>
      <p class="text-xs text-muted-foreground mt-1">
        Check your connection and try again
      </p>
    </div>

    <!-- Board -->
    <KanbanBoard
      v-else-if="board"
      :board="board"
      :project-id="projectId"
      :project-key="project?.key ?? ''"
      class="flex-1 min-h-0"
    />
  </div>
</template>
