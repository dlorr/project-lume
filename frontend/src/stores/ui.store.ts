import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * UI store — owns global UI state.
 * Things that don't belong to any specific feature
 * but need to be shared across the layout.
 */
export const useUIStore = defineStore("ui", () => {
  const sidebarOpen = ref(true);
  const activeModal = ref<string | null>(null);
  const isDark = ref(false);

  function initTheme() {
    // Read saved preference or system default
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    isDark.value = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark.value);

    sidebarOpen.value = window.innerWidth >= 1024;
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function openModal(name: string) {
    activeModal.value = name;
  }

  function closeModal() {
    activeModal.value = null;
  }

  return {
    sidebarOpen,
    activeModal,
    isDark,
    initTheme,
    toggleTheme,
    toggleSidebar,
    openModal,
    closeModal,
  };
});
