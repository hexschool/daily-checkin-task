<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { DailyStat } from '@/types/checkin'

defineProps<{
  dailyStats: DailyStat[]
  scheduleId: string
}>()

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="rounded-lg bg-white p-4 shadow">
    <h3 class="mb-4 text-lg font-semibold">每日打卡統計</h3>
    <div class="space-y-2">
      <RouterLink
        v-for="day in dailyStats"
        :key="day.dayLabel"
        :to="{ name: 'day-detail', params: { scheduleId, dayLabel: day.dayLabel } }"
        class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
      >
        <div>
          <span class="font-medium">{{ day.dayLabel }}</span>
          <span class="ml-2 text-sm text-gray-500">{{ formatDate(day.date) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600">
            {{ day.checkinCount }} 人
          </span>
          <i class="bi bi-chevron-right text-gray-400"></i>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
