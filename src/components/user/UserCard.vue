<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { UserCheckinItem } from '@/types/checkin'

const props = defineProps<{
  user: UserCheckinItem
  scheduleId: string
  totalDays?: number
}>()

const defaultAvatar = computed(() => {
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(props.user.discordUserId) % 5}.png`
})

const checkedDays = computed(() => {
  return Object.values(props.user.checkinStatus).filter(Boolean).length
})
</script>

<template>
  <RouterLink
    :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
    class="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
  >
    <img
      :src="user.avatarUrl || defaultAvatar"
      :alt="user.displayName"
      class="h-12 w-12 rounded-full object-cover"
      loading="lazy"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ user.displayName }}</p>
      <p class="truncate text-sm text-gray-500">@{{ user.username }}</p>
    </div>
    <div class="text-right">
      <p class="text-lg font-bold text-blue-600">{{ user.totalCheckinDays }}</p>
      <p class="text-xs text-gray-500">
        {{ totalDays ? `/ ${totalDays} 天` : '天' }}
      </p>
    </div>
  </RouterLink>
</template>
