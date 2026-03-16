<script setup lang="ts">
import type { Achievement } from '@/types/checkin'
import AchievementBadge from './AchievementBadge.vue'

defineProps<{
  achievements: Achievement[]
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-semibold text-slate-800 dark:text-white">
        <i class="bi bi-award mr-2 text-violet-500"></i>
        成就
      </h3>
      <span class="text-sm text-slate-500 dark:text-slate-400">
        {{ achievements.filter(a => a.unlocked).length }} / {{ achievements.length }}
      </span>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-2">
      <AchievementBadge
        v-for="achievement in achievements"
        :key="achievement.id"
        :achievement="achievement"
        class="shrink-0"
      />
    </div>
  </div>
</template>
