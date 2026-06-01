<script setup lang="ts">
import type { DayDetail } from '@/types/checkin'

defineProps<{
  dayDetail: DayDetail
}>()

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <header
    class="border-2 border-ink bg-surface p-6 shadow-[7px_7px_0_var(--color-acc)] [animation:arcade-pop_.5s_.05s_cubic-bezier(.2,.9,.3,1.2)_both]"
  >
    <div class="text-[15px] font-bold tracking-[0.14em] text-muted">▶ DAY DETAIL</div>
    <div class="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="font-pixel text-3xl tracking-wide text-acc [text-shadow:0_0_20px_color-mix(in_srgb,var(--color-acc)_45%,transparent)]">
          {{ dayDetail.dayLabel }}
        </h1>
        <p class="mt-2 text-[15px] text-muted">{{ formatDate(dayDetail.date) }}</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="border border-edge bg-panel px-5 py-3 text-center">
          <p class="font-pixel text-2xl text-acc">{{ dayDetail.checkinCount }}</p>
          <p class="mt-1 text-[15px] text-muted">人已打卡</p>
        </div>
        <a
          :href="dayDetail.threadInfo.threadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="arcade-btn"
        >
          <i class="bi bi-discord text-lg"></i>
          前往討論串
        </a>
      </div>
    </div>
  </header>
</template>
