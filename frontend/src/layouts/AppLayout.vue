<script setup lang="ts">
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useAuth } from "@/features/auth/composables/useAuth";
import { Menu, FolderKanban, LogOut, Sun, Moon } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";

const uiStore = useUIStore();
const authStore = useAuthStore();

const { logout } = useAuth();

function handleNavClick() {
  if (window.innerWidth < 1024) {
    uiStore.sidebarOpen = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-background">
    <!-- Mobile backdrop -->
    <Transition name="fade">
      <div
        v-if="uiStore.sidebarOpen"
        class="fixed inset-0 bg-black/40 z-20 lg:hidden"
        @click="uiStore.toggleSidebar()"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col bg-sidebar border-r border-border transition-all duration-300 shrink-0',
        'fixed lg:static inset-y-0 left-0 z-30',
        uiStore.sidebarOpen ? 'w-60' : 'w-0 lg:w-16 overflow-hidden',
      ]"
    >
      <!-- Logo -->
      <div
        class="h-16 flex items-center px-4 border-b border-border shrink-0 gap-3"
      >
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style="background: linear-gradient(135deg, #4c6ef5 0%, #3451c7 100%)"
        >
          <svg width="16" height="16" viewBox="58 48 84 92" fill="none">
            <rect
              x="58"
              y="48"
              width="22"
              height="70"
              rx="5"
              fill="white"
              fill-opacity="0.95"
            />
            <rect
              x="58"
              y="96"
              width="56"
              height="19"
              rx="5"
              fill="white"
              fill-opacity="0.95"
            />
            <line
              x1="90"
              y1="58"
              x2="126"
              y2="42"
              stroke="white"
              stroke-width="4"
              stroke-linecap="round"
              stroke-opacity="0.7"
            />
            <line
              x1="90"
              y1="68"
              x2="130"
              y2="65"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-opacity="0.45"
            />
            <circle cx="88" cy="58" r="5" fill="white" fill-opacity="0.9" />
          </svg>
        </div>
        <span
          v-if="uiStore.sidebarOpen"
          class="text-foreground font-bold text-base tracking-tight truncate"
          style="font-family: var(--font-display)"
        >
          Project Lume
        </span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-3 space-y-0.5">
        <router-link to="/projects" class="nav-link" @click="handleNavClick">
          <FolderKanban class="w-4 h-4 shrink-0" />
          <span v-if="uiStore.sidebarOpen" class="truncate">Projects</span>
        </router-link>
      </nav>

      <!-- User + Logout -->
      <div class="p-3 border-t border-border">
        <div
          v-if="uiStore.sidebarOpen"
          class="flex items-center gap-3 px-3 py-2 mb-2 rounded-md bg-muted"
        >
          <div
            class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0"
          >
            {{ authStore.user?.firstName?.[0]
            }}{{ authStore.user?.lastName?.[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-foreground truncate leading-tight"
            >
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {{ authStore.user?.email }}
            </p>
          </div>
        </div>

        <div v-else class="flex justify-center py-1 mb-2">
          <div
            class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold"
          >
            {{ authStore.user?.firstName?.[0]
            }}{{ authStore.user?.lastName?.[0] }}
          </div>
        </div>

        <AppButton variant="ghost" size="sm" :full-width="true" @click="logout">
          <LogOut class="w-3.5 h-3.5 shrink-0" />
          <span v-if="uiStore.sidebarOpen">Sign out</span>
        </AppButton>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header
        class="h-16 bg-topbar border-b border-border flex items-center px-4 gap-3 shrink-0"
      >
        <AppButton
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          @click="uiStore.toggleSidebar()"
        >
          <Menu class="w-4 h-4" />
        </AppButton>

        <div class="flex-1 min-w-0">
          <slot name="topbar" />
        </div>

        <!-- Theme toggle -->
        <AppButton
          variant="ghost"
          size="icon"
          :aria-label="
            uiStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'
          "
          @click="uiStore.toggleTheme()"
        >
          <Sun v-if="uiStore.isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </AppButton>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
