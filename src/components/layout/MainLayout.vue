<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <div class="flex min-h-screen bg-slate-950">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <slot />
      </div>
    </main>
  </div>
</template>
