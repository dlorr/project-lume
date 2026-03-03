<script setup lang="ts">
interface Props {
  title: string;
  description?: string;
  icon?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 px-6 text-center">
    <!-- Icon slot or default -->
    <div class="mb-4 text-muted-foreground/40">
      <slot name="icon">
        <!-- Default folder icon -->
        <svg
          class="w-14 h-14 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
          />
        </svg>
      </slot>
    </div>

    <h3 class="text-base font-semibold text-foreground mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-muted-foreground max-w-xs">
      {{ description }}
    </p>

    <!-- Optional action button -->
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
