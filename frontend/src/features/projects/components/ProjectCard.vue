<script setup lang="ts">
import { useRouter } from "vue-router";
import { FolderKanban, Users, Ticket, ChevronRight } from "lucide-vue-next";
import type { ProjectWithMeta } from "@/types/project.types";

interface Props {
  project: ProjectWithMeta;
}

const props = defineProps<Props>();
const router = useRouter();

function goToBoard() {
  router.push({
    name: "board",
    params: { projectId: props.project.id },
  });
}

// Role badge color
const roleBadgeClass: Record<string, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-violet-500/10 text-violet-600",
  MEMBER: "bg-muted text-muted-foreground",
};
</script>

<template>
  <div
    class="card card-hover p-5 flex flex-col gap-4 group cursor-pointer"
    @click="goToBoard"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <!-- Project icon -->
        <div
          class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
        >
          <FolderKanban class="w-4 h-4 text-primary" />
        </div>

        <div class="min-w-0">
          <h3
            class="text-sm font-semibold text-foreground truncate leading-tight"
          >
            {{ project.name }}
          </h3>
          <span class="text-xs text-muted-foreground font-mono">
            {{ project.key }}
          </span>
        </div>
      </div>

      <!-- Role badge + arrow -->
      <div class="flex items-center gap-2 shrink-0">
        <span
          :class="[
            'badge',
            roleBadgeClass[project.myRole] ?? roleBadgeClass.MEMBER,
          ]"
        >
          {{ project.myRole.toLowerCase() }}
        </span>
        <ChevronRight
          class="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors duration-150"
        />
      </div>
    </div>

    <!-- Description -->
    <p
      v-if="project.description"
      class="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
    >
      {{ project.description }}
    </p>

    <!-- Footer stats -->
    <div class="flex items-center gap-4 pt-1 border-t border-border">
      <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users class="w-3.5 h-3.5" />
        {{ project._count.members }}
        {{ project._count.members === 1 ? "member" : "members" }}
      </span>
      <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Ticket class="w-3.5 h-3.5" />
        {{ project._count.tickets }}
        {{ project._count.tickets === 1 ? "ticket" : "tickets" }}
      </span>
    </div>
  </div>
</template>
