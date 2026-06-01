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
  <div class="arcade-panel p-5">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="arcade-eyebrow">成就 · ACHIEVEMENTS</div>
      <span class="font-pixel text-[15px] text-acc">
        {{ unlockedCount }} / {{ achievements.length }}
      </span>
    </div>
    <div class="space-y-4">
      <div v-for="group in categoryGroups" :key="group.label">
        <p class="mb-2 flex items-center gap-1.5 text-[15px] font-bold text-muted">
          <i :class="['bi', group.icon, 'text-acc']"></i>
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
