<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import { watch } from "vue";
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from "../schemas/project.schemas";
import { useProjects } from "../composables/useProjects";
import AppModal from "@/components/ui/AppModal.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppButton from "@/components/ui/AppButton.vue";

const emit = defineEmits<{
  close: [];
}>();

const { createProject, isCreating } = useProjects();

const { handleSubmit, errors, resetForm } = useForm<CreateProjectFormValues>({
  validationSchema: toTypedSchema(createProjectSchema),
});

const { value: name } = useField<string>("name");
const { value: key } = useField<string>("key");
const { value: description } = useField<string>("description");

/**
 * Auto-generate the project key from the name.
 * Takes first letter of each word, uppercased, max 6 chars.
 * User can still override it manually.
 *
 * "My Awesome Project" → "MAP"
 * "Frontend Redesign"  → "FR"
 */
watch(name, (newName) => {
  if (!newName) return;
  const generated = newName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 6);
  key.value = generated;
});

const onSubmit = handleSubmit(async (values) => {
  await createProject({
    name: values.name,
    key: values.key,
    description: values.description,
  });
  resetForm();
  emit("close");
});
</script>

<template>
  <AppModal
    title="Create project"
    description="Set up a new project with a Kanban board"
    @close="emit('close')"
  >
    <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
      <AppInput
        v-model="name"
        label="Project name"
        placeholder="e.g. Marketing Website"
        :error="errors.name"
      />

      <AppInput
        v-model="key"
        label="Project key"
        placeholder="e.g. MKT"
        :error="errors.key"
      />
      <p class="text-xs text-muted-foreground -mt-3">
        Short identifier used for ticket numbers — e.g.
        <span class="font-medium text-foreground">{{ key || "MKT" }}-1</span>
      </p>

      <div class="flex flex-col gap-1">
        <label class="block text-xs font-medium text-muted-foreground mb-0.5">
          Description
          <span class="text-muted-foreground/60 font-normal ml-1"
            >optional</span
          >
        </label>
        <textarea
          v-model="description"
          placeholder="What is this project about?"
          rows="3"
          class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
        />
        <span v-if="errors.description" class="text-xs text-red-500 mt-0.5">
          {{ errors.description }}
        </span>
      </div>
    </form>

    <template #footer>
      <AppButton variant="outline" @click="emit('close')"> Cancel </AppButton>
      <AppButton variant="primary" :loading="isCreating" @click="onSubmit">
        Create project
      </AppButton>
    </template>
  </AppModal>
</template>
