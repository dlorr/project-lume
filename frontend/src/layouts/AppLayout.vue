<script setup lang="ts">
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";
import { authApi } from "@/api/modules/auth.api";
import { Menu, FolderKanban, LogOut } from "lucide-vue-next";

const uiStore = useUIStore();
const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  try {
    await authApi.logout();
  } finally {
    authStore.clearUser();
    router.push({ name: "login" });
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-background">
    <!-- ── Sidebar ── -->
    <aside
      :class="[
        'flex flex-col bg-sidebar border-r border-border transition-all duration-300 shrink-0',
        uiStore.sidebarOpen ? 'w-60' : 'w-16',
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-4 border-b border-border shrink-0">
        <span
          v-if="uiStore.sidebarOpen"
          class="text-foreground font-bold text-lg tracking-tight truncate"
        >
          Project Lume
        </span>
        <span v-else class="text-primary font-bold text-lg">T</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-3 space-y-1">
        <router-link to="/projects" class="nav-link">
          <FolderKanban class="w-5 h-5 shrink-0" />
          <span v-if="uiStore.sidebarOpen" class="truncate">Projects</span>
        </router-link>
      </nav>

      <!-- User + Logout -->
      <div class="p-3 border-t border-border">
        <!-- Expanded: name + email -->
        <div
          v-if="uiStore.sidebarOpen"
          class="flex items-center gap-3 px-3 py-2 mb-1"
        >
          <div
            class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0"
          >
            {{ authStore.user?.firstName?.[0]
            }}{{ authStore.user?.lastName?.[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {{ authStore.user?.email }}
            </p>
          </div>
        </div>

        <!-- Collapsed: avatar only -->
        <div v-else class="flex justify-center py-2 mb-1">
          <div
            class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold"
          >
            {{ authStore.user?.firstName?.[0]
            }}{{ authStore.user?.lastName?.[0] }}
          </div>
        </div>

        <button @click="handleLogout" class="btn btn-danger btn-sm w-full">
          <LogOut class="w-4 h-4 shrink-0" />
          <span v-if="uiStore.sidebarOpen">Logout</span>
        </button>
      </div>
    </aside>

    <!-- ── Main area ── -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header
        class="h-16 bg-topbar border-b border-border flex items-center px-4 gap-4 shrink-0"
      >
        <button
          @click="uiStore.toggleSidebar"
          class="btn btn-ghost btn-icon"
          aria-label="Toggle sidebar"
        >
          <Menu class="w-5 h-5" />
        </button>

        <div class="flex-1 min-w-0">
          <slot name="topbar" />
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
