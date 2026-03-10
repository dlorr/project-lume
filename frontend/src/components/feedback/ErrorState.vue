<script setup lang="ts">
interface Props {
  title?: string;
  message?: string;
}

withDefaults(defineProps<Props>(), {
  title: "Something went wrong",
  message: "Check your connection and try again.",
});
</script>

<template>
  <div class="card p-6 text-center">
    <p class="text-sm text-red-500 font-medium">{{ title }}</p>
    <p class="text-xs text-muted-foreground mt-1">{{ message }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
