<script setup lang="ts">
import { ref } from "vue";
import type { Board } from "@/types/board.types";
import type { Ticket } from "@/types/ticket.types";
import KanbanColumn from "./KanbanColumn.vue";
import CreateTicketModal from "./CreateTicketModal.vue";
import TicketDetailModal from "./TicketDetailModal.vue";
import { useTickets } from "../composables/useTickets";

interface Props {
  board: Board;
  projectId: string;
  projectKey: string;
}

const props = defineProps<Props>();

const { moveTicket } = useTickets(props.projectId);

// Modal state
const createModal = ref<{ open: boolean; statusId: string }>({
  open: false,
  statusId: "",
});
const selectedTicket = ref<Ticket | null>(null);

function openCreateModal(statusId: string) {
  createModal.value = { open: true, statusId };
}

function closeCreateModal() {
  createModal.value = { open: false, statusId: "" };
}

async function handleTicketMoved(payload: {
  ticketId: string;
  statusId: string;
  order: number;
}) {
  await moveTicket(payload);
}
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-4 h-full">
    <KanbanColumn
      v-for="status in board.statuses"
      :key="status.id"
      :status="status"
      :project-key="projectKey"
      @ticket-click="selectedTicket = $event"
      @add-ticket="openCreateModal"
      @ticket-moved="handleTicketMoved"
    />
  </div>

  <!-- Create ticket modal -->
  <CreateTicketModal
    v-if="createModal.open"
    :project-id="projectId"
    :status-id="createModal.statusId"
    @close="closeCreateModal"
  />

  <!-- Ticket detail modal -->
  <TicketDetailModal
    v-if="selectedTicket"
    :project-id="projectId"
    :ticket="selectedTicket"
    @close="selectedTicket = null"
  />
</template>
