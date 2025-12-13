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
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div class="flex items-center gap-5">
      <img
        :src="user.avatarUrl || defaultAvatar"
        :alt="user.displayName"
        class="h-20 w-20 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-700"
      />
      <div>
        <h2 class="text-xl font-bold text-slate-800 dark:text-white">{{ user.displayName }}</h2>
        <p class="text-slate-500 dark:text-slate-400">@{{ user.username }}</p>
      </div>
    </div>
    <div class="mt-6 grid grid-cols-2 gap-4">
      <div class="rounded-xl bg-violet-50 p-4 text-center dark:bg-violet-900/30">
        <p class="text-3xl font-bold text-violet-600 dark:text-violet-400">{{ user.totalCheckinDays }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">打卡天數</p>
      </div>
      <div class="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/30">
        <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ completionRate }}%</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">完成率</p>
      </div>
    </div>
  </div>
</template>
