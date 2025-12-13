<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CheckinDetailItem } from '@/types/checkin'

defineProps<{
  details: CheckinDetailItem[]
  scheduleId: string
}>()

function formatDateTime(dateString: string, timeString: string | null) {
  const date = new Date(dateString)
  const dateStr = date.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  })

  if (!timeString) return dateStr

  const time = new Date(timeString)
  const timeStr = time.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${timeStr}`
}
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <h3 class="mb-4 text-lg font-semibold text-slate-800 dark:text-white">打卡記錄</h3>
    <div class="space-y-3">
      <RouterLink
        v-for="detail in details"
        :key="detail.dayLabel"
        :to="{ name: 'day-detail', params: { scheduleId, dayLabel: detail.dayLabel } }"
        class="flex items-center justify-between rounded-xl p-3 transition-colors"
        :class="
          detail.checkedIn
            ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700'
            : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50'
        "
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg"
            :class="
              detail.checkedIn
                ? 'bg-slate-200 dark:bg-slate-600'
                : 'bg-slate-100 dark:bg-slate-700'
            "
          >
            <i
              class="bi bi-calendar-event text-sm"
              :class="
                detail.checkedIn
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-400 dark:text-slate-500'
              "
            ></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1">
              <span
                class="text-sm font-medium"
                :class="
                  detail.checkedIn
                    ? 'text-slate-700 dark:text-slate-200'
                    : 'text-slate-500 dark:text-slate-400'
                "
              >
                {{ detail.dayLabel }}：
              </span>
              <span
                class="text-sm truncate"
                :class="
                  detail.checkedIn
                    ? 'text-slate-500 dark:text-slate-400'
                    : 'text-slate-400 dark:text-slate-500'
                "
              >
                {{ detail.threadTitle }}
              </span>
            </div>
          </div>
        </div>
        <div class="ml-2 flex-shrink-0 text-right">
          <span
            v-if="detail.checkedIn"
            class="text-sm text-slate-600 dark:text-slate-300"
          >
            {{ formatDateTime(detail.date, detail.checkinTime) }}
          </span>
          <span v-else class="text-sm text-slate-400 dark:text-slate-500">
            {{ formatDateTime(detail.date, null) }}
          </span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
