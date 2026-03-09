<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { useBoard } from "../composables/useBoard";
import { useProjects } from "@/features/projects/composables/useProjects";
import KanbanBoard from "../components/KanbanBoard.vue";
import AppButton from "@/components/ui/AppButton.vue";
import SkeletonBoard from "@/components/feedback/SkeletonBoard.vue";
import { Settings, Users } from "lucide-vue-next";
import ErrorState from "@/components/feedback/ErrorState.vue";

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
    <div class="flex items-center justify-between mb-6 shrink-0">
      <div class="flex items-center gap-3">
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
            tickets
          </p>
        </div>
      </div>

      <!-- Settings + Members links -->
      <div class="flex items-center gap-2">
        <AppButton
          variant="outline"
          @click="
            router.push({ name: 'project-members', params: { projectId } })
          "
        >
          <Users class="w-4 h-4" />
          Members
        </AppButton>
        <AppButton
          variant="ghost"
          size="icon"
          @click="
            router.push({ name: 'project-settings', params: { projectId } })
          "
        >
          <Settings class="w-4 h-4" />
        </AppButton>
      </div>
    </div>

    <!-- Loading -->
    <SkeletonBoard v-if="isLoading" />

    <!-- Error -->
    <ErrorState v-else-if="isError" title="Failed to load board" />

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
