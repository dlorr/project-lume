<script setup lang="ts">
/**
 * AppInput — wraps a native <input> with:
 *   - Label rendering
 *   - Error message display
 *   - vee-validate integration via v-model
 *   - Consistent styling using Tailwind utilities
 *
 * Usage with vee-validate:
 *   <AppInput
 *     v-model="email"
 *     label="Email"
 *     type="email"
 *     placeholder="you@example.com"
 *     :error="errors.email"
 *   />
 *
 * Usage standalone:
 *   <AppInput v-model="search" placeholder="Search..." />
 */

interface Props {
  modelValue?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autocomplete?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <!-- Label -->
    <label
      v-if="label"
      :for="id"
      class="block text-xs font-medium text-muted-foreground mb-0.5"
    >
      {{ label }}
    </label>

    <!-- Input -->
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :class="[
        'w-full bg-input text-foreground border rounded-md',
        'px-3 py-2 text-sm outline-none',
        'placeholder:text-muted-foreground',
        'transition-all duration-150',
        'focus:border-ring focus:ring-2 focus:ring-ring/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-red-500 focus:ring-red-500/20' : 'border-border',
      ]"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />

    <!-- Error message -->
    <span v-if="error" class="text-xs text-red-500 mt-0.5">
      {{ error }}
    </span>
  </div>
</template>
