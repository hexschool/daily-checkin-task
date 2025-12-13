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
  <div class="rounded-lg bg-white p-6 shadow">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ dayDetail.dayLabel }}</h1>
        <p class="text-gray-500">{{ formatDate(dayDetail.date) }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="rounded-lg bg-blue-50 px-4 py-2 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ dayDetail.checkinCount }}</p>
          <p class="text-sm text-gray-600">人已打卡</p>
        </div>
        <a
          :href="dayDetail.threadInfo.threadUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          <i class="bi bi-discord"></i>
          <span>前往討論串</span>
        </a>
      </div>
    </div>
  </div>
</template>
