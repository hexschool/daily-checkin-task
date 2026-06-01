<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

const scheduleId = computed(() => route.params.scheduleId as string)

const navItems = computed(() => [
  {
    name: '打卡日曆',
    icon: 'bi-calendar3',
    to: { name: 'calendar', params: { scheduleId: scheduleId.value } },
    routeNames: ['calendar', 'day-detail'],
  },
  {
    name: '我的旅程',
    icon: 'bi-rocket-takeoff-fill',
    to: { name: 'my-journey', params: { scheduleId: scheduleId.value } },
    routeNames: ['my-journey'],
  },
  {
    name: '我的追蹤',
    icon: 'bi-people-fill',
    to: { name: 'friends', params: { scheduleId: scheduleId.value } },
    routeNames: ['friends', 'user-detail'],
  },
  {
    name: '排行榜',
    icon: 'bi-trophy-fill',
    to: { name: 'leaderboard', params: { scheduleId: scheduleId.value } },
    routeNames: ['leaderboard'],
  },
])

function isActive(routeNames: string[]) {
  return routeNames.includes(route.name as string)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header
    class="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30"
        >
          <i class="bi bi-calendar2-check text-white"></i>
        </div>
        <span class="text-lg font-bold text-slate-800 dark:text-white">每日打卡</span>
      </div>

      <!-- Desktop Nav -->
      <nav class="hidden items-center gap-1 sm:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="
            isActive(item.routeNames)
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          "
        >
          <i :class="['bi', item.icon]"></i>
          {{ item.name }}
          <span
            v-if="isActive(item.routeNames)"
            class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-violet-600 dark:bg-violet-400"
          ></span>
        </RouterLink>
      </nav>

      <!-- Right: Theme + Mobile menu -->
      <div class="flex items-center gap-2">
        <!-- Theme toggle -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          @click="themeStore.toggleTheme()"
          :aria-label="themeStore.theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'"
        >
          <i :class="['bi text-lg', themeStore.theme === 'dark' ? 'bi-moon-fill' : 'bi-sun-fill']"></i>
        </button>

        <!-- Mobile menu button -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:hidden"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="切換選單"
        >
          <i :class="['bi text-xl', mobileMenuOpen ? 'bi-x-lg' : 'bi-list']"></i>
        </button>
      </div>
    </div>

    <!-- Mobile dropdown menu -->
    <Transition name="dropdown">
      <div
        v-if="mobileMenuOpen"
        class="border-t border-slate-200 bg-white px-4 pb-4 pt-2 dark:border-slate-700 dark:bg-slate-900 sm:hidden"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          :class="
            isActive(item.routeNames)
              ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          "
          @click="closeMobileMenu"
        >
          <i :class="['bi', item.icon, 'text-lg']"></i>
          {{ item.name }}
        </RouterLink>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
