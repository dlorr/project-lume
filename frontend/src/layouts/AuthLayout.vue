<script setup lang="ts">
const appName = import.meta.env.VITE_APP_NAME || "Project Lume";
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="min-h-screen flex bg-background">
    <!-- ── Left panel — branding ── -->
    <div
      class="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 bg-primary"
    >
      <span class="text-primary-foreground text-2xl font-bold tracking-tight">
        {{ appName }}
      </span>

      <div>
        <h1
          class="text-primary-foreground text-4xl xl:text-5xl font-bold leading-tight mb-4"
        >
          Ship faster.<br />Stay organized.
        </h1>
        <p class="text-primary-foreground/70 text-lg">
          Kanban boards for teams that move fast.
        </p>
      </div>

      <p class="text-primary-foreground/50 text-sm">
        © {{ currentYear }} {{ appName }}
      </p>
    </div>

    <!-- ── Right panel — form ── -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Mobile brand -->
        <div class="lg:hidden mb-8 text-center">
          <span class="text-foreground text-xl font-bold">{{ appName }}</span>
        </div>

        <router-view />
      </div>
    </div>
  </div>
</template>
