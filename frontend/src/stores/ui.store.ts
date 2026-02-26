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
    toggleSidebar,
    openModal,
    closeModal,
  };
});
