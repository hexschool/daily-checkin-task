<script setup lang="ts">
import type { Achievement } from '@/types/checkin'

defineProps<{
  achievement: Achievement
}>()

const tierColors = {
  bronze: {
    gradient: 'from-amber-200 to-orange-300 dark:from-amber-700 dark:to-orange-600',
    text: 'text-amber-800 dark:text-amber-200',
    ring: 'ring-amber-400 dark:ring-amber-600',
  },
  silver: {
    gradient: 'from-slate-200 to-blue-200 dark:from-slate-600 dark:to-blue-700',
    text: 'text-blue-700 dark:text-blue-200',
    ring: 'ring-blue-300 dark:ring-blue-600',
  },
  gold: {
    gradient: 'from-yellow-200 to-amber-300 dark:from-yellow-700 dark:to-amber-600',
    text: 'text-yellow-800 dark:text-yellow-200',
    ring: 'ring-yellow-400 dark:ring-yellow-600',
  },
  diamond: {
    gradient: 'from-violet-300 to-indigo-400 dark:from-violet-700 dark:to-indigo-600',
    text: 'text-violet-800 dark:text-violet-200',
    ring: 'ring-violet-400 dark:ring-violet-500',
  },
}

const tierRingWidth = {
  bronze: 'ring-2',
  silver: 'ring-2',
  gold: 'ring-3',
  diamond: 'ring-3',
}
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 rounded-xl p-3 transition-all"
    :class="achievement.unlocked ? 'opacity-100' : 'opacity-40 grayscale'"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br"
      :class="[
        tierColors[achievement.tier].gradient,
        tierColors[achievement.tier].ring,
        tierRingWidth[achievement.tier],
      ]"
    >
      <i
        v-if="achievement.unlocked"
        :class="['bi', achievement.icon, 'text-xl', tierColors[achievement.tier].text]"
      ></i>
      <i v-else class="bi bi-lock text-lg text-slate-400 dark:text-slate-500"></i>
    </div>
    <div class="text-center">
      <p
        class="text-xs font-semibold"
        :class="achievement.unlocked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'"
      >
        {{ achievement.title }}
      </p>
      <p class="text-xs text-slate-400 dark:text-slate-500">
        {{ achievement.description }}
      </p>
    </div>
  </div>
</template>
