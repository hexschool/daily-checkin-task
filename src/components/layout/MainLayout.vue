<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebarStore = useSidebarStore()
const route = useRoute()

// 路由變化時關閉側欄（行動版）
watch(
  () => route.path,
  () => {
    sidebarStore.close()
  }
)
</script>

<template>
  <div class="flex min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Mobile Header -->
    <header
      class="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 lg:hidden"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30"
        >
          <i class="bi bi-calendar2-check text-white"></i>
        </div>
        <h1 class="text-lg font-bold text-slate-800 dark:text-white">每日打卡</h1>
      </div>
      <button
        class="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        @click="sidebarStore.toggle()"
        aria-label="開啟選單"
      >
        <i class="bi bi-list text-2xl"></i>
      </button>
    </header>

    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarStore.isOpen"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        @click="sidebarStore.close()"
      />
    </Transition>

    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto pt-16 lg:pt-0">
      <slot />
    </main>
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
