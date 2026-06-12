<script setup lang="ts">
import TopNavBar from './TopNavBar.vue'

// 換頁捲回頂部由 router 的 scrollBehavior 統一處理（見 router/index.ts）
</script>

<template>
  <div class="min-h-screen">
    <TopNavBar />
    <main class="mx-auto max-w-5xl px-5 pb-24 pt-24 sm:px-6">
      <slot />
    </main>
  </div>
</template>
