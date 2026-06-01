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
  <section class="arcade-panel p-5">
    <div class="arcade-eyebrow mb-4">打卡名單 · ROSTER</div>
    <div v-if="users.length === 0" class="py-12 text-center">
      <div class="mb-4 flex justify-center">
        <div class="flex h-16 w-16 items-center justify-center border border-edge bg-surface">
          <i class="bi bi-people text-3xl text-muted"></i>
        </div>
      </div>
      <p class="text-[15px] text-muted">尚無打卡記錄</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="user in users"
        :key="user.discordUserId"
        :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
        class="group flex items-center gap-3 border border-edge bg-surface p-3 transition-all hover:translate-x-1 hover:border-acc"
      >
        <img
          :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
          :alt="user.displayName"
          class="h-10 w-10 rounded-full object-cover ring-2 ring-edge transition-all group-hover:ring-acc"
          loading="lazy"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-bold text-ink">{{ user.displayName }}</p>
          <p class="font-pixel text-[15px] text-muted">{{ formatTime(user.checkinTime) }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>
