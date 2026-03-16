<script setup lang="ts">
import type { LevelInfo } from '@/types/checkin'

const props = defineProps<{
  levelInfo: LevelInfo
}>()

// 計算到下一級的進度百分比
const THRESHOLDS = [0, 15, 35, 55, 80, 100]

function getProgressToNextLevel(): number {
  const currentIdx = props.levelInfo.level - 1
  if (currentIdx >= THRESHOLDS.length - 1) return 100 // 已滿級

  const currentMin = THRESHOLDS[currentIdx] ?? 0
  const nextMin = THRESHOLDS[currentIdx + 1] ?? 100
  const range = nextMin - currentMin
  if (range <= 0) return 100

  const progress = ((props.levelInfo.completionRate - currentMin) / range) * 100
  return Math.min(100, Math.max(0, progress))
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Level badge -->
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25"
    >
      L{{ levelInfo.level }}
    </div>

    <!-- Progress bar + info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between">
        <span class="text-sm font-semibold text-slate-800 dark:text-white">
          {{ levelInfo.title }}
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          {{ levelInfo.currentXP }} XP
        </span>
      </div>
      <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          class="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          :style="{ width: `${getProgressToNextLevel()}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
