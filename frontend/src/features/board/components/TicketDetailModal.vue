<script setup lang="ts">
import { ref, computed } from "vue";
import { Trash2, Send, Pencil, Check, X } from "lucide-vue-next";
import { useTicketDetail } from "../composables/useTicketDetail";
import { useTickets } from "../composables/useTickets";
import { useComments } from "../composables/useComments";
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
import type { Ticket } from "@/types/ticket.types";

interface Props {
  projectId: string;
  ticket: Ticket;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const authStore = useAuthStore();
const ticketId = ref(props.ticket.id);

const { data: ticketDetail, isLoading } = useTicketDetail(
  props.projectId,
  ticketId,
);
const { deleteTicket } = useTickets(props.projectId);
const { addComment, isAdding, editComment, removeComment } = useComments(
  props.projectId,
  props.ticket.id,
);

// Comment input
const commentBody = ref("");

// Edit comment state
const editingCommentId = ref<string | null>(null);
const editingBody = ref("");

const priority = computed(
  () => priorityConfig[ticketDetail.value?.priority ?? props.ticket.priority],
);
const type = computed(
  () => typeConfig[ticketDetail.value?.type ?? props.ticket.type],
);

async function handleAddComment() {
  if (!commentBody.value.trim()) return;
  await addComment(commentBody.value.trim());
  commentBody.value = "";
}

function startEdit(commentId: string, currentBody: string) {
  editingCommentId.value = commentId;
  editingBody.value = currentBody;
}

async function submitEdit(commentId: string) {
  if (!editingBody.value.trim()) return;
  await editComment({ commentId, body: editingBody.value.trim() });
  editingCommentId.value = null;
}

function cancelEdit() {
  editingCommentId.value = null;
  editingBody.value = "";
}

async function handleDelete() {
  if (!confirm("Delete this ticket? This cannot be undone.")) return;
  await deleteTicket(props.ticket.id);
  emit("close");
}

const isMyComment = (authorId: string) => authStore.user?.id === authorId;
</script>

<template>
  <AppModal
    :title="`${ticket.number} — ${ticket.title}`"
    max-width="max-w-2xl"
    @close="emit('close')"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <AppSpinner />
    </div>

    <template v-else-if="ticketDetail">
      <div class="flex flex-col gap-5">
        <!-- Meta row -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Type -->
          <span :class="['text-xs font-semibold', type.color]">
            {{ type.label }}
          </span>

          <span class="text-muted-foreground/40">·</span>

          <!-- Priority -->
          <span :class="['badge text-xs', priority.bg, priority.color]">
            {{ priority.label }}
          </span>

          <span class="text-muted-foreground/40">·</span>

          <!-- Dates -->
          <span class="text-xs text-muted-foreground">
            Created {{ formatDate(ticketDetail.createdAt) }}
          </span>
        </div>

        <!-- Description -->
        <div v-if="ticketDetail.description">
          <p class="text-xs font-medium text-muted-foreground mb-1.5">
            Description
          </p>
          <p
            class="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
          >
            {{ ticketDetail.description }}
          </p>
        </div>
        <p v-else class="text-sm text-muted-foreground italic">
          No description provided.
        </p>

        <!-- Assignee + Reporter -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">
              Assignee
            </p>
            <div v-if="ticketDetail.assignee" class="flex items-center gap-2">
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
            </div>
            <span v-else class="text-sm text-muted-foreground">Unassigned</span>
          </div>

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

        <!-- Comments -->
        <div>
          <p class="text-xs font-medium text-muted-foreground mb-3">
            Comments ({{ ticketDetail.comments?.length ?? 0 }})
          </p>

          <!-- Comment list -->
          <div class="flex flex-col gap-3 mb-4">
            <div
              v-for="comment in ticketDetail.comments"
              :key="comment.id"
              class="flex flex-col gap-1"
            >
              <!-- Author + date -->
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

                <!-- Edit/Delete actions — only for comment author -->
                <div
                  v-if="isMyComment(comment.authorId)"
                  class="flex items-center gap-1"
                >
                  <AppButton
                    variant="ghost"
                    size="icon"
                    class="w-6 h-6"
                    @click="startEdit(comment.id, comment.body)"
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

              <!-- Comment body or edit input -->
              <div
                v-if="editingCommentId === comment.id"
                class="flex gap-2 pl-7"
              >
                <textarea
                  v-model="editingBody"
                  rows="2"
                  class="flex-1 bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
                />
                <div class="flex flex-col gap-1">
                  <AppButton
                    size="icon"
                    variant="primary"
                    class="w-7 h-7"
                    @click="submitEdit(comment.id)"
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

          <!-- Add comment input -->
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
      <AppButton variant="danger" @click="handleDelete">
        <Trash2 class="w-4 h-4" />
        Delete ticket
      </AppButton>
    </template>
  </AppModal>
</template>
