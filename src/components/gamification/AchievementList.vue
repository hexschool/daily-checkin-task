<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement } from '@/types/checkin'
import AchievementBadge from './AchievementBadge.vue'

const props = defineProps<{
  achievements: Achievement[]
}>()

const categoryGroups = computed(() => [
  {
    label: '連續打卡',
    icon: 'bi-fire',
    items: props.achievements.filter(a => a.category === 'streak'),
  },
  {
    label: '完成率',
    icon: 'bi-bullseye',
    items: props.achievements.filter(a => a.category === 'completion'),
  },
])

const unlockedCount = computed(() => props.achievements.filter(a => a.unlocked).length)
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-semibold text-slate-800 dark:text-white">
        <i class="bi bi-award mr-2 text-violet-500"></i>
        成就
      </h3>
      <span class="text-sm text-slate-500 dark:text-slate-400">
        {{ unlockedCount }} / {{ achievements.length }}
      </span>
    </div>
    <div class="space-y-4">
      <div v-for="group in categoryGroups" :key="group.label">
        <p class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <i :class="['bi', group.icon, 'mr-1']"></i>
          {{ group.label }}
        </p>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <AchievementBadge
            v-for="achievement in group.items"
            :key="achievement.id"
            :achievement="achievement"
            class="shrink-0"
          />
        </div>
      </div>
    </div>
  </div>
</template>
