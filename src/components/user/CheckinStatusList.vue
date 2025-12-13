<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CheckinDetailItem } from '@/types/checkin'

defineProps<{
  details: CheckinDetailItem[]
  scheduleId: string
}>()

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  })
}

function formatTime(timeString: string | null) {
  if (!timeString) return '-'
  const date = new Date(timeString)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <h3 class="mb-4 text-lg font-semibold text-slate-800 dark:text-white">打卡記錄</h3>
    <div class="space-y-2">
      <div
        v-for="detail in details"
        :key="detail.dayLabel"
        class="flex items-center justify-between rounded-xl p-3 transition-colors"
        :class="detail.checkedIn ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-700/50'"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg"
            :class="detail.checkedIn ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'"
          >
            <i v-if="detail.checkedIn" class="bi bi-check-lg"></i>
            <i v-else class="bi bi-x-lg"></i>
          </div>
          <div>
            <RouterLink
              :to="{ name: 'day-detail', params: { scheduleId, dayLabel: detail.dayLabel } }"
              class="font-medium text-slate-800 hover:text-violet-600 transition-colors dark:text-white dark:hover:text-violet-400"
            >
              {{ detail.dayLabel }}
            </RouterLink>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ formatDate(detail.date) }}</p>
          </div>
        </div>
        <div class="text-right text-sm">
          <span v-if="detail.checkedIn" class="text-emerald-600 dark:text-emerald-400">
            {{ formatTime(detail.checkinTime) }}
          </span>
          <span v-else class="text-slate-400">未打卡</span>
        </div>
      </div>
    </div>
  </div>
</template>
