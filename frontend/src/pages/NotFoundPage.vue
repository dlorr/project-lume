<script setup lang="ts">
import { useRouter } from "vue-router";
import AppButton from "@/components/ui/AppButton.vue";

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <p class="text-8xl font-black text-primary/20 leading-none mb-4">404</p>
      <h1 class="text-xl font-bold text-foreground mb-2">Page not found</h1>
      <p class="text-sm text-muted-foreground mb-6">
        The page you're looking for doesn't exist or you don't have access to
        it.
      </p>
      <AppButton variant="primary" @click="router.push({ name: 'projects' })">
        Back to projects
      </AppButton>
    </div>
  </div>
</template>
