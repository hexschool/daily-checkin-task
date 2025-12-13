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
</script>

<template>
  <RouterLink
    :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
    class="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-600"
  >
    <img
      :src="user.avatarUrl || defaultAvatar"
      :alt="user.displayName"
      class="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100 transition-all group-hover:ring-violet-200 dark:ring-slate-700 dark:group-hover:ring-violet-500"
      loading="lazy"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-slate-800 dark:text-white">{{ user.displayName }}</p>
      <p class="truncate text-sm text-slate-500 dark:text-slate-400">@{{ user.username }}</p>
    </div>
    <div class="text-right">
      <p class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ user.totalCheckinDays }}</p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        {{ totalDays ? `/ ${totalDays} 天` : '天' }}
      </p>
    </div>
  </RouterLink>
</template>
