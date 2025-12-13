<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { DayCheckinUser } from '@/types/checkin'

defineProps<{
  users: DayCheckinUser[]
  scheduleId: string
}>()

function getDefaultAvatar(userId: string) {
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`
}

function formatTime(timeString: string) {
  const date = new Date(timeString)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
    <h3 class="mb-4 text-lg font-semibold text-white">打卡名單</h3>
    <div v-if="users.length === 0" class="py-12 text-center">
      <div class="mb-4 flex justify-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <i class="bi bi-people text-3xl text-slate-600"></i>
        </div>
      </div>
      <p class="text-slate-400">尚無打卡記錄</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="user in users"
        :key="user.discordUserId"
        :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
        class="group flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10"
      >
        <img
          :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
          :alt="user.displayName"
          class="h-10 w-10 rounded-full object-cover ring-2 ring-white/10 transition-all group-hover:ring-violet-500/50"
          loading="lazy"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-white">{{ user.displayName }}</p>
          <p class="text-xs text-slate-500">{{ formatTime(user.checkinTime) }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
