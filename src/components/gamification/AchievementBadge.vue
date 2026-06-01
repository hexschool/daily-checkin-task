<script setup lang="ts">
import type { Achievement } from '@/types/checkin'

defineProps<{
  achievement: Achievement
}>()

// 階級僅以外框粗細區分視覺份量，色彩一律萊姆綠（解鎖）／中性灰（未解鎖）
const tierRingWidth = {
  bronze: 'border',
  silver: 'border',
  gold: 'border-2',
  diamond: 'border-2',
}
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 p-3 transition-all"
    :class="achievement.unlocked ? 'opacity-100' : 'opacity-45'"
  >
    <div
      class="flex h-12 w-12 items-center justify-center"
      :class="[
        tierRingWidth[achievement.tier],
        achievement.unlocked
          ? 'border-acc bg-[color-mix(in_srgb,var(--color-acc)_14%,transparent)] text-acc shadow-[0_0_9px_color-mix(in_srgb,var(--color-acc)_35%,transparent)]'
          : 'border-edge bg-surface text-muted',
      ]"
    >
      <i v-if="achievement.unlocked" :class="['bi', achievement.icon, 'text-xl']"></i>
      <i v-else class="bi bi-lock text-lg"></i>
    </div>
    <div class="text-center">
      <p
        class="text-[15px] font-bold"
        :class="achievement.unlocked ? 'text-ink' : 'text-muted'"
      >
        {{ achievement.title }}
      </p>
      <p class="text-[15px] text-muted">
        {{ achievement.description }}
      </p>
    </div>
  </div>
</template>
