<script setup lang="ts">
import { ref, computed } from "vue";
import { Trash2, Send, Pencil, Check, X } from "lucide-vue-next";
import { useTicketDetail } from "../composables/useTicketDetail";
import { useTickets } from "../composables/useTickets";
import { useComments } from "../composables/useComments";
import { useMembers } from "@/features/members/composables/useMembers";
import { useAuthStore } from "@/stores/auth.store";
import AppModal from "@/components/ui/AppModal.vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppSpinner from "@/components/ui/AppSpinner.vue";
import {
  priorityConfig,
  typeConfig,
  formatDate,
  getInitials,
} from "@/utils/ticket.utils";
import type { Ticket, TicketType, TicketPriority } from "@/types/ticket.types";
import type { Board } from "@/types/board.types";
import AppConfirmModal from "@/components/ui/AppConfirmModal.vue";

interface Props {
  projectId: string;
  projectKey: string;
  ticket: Ticket;
  board: Board;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const authStore = useAuthStore();
const ticketId = ref(props.ticket.id);

const { data: ticketDetail, isLoading } = useTicketDetail(
  props.projectId,
  ticketId,
);
const { deleteTicket, updateTicket, isUpdating, moveTicket } = useTickets(
  props.projectId,
);
const { addComment, isAdding, editComment, removeComment } = useComments(
  props.projectId,
  props.ticket.id,
);
const { projectDetail } = useMembers(props.projectId);

type EditableField =
  | "title"
  | "description"
  | "type"
  | "priority"
  | "assignee"
  | null;
const editingField = ref<EditableField>(null);
const editValue = ref<string>("");

const showDeleteConfirm = ref(false);

function startEdit(field: EditableField, currentValue: string) {
  editingField.value = field;
  editValue.value = currentValue;
}

function cancelEdit() {
  editingField.value = null;
  editValue.value = "";
}

async function saveField(field: EditableField) {
  if (!field) return;

  type UpdatePayload = {
    title?: string;
    description?: string | null;
    type?: TicketType;
    priority?: TicketPriority;
    assigneeId?: string | null;
  };

  const payload: UpdatePayload = {};

  switch (field) {
    case "title":
      if (!editValue.value.trim()) return;
      payload.title = editValue.value.trim();
      break;
    case "description":
      payload.description = editValue.value.trim() || null;
      break;
    case "type":
      payload.type = editValue.value as TicketType;
      break;
    case "priority":
      payload.priority = editValue.value as TicketPriority;
      break;
    case "assignee":
      payload.assigneeId = editValue.value || null;
      break;
  }

  await updateTicket({ ticketId: props.ticket.id, payload });
  editingField.value = null;
  editValue.value = "";
}

// ── Move ticket (status change) ──
const selectedStatusId = ref(props.ticket.statusId);

async function handleMoveTicket(statusId: string) {
  if (statusId === ticketDetail.value?.statusId) return;
  selectedStatusId.value = statusId;
  await moveTicket({
    ticketId: props.ticket.id,
    statusId,
    order: 0,
  });
}

// ── Comments ──
const commentBody = ref("");
const editingCommentId = ref<string | null>(null);
const editingCommentBody = ref("");

async function handleAddComment() {
  if (!commentBody.value.trim()) return;
  await addComment(commentBody.value.trim());
  commentBody.value = "";
}

function startEditComment(commentId: string, body: string) {
  editingCommentId.value = commentId;
  editingCommentBody.value = body;
}

async function submitEditComment(commentId: string) {
  if (!editingCommentBody.value.trim()) return;
  await editComment({ commentId, body: editingCommentBody.value.trim() });
  editingCommentId.value = null;
}

function cancelEditComment() {
  editingCommentId.value = null;
  editingCommentBody.value = "";
}

async function handleDeleteConfirm() {
  await deleteTicket(props.ticket.id);
  showDeleteConfirm.value = false;
  emit("close");
}

const isMyComment = (authorId: string) => authStore.user?.id === authorId;

const priority = computed(
  () => priorityConfig[ticketDetail.value?.priority ?? props.ticket.priority],
);
const type = computed(
  () => typeConfig[ticketDetail.value?.type ?? props.ticket.type],
);

const currentStatus = computed(() =>
  props.board.statuses.find(
    (s) => s.id === (ticketDetail.value?.statusId ?? props.ticket.statusId),
  ),
);

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
    :title="`${projectKey}-${ticket.number}`"
    max-width="max-w-2xl"
    @close="emit('close')"
  >
    <div v-if="isLoading" class="flex justify-center py-10">
      <AppSpinner />
    </div>

    <template v-else-if="ticketDetail">
      <div class="flex flex-col gap-5">
        <!-- ── Title + Status row ── -->
        <div class="flex items-start justify-between gap-3">
          <!-- Title -->
          <div class="flex-1 min-w-0">
            <!-- View mode -->
            <div
              v-if="editingField !== 'title'"
              class="flex items-start gap-2 group"
            >
              <h3 class="text-base font-semibold text-foreground leading-snug">
                {{ ticketDetail.title }}
              </h3>
              <AppButton
                variant="ghost"
                size="icon"
                class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6"
                @click="startEdit('title', ticketDetail.title)"
              >
                <Pencil class="w-3 h-3" />
              </AppButton>
            </div>

            <!-- Edit mode -->
            <div v-else class="flex flex-col gap-2">
              <input
                v-model="editValue"
                type="text"
                class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
                @keydown.enter="saveField('title')"
                @keydown.escape="cancelEdit"
              />
              <div class="flex gap-2">
                <AppButton
                  size="icon"
                  variant="primary"
                  class="w-7 h-7"
                  :loading="isUpdating"
                  @click="saveField('title')"
                >
                  <Check class="w-3.5 h-3.5" />
                </AppButton>
                <AppButton
                  size="icon"
                  variant="ghost"
                  class="w-7 h-7"
                  @click="cancelEdit"
                >
                  <X class="w-3.5 h-3.5" />
                </AppButton>
              </div>
            </div>
          </div>

          <!-- Status dropdown — rightmost -->
          <select
            :value="currentStatus?.id"
            class="shrink-0 bg-muted text-foreground border border-border rounded-md px-2 py-1 text-xs outline-none cursor-pointer focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
            @change="
              handleMoveTicket(($event.target as HTMLSelectElement).value)
            "
          >
            <option
              v-for="status in board.statuses"
              :key="status.id"
              :value="status.id"
            >
              {{ status.name }}
            </option>
          </select>
        </div>

        <!-- ── Type + Priority ── -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Type -->
          <div class="group flex items-center gap-1">
            <span
              v-if="editingField !== 'type'"
              :class="['text-xs font-semibold cursor-pointer', type.color]"
              @click="startEdit('type', ticketDetail.type)"
            >
              {{ type.label }}
            </span>
            <div v-else class="flex items-center gap-1">
              <select
                v-model="editValue"
                class="bg-input text-foreground border border-border rounded-md px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <AppButton
                size="icon"
                variant="primary"
                class="w-6 h-6"
                :loading="isUpdating"
                @click="saveField('type')"
              >
                <Check class="w-3 h-3" />
              </AppButton>
              <AppButton
                size="icon"
                variant="ghost"
                class="w-6 h-6"
                @click="cancelEdit"
              >
                <X class="w-3 h-3" />
              </AppButton>
            </div>
          </div>

          <span class="text-muted-foreground/40">·</span>

          <!-- Priority -->
          <div class="group flex items-center gap-1">
            <span
              v-if="editingField !== 'priority'"
              :class="['badge cursor-pointer', priority.bg, priority.color]"
              @click="startEdit('priority', ticketDetail.priority)"
            >
              {{ priority.label }}
            </span>
            <div v-else class="flex items-center gap-1">
              <select
                v-model="editValue"
                class="bg-input text-foreground border border-border rounded-md px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <AppButton
                size="icon"
                variant="primary"
                class="w-6 h-6"
                :loading="isUpdating"
                @click="saveField('priority')"
              >
                <Check class="w-3 h-3" />
              </AppButton>
              <AppButton
                size="icon"
                variant="ghost"
                class="w-6 h-6"
                @click="cancelEdit"
              >
                <X class="w-3 h-3" />
              </AppButton>
            </div>
          </div>

          <span class="text-muted-foreground/40">·</span>
          <span class="text-xs text-muted-foreground">
            Created {{ formatDate(ticketDetail.createdAt) }}
          </span>
        </div>

        <!-- ── Description ── -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-xs font-medium text-muted-foreground">Description</p>
            <AppButton
              v-if="editingField !== 'description'"
              variant="ghost"
              size="icon"
              class="w-6 h-6"
              @click="startEdit('description', ticketDetail.description ?? '')"
            >
              <Pencil class="w-3 h-3" />
            </AppButton>
          </div>

          <!-- View -->
          <p
            v-if="editingField !== 'description'"
            class="text-sm leading-relaxed whitespace-pre-wrap"
            :class="
              ticketDetail.description
                ? 'text-foreground'
                : 'text-muted-foreground italic'
            "
          >
            {{ ticketDetail.description ?? "No description provided." }}
          </p>

          <!-- Edit -->
          <div v-else class="flex flex-col gap-2">
            <textarea
              v-model="editValue"
              rows="4"
              class="w-full bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
              @keydown.escape="cancelEdit"
            />
            <div class="flex gap-2">
              <AppButton
                size="icon"
                variant="primary"
                class="w-7 h-7"
                :loading="isUpdating"
                @click="saveField('description')"
              >
                <Check class="w-3.5 h-3.5" />
              </AppButton>
              <AppButton
                size="icon"
                variant="ghost"
                class="w-7 h-7"
                @click="cancelEdit"
              >
                <X class="w-3.5 h-3.5" />
              </AppButton>
            </div>
          </div>
        </div>

        <!-- ── Assignee + Reporter ── -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Assignee -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">
              Assignee
            </p>

            <!-- View -->
            <div
              v-if="editingField !== 'assignee'"
              class="flex items-center gap-2 group cursor-pointer"
              @click="startEdit('assignee', ticketDetail.assigneeId ?? '')"
            >
              <template v-if="ticketDetail.assignee">
                <div
                  class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold"
                >
                  {{
                    getInitials(
                      ticketDetail.assignee.firstName,
                      ticketDetail.assignee.lastName,
                    )
                  }}
                </div>
                <span class="text-sm text-foreground">
                  {{ ticketDetail.assignee.firstName }}
                  {{ ticketDetail.assignee.lastName }}
                </span>
              </template>
              <span v-else class="text-sm text-muted-foreground">
                Unassigned
              </span>
              <Pencil
                class="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              />
            </div>

            <!-- Edit -->
            <div v-else class="flex items-center gap-1">
              <select
                v-model="editValue"
                class="flex-1 bg-input text-foreground border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option value="">Unassigned</option>
                <option
                  v-for="member in projectDetail?.members"
                  :key="member.user.id"
                  :value="member.user.id"
                >
                  {{ member.user.firstName }} {{ member.user.lastName }}
                </option>
              </select>
              <AppButton
                size="icon"
                variant="primary"
                class="w-7 h-7 shrink-0"
                :loading="isUpdating"
                @click="saveField('assignee')"
              >
                <Check class="w-3.5 h-3.5" />
              </AppButton>
              <AppButton
                size="icon"
                variant="ghost"
                class="w-7 h-7 shrink-0"
                @click="cancelEdit"
              >
                <X class="w-3.5 h-3.5" />
              </AppButton>
            </div>
          </div>

          <!-- Reporter — read only -->
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">
              Reporter
            </p>
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-semibold text-muted-foreground"
              >
                {{
                  getInitials(
                    ticketDetail.reporter.firstName,
                    ticketDetail.reporter.lastName,
                  )
                }}
              </div>
              <span class="text-sm text-foreground">
                {{ ticketDetail.reporter.firstName }}
                {{ ticketDetail.reporter.lastName }}
              </span>
            </div>
          </div>
        </div>

        <div class="divider" />

        <!-- ── Comments ── -->
        <div>
          <p class="text-xs font-medium text-muted-foreground mb-3">
            Comments ({{ ticketDetail.comments?.length ?? 0 }})
          </p>

          <div class="flex flex-col gap-3 mb-4">
            <div
              v-for="comment in ticketDetail.comments"
              :key="comment.id"
              class="flex flex-col gap-1"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div
                    class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold"
                  >
                    {{
                      getInitials(
                        comment.author.firstName,
                        comment.author.lastName,
                      )
                    }}
                  </div>
                  <span class="text-xs font-medium text-foreground">
                    {{ comment.author.firstName }} {{ comment.author.lastName }}
                  </span>
                  <span class="text-[11px] text-muted-foreground">
                    {{ formatDate(comment.createdAt) }}
                    <span v-if="comment.isEdited" class="italic">
                      · edited</span
                    >
                  </span>
                </div>

                <div
                  v-if="isMyComment(comment.authorId)"
                  class="flex items-center gap-1"
                >
                  <AppButton
                    variant="ghost"
                    size="icon"
                    class="w-6 h-6"
                    @click="startEditComment(comment.id, comment.body)"
                  >
                    <Pencil class="w-3 h-3" />
                  </AppButton>
                  <AppButton
                    variant="danger"
                    size="icon"
                    class="w-6 h-6"
                    @click="removeComment(comment.id)"
                  >
                    <X class="w-3 h-3" />
                  </AppButton>
                </div>
              </div>

              <!-- Comment edit -->
              <div
                v-if="editingCommentId === comment.id"
                class="flex gap-2 pl-7"
              >
                <textarea
                  v-model="editingCommentBody"
                  rows="2"
                  class="flex-1 bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
                  @keydown.escape="cancelEditComment"
                />
                <div class="flex flex-col gap-1">
                  <AppButton
                    size="icon"
                    variant="primary"
                    class="w-7 h-7"
                    @click="submitEditComment(comment.id)"
                  >
                    <Check class="w-3.5 h-3.5" />
                  </AppButton>
                  <AppButton
                    size="icon"
                    variant="ghost"
                    class="w-7 h-7"
                    @click="cancelEditComment"
                  >
                    <X class="w-3.5 h-3.5" />
                  </AppButton>
                </div>
              </div>
              <p v-else class="text-sm text-foreground pl-7 leading-relaxed">
                {{ comment.body }}
              </p>
            </div>

            <p
              v-if="!ticketDetail.comments?.length"
              class="text-sm text-muted-foreground pl-1"
            >
              No comments yet. Be the first.
            </p>
          </div>

          <!-- Add comment -->
          <div class="flex gap-2">
            <textarea
              v-model="commentBody"
              placeholder="Write a comment..."
              rows="2"
              class="flex-1 bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
              @keydown.ctrl.enter="handleAddComment"
            />
            <AppButton
              variant="primary"
              size="icon"
              :loading="isAdding"
              class="self-end"
              @click="handleAddComment"
            >
              <Send class="w-4 h-4" />
            </AppButton>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">
            Ctrl + Enter to submit
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <AppButton variant="danger" @click="showDeleteConfirm = true">
        <Trash2 class="w-4 h-4" />
        Delete ticket
      </AppButton>
    </template>
  </AppModal>

  <AppConfirmModal
    v-if="showDeleteConfirm"
    title="Delete ticket"
    :description="`Are you sure you want to delete '${ticket.title}'? This cannot be undone.`"
    confirm-label="Delete ticket"
    :loading="false"
    @confirm="handleDeleteConfirm"
    @cancel="showDeleteConfirm = false"
  />
</template>
