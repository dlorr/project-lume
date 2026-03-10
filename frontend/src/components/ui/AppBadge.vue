<script setup lang="ts">
interface Props {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

withDefaults(defineProps<Props>(), {
  variant: "default",
});

const variantClasses = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-red-500/10 text-red-500",
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase',
      variantClasses[variant],
    ]"
  >
    <slot />
  </span>
</template>
