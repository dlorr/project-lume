<script setup lang="ts">
const columns = [3, 5, 2, 4];
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-4 h-full">
    <div
      v-for="(count, i) in columns"
      :key="i"
      class="flex flex-col w-72 shrink-0"
    >
      <!-- Column header skeleton -->
      <div class="flex items-center justify-between mb-3 px-1 animate-pulse">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-muted" />
          <div class="h-3.5 w-20 bg-muted rounded" />
          <div class="h-4 w-6 bg-muted rounded-full" />
        </div>
        <div class="w-7 h-7 bg-muted rounded-md" />
      </div>

      <!-- Ticket skeletons -->
      <div class="flex flex-col gap-2">
        <SkeletonCard v-for="j in count" :key="j" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SkeletonCard from "./SkeletonCard.vue";
</script>
