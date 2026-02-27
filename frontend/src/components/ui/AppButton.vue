<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";

/**
 * AppButton — the single button component for the entire app.
 *
 * Variants map to the visual style.
 * Size prop controls padding + text size.
 * Loading state shows a spinner and disables interaction.
 *
 * Usage:
 *   <AppButton variant="primary" :loading="isLoading" @click="submit">
 *     Save
 *   </AppButton>
 */

interface Props {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  loading: false,
  disabled: false,
  type: "button",
  fullWidth: false,
});

// Build class list based on props
// Keeping all variant/size logic here — not in style.css
const classes = computed(() => [
  // Base — always applied
  "inline-flex items-center justify-center gap-2",
  "font-medium border transition-all duration-150",
  "cursor-pointer whitespace-nowrap",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-2",
  "focus-visible:ring-offset-background",

  // Size
  props.size === "sm" && "px-3 py-1.5 text-xs rounded",
  props.size === "md" && "px-4 py-2 text-sm rounded-md",
  props.size === "icon" && "p-2 rounded-md text-sm",

  // Variant
  props.variant === "primary" && [
    "bg-primary text-primary-foreground border-primary",
    "hover:bg-primary-hover hover:border-primary-hover",
  ],
  props.variant === "ghost" && [
    "bg-transparent text-muted-foreground border-transparent",
    "hover:bg-muted hover:text-foreground",
  ],
  props.variant === "danger" && [
    "bg-transparent text-red-500 border-transparent",
    "hover:bg-red-500/10",
  ],
  props.variant === "outline" && [
    "bg-transparent text-foreground border-border",
    "hover:bg-muted",
  ],

  // Width
  props.fullWidth && "w-full",
]);
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="classes">
    <!-- Loading spinner replaces the leading icon slot -->
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />

    <!-- Default slot — button label -->
    <slot />
  </button>
</template>
