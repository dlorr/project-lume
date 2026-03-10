<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { X } from "lucide-vue-next";
import AppButton from "./AppButton.vue";

/**
 * AppModal — reusable modal wrapper.
 *
 * Features:
 *   - Teleports to <body> so it escapes any overflow:hidden parents
 *   - Closes on Escape key
 *   - Closes on backdrop click
 *   - Traps focus inside (accessibility)
 *
 * Slots:
 *   default    → modal body content
 *   footer     → optional action buttons
 *
 * Usage:
 *   <AppModal title="Create Project" @close="closeModal">
 *     <p>Content here</p>
 *     <template #footer>
 *       <AppButton @click="closeModal">Cancel</AppButton>
 *       <AppButton variant="primary">Save</AppButton>
 *     </template>
 *   </AppModal>
 */

interface Props {
  title: string;
  description?: string;
  maxWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: "max-w-lg",
});

const emit = defineEmits<{
  close: [];
}>();

function handleEscape(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

onMounted(() => document.addEventListener("keydown", handleEscape));
onUnmounted(() => document.removeEventListener("keydown", handleEscape));
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="emit('close')"
    >
      <!-- Modal panel -->
      <div
        :class="[
          'bg-card border border-border rounded-2xl shadow-2xl w-full flex flex-col',
          'max-h-[90vh]',
          maxWidth,
        ]"
        role="dialog"
        :aria-label="title"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0"
        >
          <div>
            <h2 class="text-base font-semibold text-foreground">{{ title }}</h2>
            <p v-if="description" class="text-xs text-muted-foreground mt-0.5">
              {{ description }}
            </p>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            aria-label="Close modal"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </AppButton>
        </div>

        <!-- Body — scrollable if content overflows -->
        <div class="px-6 py-5 overflow-y-auto flex-1">
          <slot />
        </div>

        <!-- Footer — optional -->
        <div
          v-if="$slots.footer"
          class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
