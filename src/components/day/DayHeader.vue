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
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">{{ dayDetail.dayLabel }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ formatDate(dayDetail.date) }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="rounded-xl bg-violet-50 px-5 py-3 text-center dark:bg-violet-900/30">
          <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ dayDetail.checkinCount }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">人已打卡</p>
        </div>
        <a
          :href="dayDetail.threadInfo.threadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <i class="bi bi-discord text-lg"></i>
          <span class="font-medium">前往討論串</span>
        </a>
      </div>
    </div>
  </div>
</template>
