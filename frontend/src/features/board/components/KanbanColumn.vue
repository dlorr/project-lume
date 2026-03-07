<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import type { StatusWithTickets } from "@/types/board.types";
import type { Ticket } from "@/types/ticket.types";
import TicketCard from "./TicketCard.vue";
import AppButton from "@/components/ui/AppButton.vue";

interface Props {
  status: StatusWithTickets;
  projectKey: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  ticketClick: [ticket: Ticket];
  addTicket: [statusId: string];
}>();
</script>

<template>
  <div class="flex flex-col w-72 shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2">
        <!-- Status color dot -->
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: status.color }"
        />
        <h3 class="text-sm font-semibold text-foreground">
          {{ status.name }}
        </h3>
        <!-- Ticket count -->
        <span
          class="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"
        >
          {{ status.tickets.length }}
        </span>
      </div>

      <!-- Add ticket button -->
      <AppButton
        variant="ghost"
        size="icon"
        :aria-label="`Add ticket to ${status.name}`"
        @click="emit('addTicket', status.id)"
      >
        <Plus class="w-4 h-4" />
      </AppButton>
    </div>

    <!-- Ticket list -->
    <div class="flex flex-col gap-2 flex-1 min-h-16 rounded-lg">
      <TicketCard
        v-for="ticket in status.tickets"
        :key="ticket.id"
        :ticket="ticket"
        :project-key="projectKey"
        @click="emit('ticketClick', ticket)"
      />
    </div>
  </div>
</template>
