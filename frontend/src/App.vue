<script setup lang="ts">
import { onMounted } from "vue";
import { useUIStore } from "@/stores/ui.store";
import AppToastContainer from "@/components/ui/AppToastContainer.vue";

const uiStore = useUIStore();

onMounted(() => uiStore.initTheme());
</script>

<template>
  <router-view />
  <AppToastContainer />
</template>
