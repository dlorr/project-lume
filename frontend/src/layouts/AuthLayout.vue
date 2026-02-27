<script setup lang="ts">
const appName = import.meta.env.VITE_APP_NAME || "Project Lume";
const currentYear = new Date().getFullYear();
</script>

<template>
  <!--
    Single centered card on a textured background.
    No left/right panels — clean, focused, distinct.
  -->
  <div
    class="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden"
  >
    <!-- Background mesh gradient — gives depth without being distracting -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <!-- Top-left warm blob -->
      <div
        class="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.07]"
        style="background: radial-gradient(circle, #4c6ef5 0%, transparent 70%)"
      />
      <!-- Bottom-right cool blob -->
      <div
        class="absolute -bottom-32 -right-32 w-125 h-125 rounded-full opacity-[0.05]"
        style="background: radial-gradient(circle, #3b5bdb 0%, transparent 70%)"
      />
      <!-- Center subtle dot grid -->
      <div
        class="absolute inset-0 opacity-[0.025]"
        style="
          background-image: radial-gradient(
            circle,
            #3b5bdb 1px,
            transparent 1px
          );
          background-size: 28px 28px;
        "
      />
    </div>

    <!-- Logo + brand mark -->
    <div class="relative z-10 flex flex-col items-center mb-8">
      <!-- Logo icon -->
      <div
        class="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center shadow-lg"
        style="background: linear-gradient(135deg, #4c6ef5 0%, #3451c7 100%)"
      >
        <!-- Inline SVG — the L with rays, scaled down -->
        <svg
          width="28"
          height="28"
          viewBox="58 48 84 92"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="58"
            y="48"
            width="22"
            height="70"
            rx="6"
            fill="white"
            fill-opacity="0.95"
          />
          <rect
            x="58"
            y="96"
            width="56"
            height="19"
            rx="6"
            fill="white"
            fill-opacity="0.95"
          />
          <line
            x1="90"
            y1="58"
            x2="126"
            y2="42"
            stroke="white"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-opacity="0.65"
          />
          <line
            x1="90"
            y1="67"
            x2="130"
            y2="64"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-opacity="0.45"
          />
          <line
            x1="90"
            y1="76"
            x2="126"
            y2="88"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-opacity="0.28"
          />
          <circle cx="88" cy="58" r="5" fill="white" fill-opacity="0.9" />
        </svg>
      </div>

      <!-- Brand name -->
      <span
        class="text-xl font-bold text-foreground tracking-tight"
        style="font-family: var(--font-display)"
      >
        {{ appName }}
      </span>
      <span class="text-xs text-muted-foreground mt-0.5">
        Project management, simplified
      </span>
    </div>

    <!-- Auth card -->
    <div
      class="relative z-10 w-full max-w-105 bg-card border border-border rounded-2xl shadow-xl shadow-black/5 px-8 py-8"
    >
      <router-view />
    </div>

    <!-- Footer -->
    <p class="relative z-10 text-xs text-muted-foreground mt-6">
      © {{ currentYear }} {{ appName }}
    </p>
  </div>
</template>
