<script setup lang="ts">
import { useRoute } from "vue-router";
import AppSpinner from "@/components/ui/AppSpinner.vue";

const route = useRoute();
const projectId = route.params.projectId as string;
</script>

<template>
  <div class="flex items-center justify-center py-24">
    <div class="text-center">
      <AppSpinner size="lg" class="mx-auto mb-4" />
      <p class="text-sm text-muted-foreground">Board coming in Phase 4</p>
      <p class="text-xs text-muted-foreground/60 mt-1 font-mono">
        projectId: {{ projectId }}
      </p>
    </div>
  </div>
</template>
