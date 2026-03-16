<script setup lang="ts">
import type { Achievement } from '@/types/checkin'

defineProps<{
  achievement: Achievement
}>()

const tierColors = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-300 dark:ring-amber-700',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-700/60',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-300 dark:ring-slate-600',
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-700 dark:text-yellow-300',
    ring: 'ring-yellow-400 dark:ring-yellow-700',
  },
  diamond: {
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-600 dark:text-violet-300',
    ring: 'ring-violet-400 dark:ring-violet-700',
  },
}
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 rounded-xl p-3 transition-all"
    :class="achievement.unlocked ? 'opacity-100' : 'opacity-40 grayscale'"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full ring-2"
      :class="[
        tierColors[achievement.tier].bg,
        tierColors[achievement.tier].ring,
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
