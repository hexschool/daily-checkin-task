<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { DayCheckinUser } from '@/types/checkin'

const props = defineProps<{
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
  <div class="rounded-lg bg-white p-4 shadow">
    <h3 class="mb-4 text-lg font-semibold">打卡名單</h3>
    <div v-if="users.length === 0" class="py-8 text-center text-gray-500">尚無打卡記錄</div>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="user in users"
        :key="user.discordUserId"
        :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
        class="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
      >
        <img
          :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
          :alt="user.displayName"
          class="h-10 w-10 rounded-full object-cover"
          loading="lazy"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">{{ user.displayName }}</p>
          <p class="text-xs text-gray-500">{{ formatTime(user.checkinTime) }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
