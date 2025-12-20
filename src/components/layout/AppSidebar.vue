<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useCheckinStore } from '@/stores/checkin'
import { useSidebarStore } from '@/stores/sidebar'

const route = useRoute()
const themeStore = useThemeStore()
const checkinStore = useCheckinStore()
const sidebarStore = useSidebarStore()
const scheduleId = computed(() => route.params.scheduleId as string)

// 取得最近一天的討論串連結（移除最後的 messageId 參數）
const latestThreadUrl = computed(() => {
  const stats = checkinStore.scheduleStats?.dailyStats
  if (!stats || stats.length === 0) return null
  const latestDay = stats[stats.length - 1]
  if (!latestDay?.threadUrl) return null
  // 移除最後一個參數（messageId），只保留 channel 連結
  const parts = latestDay.threadUrl.split('/')
  if (parts.length > 1) {
    parts.pop()
    return parts.join('/')
  }
  return latestDay.threadUrl
})

const menuItems = computed(() => [
  {
    name: 'Dashboard',
    icon: 'bi-grid-1x2-fill',
    to: { name: 'dashboard', params: { scheduleId: scheduleId.value } },
  },
  {
    name: '打卡進度',
    icon: 'bi-table',
    to: { name: 'progress', params: { scheduleId: scheduleId.value } },
  },
  {
    name: '參與者',
    icon: 'bi-people-fill',
    to: { name: 'users', params: { scheduleId: scheduleId.value } },
  },
])

function isActive(to: { name: string }) {
  return route.name === to.name
}
</script>

<template>
  <Transition name="slide">
    <aside
      v-show="sidebarStore.isOpen"
      class="fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:static lg:!flex"
      :class="{ '!flex': sidebarStore.isOpen }"
    >
      <!-- Header with close button on mobile -->
      <div class="flex items-center justify-between px-6 py-8">
        <div class="flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30"
          >
            <i class="bi bi-calendar2-check text-xl text-white"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-800 dark:text-white">每日打卡</h1>
            <p class="text-xs text-slate-400">Daily Check-in</p>
          </div>
        </div>
        <!-- Close button (mobile only) -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
          @click="sidebarStore.close()"
          aria-label="關閉選單"
        >
          <i class="bi bi-x-lg text-xl"></i>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4">
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.name">
            <RouterLink
              :to="item.to"
              class="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
              :class="
                isActive(item.to)
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              "
            >
              <i
                :class="[
                  'bi',
                  item.icon,
                  'text-lg transition-transform duration-200',
                  isActive(item.to) ? '' : 'group-hover:scale-110',
                ]"
              ></i>
              {{ item.name }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Theme Toggle -->
      <div class="px-4 pb-2">
        <button
          class="flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="themeStore.toggleTheme()"
        >
          <span class="flex items-center gap-3">
            <i :class="['bi text-lg', themeStore.theme === 'dark' ? 'bi-moon-fill' : 'bi-sun-fill']"></i>
            {{ themeStore.theme === 'dark' ? '深色模式' : '淺色模式' }}
          </span>
          <div class="relative h-6 w-11 rounded-full bg-slate-300 transition-colors dark:bg-violet-600">
            <div
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
              :class="themeStore.theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'"
            ></div>
          </div>
        </button>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-200 p-4 dark:border-slate-700">
        <a
          v-if="latestThreadUrl"
          :href="latestThreadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="block rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 p-4 transition-all hover:from-violet-100 hover:to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 dark:hover:from-violet-900/50 dark:hover:to-indigo-900/50"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-800">
              <i class="bi bi-discord text-lg text-violet-600 dark:text-violet-300"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Discord 社群</p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">查看打卡討論</p>
            </div>
            <i class="bi bi-arrow-up-right text-slate-400"></i>
          </div>
        </a>
        <div
          v-else
          class="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 p-4 dark:from-violet-900/30 dark:to-indigo-900/30"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-800">
              <i class="bi bi-discord text-lg text-violet-600 dark:text-violet-300"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Discord 社群</p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">查看打卡討論</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
/* 桌面版始終顯示 */
@media (min-width: 1024px) {
  aside {
    display: flex !important;
    transform: none !important;
  }
}

/* 行動版滑入動畫 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
