<script setup lang="ts">
import { computed } from "vue";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-vue-next";
import type { Toast } from "@/composables/useToast";

interface Props {
  toast: Toast;
}

const props = defineProps<Props>();
const emit = defineEmits<{ dismiss: [id: string] }>();

const config = computed(() => {
  switch (props.toast.type) {
    case "success":
      return {
        icon: CheckCircle,
        bg: "bg-green-500/10 border-green-500/20",
        icon_color: "text-green-500",
        title_color: "text-green-700 dark:text-green-400",
      };
    case "error":
      return {
        icon: AlertCircle,
        bg: "bg-red-500/10 border-red-500/20",
        icon_color: "text-red-500",
        title_color: "text-red-700 dark:text-red-400",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        bg: "bg-yellow-500/10 border-yellow-500/20",
        icon_color: "text-yellow-500",
        title_color: "text-yellow-700 dark:text-yellow-400",
      };
    default:
      return {
        icon: Info,
        bg: "bg-primary/10 border-primary/20",
        icon_color: "text-primary",
        title_color: "text-primary",
      };
  }
});
</script>

<template>
  <div
    :class="[
      'flex items-start gap-3 w-80 rounded-xl border px-4 py-3 shadow-lg',
      'backdrop-blur-sm bg-card',
      config.bg,
    ]"
  >
    <component
      :is="config.icon"
      :class="['w-4 h-4 mt-0.5 shrink-0', config.icon_color]"
    />
    <div class="flex-1 min-w-0">
      <p :class="['text-sm font-semibold leading-snug', config.title_color]">
        {{ toast.title }}
      </p>
      <p v-if="toast.message" class="text-xs text-muted-foreground mt-0.5">
        {{ toast.message }}
      </p>
    </div>
    <button
      class="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      @click="emit('dismiss', toast.id)"
    >
      <X class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
