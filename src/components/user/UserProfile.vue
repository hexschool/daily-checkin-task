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
  <div class="border-2 border-ink bg-surface p-6 shadow-[7px_7px_0_var(--color-acc)]">
    <div class="flex items-center gap-5">
      <img
        :src="user.avatarUrl || defaultAvatar"
        :alt="user.displayName"
        class="h-20 w-20 shrink-0 rounded-full border-2 border-acc object-cover"
      />
      <div class="min-w-0">
        <h2 class="truncate text-2xl font-bold text-ink">{{ user.displayName }}</h2>
        <p class="truncate text-[15px] text-muted">@{{ user.username }}</p>
      </div>
    </div>
    <div class="mt-6 grid grid-cols-2 gap-3">
      <div class="border border-edge bg-panel p-4 text-center">
        <p class="font-pixel text-3xl text-acc">{{ user.totalCheckinDays }}</p>
        <p class="mt-2 text-[15px] font-semibold text-muted">打卡天數</p>
      </div>
      <div class="border border-edge bg-panel p-4 text-center">
        <p class="font-pixel text-3xl text-acc">{{ completionRate }}%</p>
        <p class="mt-2 text-[15px] font-semibold text-muted">完成率</p>
      </div>
    </div>
  </div>
</template>
