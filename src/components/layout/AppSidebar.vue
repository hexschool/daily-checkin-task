<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const scheduleId = computed(() => route.params.scheduleId as string)

const menuItems = computed(() => [
  {
    section: 'TRACK',
    items: [
      {
        name: 'Dashboard',
        icon: 'bi-bar-chart-line',
        to: { name: 'dashboard', params: { scheduleId: scheduleId.value } },
      },
      {
        name: '打卡進度追蹤',
        icon: 'bi-grid-3x3',
        to: { name: 'progress', params: { scheduleId: scheduleId.value } },
      },
    ],
  },
  {
    section: 'LIST',
    items: [
      {
        name: '每日任務列表',
        icon: 'bi-list-task',
        to: { name: 'users', params: { scheduleId: scheduleId.value } },
      },
    ],
  },
])

function isActive(to: { name: string }) {
  return route.name === to.name
}
</script>

<template>
  <aside class="flex h-screen w-64 flex-col bg-slate-50 border-r border-slate-200">
    <!-- Logo / Title -->
    <div class="flex items-center gap-2 p-4 border-b border-slate-200">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
        <i class="bi bi-clipboard-check text-xl"></i>
      </div>
      <div>
        <p class="font-bold text-slate-800">每日任務</p>
        <p class="text-xs text-slate-500">儀表版</p>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-4">
      <template v-for="section in menuItems" :key="section.section">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {{ section.section }}
        </p>
        <ul class="mb-6 space-y-1">
          <li v-for="item in section.items" :key="item.name">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              :class="
                isActive(item.to)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              "
            >
              <i :class="['bi', item.icon, 'text-lg']"></i>
              {{ item.name }}
            </RouterLink>
          </li>
        </ul>
      </template>
    </nav>

    <!-- Collapse Button -->
    <div class="p-4 border-t border-slate-200">
      <button class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  </aside>
</template>
