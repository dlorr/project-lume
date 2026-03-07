<script setup lang="ts">
import { computed } from "vue";
import { MessageSquare, User } from "lucide-vue-next";
import type { Ticket } from "@/types/ticket.types";
import { priorityConfig, typeConfig, getInitials } from "@/utils/ticket.utils";

interface Props {
  ticket: Ticket;
  projectKey: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ click: [ticket: Ticket] }>();

const priority = computed(() => priorityConfig[props.ticket.priority]);
const type = computed(() => typeConfig[props.ticket.type]);
</script>

<template>
  <div
    class="card p-3 flex flex-col gap-2.5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all duration-150 active:opacity-80 select-none"
    @click.stop="emit('click', ticket)"
  >
    <!-- Type + Priority row -->
    <div class="flex items-center justify-between gap-2">
      <!-- Type badge -->
      <span :class="['text-[11px] font-semibold', type.color]">
        {{ type.label }}
      </span>

      <!-- Priority badge -->
      <span :class="['badge', priority.bg, priority.color]">
        {{ priority.label }}
      </span>
    </div>

    <!-- Title -->
    <p class="text-sm text-foreground font-medium leading-snug line-clamp-2">
      {{ ticket.title }}
    </p>

    <!-- Footer -->
    <div class="flex items-center justify-between gap-2 mt-0.5">
      <!-- Ticket key -->
      <span class="text-[11px] text-muted-foreground font-mono">
        {{ projectKey }}-{{ ticket.number }}
      </span>

      <div class="flex items-center gap-2">
        <!-- Comment count -->
        <span
          v-if="ticket._count && ticket._count.comments > 0"
          class="flex items-center gap-1 text-[11px] text-muted-foreground"
        >
          <MessageSquare class="w-3 h-3" />
          {{ ticket._count.comments }}
        </span>

        <!-- Assignee avatar -->
        <div
          v-if="ticket.assignee"
          class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold"
          :title="`${ticket.assignee.firstName} ${ticket.assignee.lastName}`"
        >
          {{ getInitials(ticket.assignee.firstName, ticket.assignee.lastName) }}
        </div>
        <div
          v-else
          class="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center"
        >
          <User class="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  </div>
</template>
