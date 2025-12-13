<script setup lang="ts">
import { computed } from 'vue'
import type { UserDetail } from '@/types/checkin'

const props = defineProps<{
  user: UserDetail
  totalDays?: number
}>()

const defaultAvatar = computed(() => {
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(props.user.discordUserId) % 5}.png`
})

const completionRate = computed(() => {
  if (!props.totalDays) return 0
  return Math.round((props.user.totalCheckinDays / props.totalDays) * 100)
})
</script>

<template>
  <div class="rounded-lg bg-white p-6 shadow">
    <div class="flex items-center gap-4">
      <img
        :src="user.avatarUrl || defaultAvatar"
        :alt="user.displayName"
        class="h-20 w-20 rounded-full object-cover"
      />
      <div>
        <h2 class="text-xl font-bold">{{ user.displayName }}</h2>
        <p class="text-gray-500">@{{ user.username }}</p>
      </div>
    </div>
    <div class="mt-6 grid grid-cols-2 gap-4">
      <div class="rounded-lg bg-blue-50 p-4 text-center">
        <p class="text-3xl font-bold text-blue-600">{{ user.totalCheckinDays }}</p>
        <p class="text-sm text-gray-600">打卡天數</p>
      </div>
      <div class="rounded-lg bg-green-50 p-4 text-center">
        <p class="text-3xl font-bold text-green-600">{{ completionRate }}%</p>
        <p class="text-sm text-gray-600">完成率</p>
      </div>
    </div>
  </div>
</template>
