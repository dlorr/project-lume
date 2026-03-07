<script setup lang="ts">
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import { useTickets } from "../composables/useTickets";
import AppModal from "@/components/ui/AppModal.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppButton from "@/components/ui/AppButton.vue";
import type { TicketType, TicketPriority } from "@/types/ticket.types";
import {
  createTicketSchema,
  type CreateTicketFormValues,
} from "../schemas/ticket.schemas";
import { useMembers } from "@/features/members/composables/useMembers";

interface Props {
  projectId: string;
  statusId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const { createTicket, isCreating } = useTickets(props.projectId);
const { members } = useMembers(props.projectId);

const { handleSubmit, errors } = useForm<CreateTicketFormValues>({
  validationSchema: toTypedSchema(createTicketSchema),
  initialValues: {
    title: "",
    description: "",
    type: "TASK" as TicketType,
    priority: "MEDIUM" as TicketPriority,
  },
});

const { value: title } = useField<string>("title");
const { value: description } = useField<string>("description");
const { value: type } = useField<TicketType>("type");
const { value: priority } = useField<TicketPriority>("priority");
const { value: assigneeId } = useField<string | undefined>("assigneeId");

const onSubmit = handleSubmit(async (values) => {
  await createTicket({
    title: values.title,
    description: values.description,
    type: values.type,
    priority: values.priority,
    statusId: props.statusId,
    assigneeId: values.assigneeId || undefined,
  });
  emit("close");
});

const typeOptions: { value: TicketType; label: string }[] = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "STORY", label: "Story" },
  { value: "EPIC", label: "Epic" },
];

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];
</script>

<template>
  <AppModal
    title="Create ticket"
    description="Add a new ticket to this column"
    @close="emit('close')"
  >
    <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
      <AppInput
        v-model="title"
        label="Title"
        placeholder="What needs to be done?"
        :error="errors.title"
      />

      <!-- Description -->
      <div class="flex flex-col gap-1">
        <label class="block text-xs font-medium text-muted-foreground mb-0.5">
          Description
          <span class="text-muted-foreground/60 font-normal ml-1"
            >(optional)</span
          >
        </label>
        <textarea
          v-model="description"
          placeholder="Add more details..."
          rows="3"
          class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
        />
      </div>

      <!-- Type + Priority row -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Type -->
        <div class="flex flex-col gap-1">
          <label class="block text-xs font-medium text-muted-foreground mb-0.5">
            Type
          </label>
          <select
            v-model="type"
            class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
          >
            <option
              v-for="opt in typeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Priority -->
        <div class="flex flex-col gap-1">
          <label class="block text-xs font-medium text-muted-foreground mb-0.5">
            Priority
          </label>
          <select
            v-model="priority"
            class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
          >
            <option
              v-for="opt in priorityOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Assignee -->
      <div class="flex flex-col gap-1">
        <label class="block text-xs font-medium text-muted-foreground mb-0.5">
          Assignee
          <span class="text-muted-foreground/60 font-normal ml-1"
            >(optional)</span
          >
        </label>
        <select
          v-model="assigneeId"
          class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
        >
          <option value="">Unassigned</option>
          <option
            v-for="member in members"
            :key="member.user.id"
            :value="member.user.id"
          >
            {{ member.user.firstName }} {{ member.user.lastName }}
          </option>
        </select>
      </div>
    </form>

    <template #footer>
      <AppButton variant="outline" @click="emit('close')">Cancel</AppButton>
      <AppButton variant="primary" :loading="isCreating" @click="onSubmit">
        Create ticket
      </AppButton>
    </template>
  </AppModal>
</template>
