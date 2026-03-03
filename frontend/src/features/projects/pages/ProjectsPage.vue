<script setup lang="ts">
import { ref } from "vue";
import { Plus } from "lucide-vue-next";
import { useProjects } from "../composables/useProjects";
import ProjectCard from "../components/ProjectCard.vue";
import CreateProjectModal from "../components/CreateProjectModal.vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppSpinner from "@/components/ui/AppSpinner.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";

const { projects, isLoading, isError } = useProjects();

const showCreateModal = ref(false);
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">
          {{ projects?.length ?? 0 }}
          {{ (projects?.length ?? 0) === 1 ? "project" : "projects" }}
        </p>
      </div>

      <AppButton variant="primary" @click="showCreateModal = true">
        <Plus class="w-4 h-4" />
        New project
      </AppButton>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <AppSpinner size="lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="isError" class="card p-6 text-center">
      <p class="text-sm text-red-500 font-medium mb-1">
        Failed to load projects
      </p>
      <p class="text-xs text-muted-foreground">
        Check your connection and try again
      </p>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!projects?.length"
      title="No projects yet"
      description="Create your first project to start organizing your work with a Kanban board."
    >
      <template #action>
        <AppButton variant="primary" @click="showCreateModal = true">
          <Plus class="w-4 h-4" />
          Create your first project
        </AppButton>
      </template>
    </EmptyState>

    <!-- Project grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
      />
    </div>

    <!-- Create modal -->
    <CreateProjectModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
    />
  </div>
</template>
