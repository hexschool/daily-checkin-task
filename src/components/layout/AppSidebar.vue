<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const scheduleId = computed(() => route.params.scheduleId as string)

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
  <aside class="flex h-screen w-72 flex-col bg-gradient-to-b from-slate-900 to-slate-800">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-8">
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
        <i class="bi bi-calendar2-check text-xl text-white"></i>
      </div>
      <div>
        <h1 class="text-lg font-bold text-white">每日打卡</h1>
        <p class="text-xs text-slate-400">Daily Check-in</p>
      </div>
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
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
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

    <!-- Footer -->
    <div class="border-t border-white/10 p-4">
      <div class="rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <i class="bi bi-discord text-lg text-violet-400"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white">Discord 社群</p>
            <p class="truncate text-xs text-slate-400">查看打卡討論</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
