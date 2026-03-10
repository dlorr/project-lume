<script setup lang="ts">
import { ref } from "vue";
import type { Board } from "@/types/board.types";
import type { Ticket } from "@/types/ticket.types";
import KanbanColumn from "./KanbanColumn.vue";
import CreateTicketModal from "./CreateTicketModal.vue";
import TicketDetailModal from "./TicketDetailModal.vue";

interface Props {
  board: Board;
  projectId: string;
  projectKey: string;
}

const props = defineProps<Props>();

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
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex gap-4 overflow-x-auto pb-4 h-full">
      <KanbanColumn
        v-for="status in board.statuses"
        :key="status.id"
        :status="status"
        :project-key="projectKey"
        @ticket-click="selectedTicket = $event"
        @add-ticket="openCreateModal"
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
      :project-key="projectKey"
      :board="board"
      @close="selectedTicket = null"
    />
  </div>
</template>
