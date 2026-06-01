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
      class="flex h-10 w-10 shrink-0 items-center justify-center bg-acc font-pixel text-[15px] text-acc-ink shadow-[3px_3px_0_var(--color-acc-strong)]"
    >
      L{{ levelInfo.level }}
    </div>

    <!-- Progress bar + info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-[15px] font-bold text-ink">
          {{ levelInfo.title }}
        </span>
        <span class="font-pixel text-[15px] text-acc">
          {{ levelInfo.currentXP }} XP
        </span>
      </div>
      <div class="mt-1.5 h-2.5 overflow-hidden border border-edge bg-base">
        <div
          class="h-full bg-acc shadow-[0_0_9px_color-mix(in_srgb,var(--color-acc)_45%,transparent)] transition-all duration-500"
          :style="{ width: `${getProgressToNextLevel()}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
