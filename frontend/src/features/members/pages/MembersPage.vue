<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMembers } from "@/features/members/composables/useMembers";
import { useAuthStore } from "@/stores/auth.store";
import { getInitials } from "@/utils/ticket.utils";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppSpinner from "@/components/ui/AppSpinner.vue";
import { UserPlus, Trash2 } from "lucide-vue-next";
import { ArrowLeft } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const projectId = route.params.projectId as string;

const { projectDetail, isLoading, inviteMember, isInviting, removeMember } =
  useMembers(projectId);

const inviteEmail = ref("");
const inviteRole = ref<"ADMIN" | "MEMBER">("MEMBER");

async function handleInvite() {
  if (!inviteEmail.value.trim()) return;
  await inviteMember({
    email: inviteEmail.value.trim(),
    role: inviteRole.value,
  });
  inviteEmail.value = "";
}

async function handleRemove(memberId: string, fullName: string) {
  if (!confirm(`Remove ${fullName} from this project?`)) return;
  await removeMember(memberId);
}

const roleBadgeClass: Record<string, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-violet-500/10 text-violet-600",
  MEMBER: "bg-muted text-muted-foreground",
};
</script>

<template>
  <div class="max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <AppButton
        variant="ghost"
        size="icon"
        @click="router.push({ name: 'board', params: { projectId } })"
      >
        <ArrowLeft class="w-4 h-4" />
      </AppButton>
      <div>
        <h1 class="page-title">Members</h1>
        <p class="page-subtitle">
          {{ projectDetail?.members?.length ?? 0 }}
          {{
            (projectDetail?.members?.length ?? 0) === 1 ? "member" : "members"
          }}
        </p>
      </div>
    </div>

    <!-- Invite form -->
    <div class="card p-5 flex flex-col gap-4 mb-4">
      <h2 class="text-sm font-semibold text-foreground">Invite member</h2>

      <div class="flex flex-col sm:flex-row gap-3">
        <AppInput
          v-model="inviteEmail"
          placeholder="colleague@example.com"
          type="email"
          class="flex-1"
          @keydown.enter="handleInvite"
        />

        <select
          v-model="inviteRole"
          class="bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-150"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>

        <AppButton
          variant="primary"
          :loading="isInviting"
          class="shrink-0"
          @click="handleInvite"
        >
          <UserPlus class="w-4 h-4" />
          Invite
        </AppButton>
      </div>
    </div>

    <!-- Members list -->
    <div class="card overflow-hidden">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-10">
        <AppSpinner />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!projectDetail?.members?.length"
        class="py-10 text-center text-sm text-muted-foreground"
      >
        No members found.
      </div>

      <!-- List -->
      <div
        v-for="member in projectDetail?.members"
        :key="member.id"
        class="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border last:border-0"
      >
        <!-- Avatar + info -->
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0"
          >
            {{ getInitials(member.user.firstName, member.user.lastName) }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ member.user.firstName }} {{ member.user.lastName }}
              <span
                v-if="member.user.id === authStore.user?.id"
                class="text-xs text-muted-foreground font-normal ml-1"
              >
                (you)
              </span>
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {{ member.user.email }}
            </p>
          </div>
        </div>

        <!-- Role + actions -->
        <div class="flex items-center gap-2 shrink-0">
          <span :class="['badge', roleBadgeClass[member.role]]">
            {{ member.role.toLowerCase() }}
          </span>

          <!-- Can't remove yourself or the owner -->
          <AppButton
            v-if="
              member.role !== 'OWNER' && member.user.id !== authStore.user?.id
            "
            variant="danger"
            size="icon"
            class="w-7 h-7"
            @click="
              handleRemove(
                member.id,
                `${member.user.firstName} ${member.user.lastName}`,
              )
            "
          >
            <Trash2 class="w-3.5 h-3.5" />
          </AppButton>

          <!-- Spacer to keep layout consistent when no button -->
          <div v-else class="w-7" />
        </div>
      </div>
    </div>
  </div>
</template>
