<script setup lang="ts">
import { ref, watch } from "vue";
import { Plus } from "lucide-vue-next";
import { useDragAndDrop } from "@formkit/drag-and-drop/vue";
import type { DragState } from "@formkit/drag-and-drop";
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
  ticketMoved: [
    payload: {
      ticketId: string;
      statusId: string;
      order: number;
    },
  ];
}>();

const [parent, tickets] = useDragAndDrop<Ticket>([...props.status.tickets], {
  group: "board",
});
/**
 * useDragAndDrop from @formkit/drag-and-drop
 *
 * Works by passing a ref array to the composable.
 * It returns a parent ref (attach to the list container)
 * and the reactive items array.
 *
 * When a card is dragged between columns, the library
 * updates the arrays and fires the 'sort' event.
 * We use that event to call the move API.
 */
watch(tickets, (newTickets, oldTickets) => {
  // Only emit if a ticket was actually moved (array contents changed)
  // Compare by mapping ids
  const newIds = newTickets.map((t) => t.id);
  const oldIds = oldTickets.map((t) => t.id);

  if (JSON.stringify(newIds) === JSON.stringify(oldIds)) return;

  // Find which ticket is new to this column
  // (exists in newTickets but not in oldTickets)
  const arrivedTicket = newTickets.find((t) => !oldIds.includes(t.id));

  if (arrivedTicket) {
    const newOrder = newTickets.indexOf(arrivedTicket);
    emit("ticketMoved", {
      ticketId: arrivedTicket.id,
      statusId: props.status.id,
      order: newOrder,
    });
  }
});

// Keep local tickets in sync when props change (after refetch)
watch(
  () => props.status.tickets,
  (newTickets) => {
    tickets.value = [...newTickets];
  },
  { deep: true },
);
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

    <!-- Ticket list — drag and drop target -->
    <div
      ref="parent"
      class="flex flex-col gap-2 flex-1 min-h-16 rounded-lg transition-colors duration-150"
    >
      <TicketCard
        v-for="ticket in tickets"
        :key="ticket.id"
        :ticket="ticket"
        :project-key="projectKey"
        @click="emit('ticketClick', ticket)"
      />
    </div>
  </div>
</template>
