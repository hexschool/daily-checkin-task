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
  <div class="arcade-panel p-6">
    <div class="arcade-eyebrow mb-4">打卡記錄 · LOG</div>
    <div class="space-y-2.5">
      <RouterLink
        v-for="detail in details"
        :key="detail.dayLabel"
        :to="{ name: 'day-detail', params: { scheduleId, dayLabel: detail.dayLabel } }"
        class="flex items-center justify-between gap-3 border border-edge bg-surface p-3 transition-colors hover:border-acc"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center border"
            :class="detail.checkedIn ? 'border-acc text-acc' : 'border-edge text-muted'"
          >
            <i
              class="bi text-base"
              :class="detail.checkedIn ? 'bi-check-lg' : 'bi-calendar-event'"
            ></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span
                class="text-[15px] font-bold"
                :class="detail.checkedIn ? 'text-acc' : 'text-muted'"
              >
                {{ detail.dayLabel }}：
              </span>
              <span class="truncate text-[15px] text-ink">
                {{ detail.threadTitle }}
              </span>
            </div>
          </div>
        </div>
        <div class="ml-2 shrink-0 text-right">
          <span
            v-if="detail.checkedIn"
            class="text-[15px] text-muted"
          >
            {{ formatDateTime(detail.date, detail.checkinTime) }}
          </span>
          <span v-else class="text-[15px] text-muted">
            {{ formatDateTime(detail.date, null) }}
          </span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
