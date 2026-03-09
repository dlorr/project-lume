<script setup lang="ts">
import AppModal from "./AppModal.vue";
import AppButton from "./AppButton.vue";

interface Props {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "danger",
  loading: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <AppModal :title="title" max-width="max-w-md" @close="emit('cancel')">
    <p class="text-sm text-muted-foreground leading-relaxed">
      {{ description }}
    </p>

    <template #footer>
      <AppButton variant="outline" @click="emit('cancel')">
        {{ cancelLabel }}
      </AppButton>
      <AppButton :variant="variant" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
