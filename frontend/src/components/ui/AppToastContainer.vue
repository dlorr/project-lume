<script setup lang="ts">
import { useToast } from "@/composables/useToast";
import AppToast from "./AppToast.vue";

const { toasts, remove } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-200 flex flex-col gap-2">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <AppToast
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @dismiss="remove"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.25s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
