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
  <div class="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
    <h3 class="mb-4 text-lg font-semibold text-white">打卡記錄</h3>
    <div class="space-y-2">
      <div
        v-for="detail in details"
        :key="detail.dayLabel"
        class="flex items-center justify-between rounded-xl p-3 transition-colors"
        :class="detail.checkedIn ? 'bg-emerald-500/10' : 'bg-white/5'"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg"
            :class="detail.checkedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'"
          >
            <i v-if="detail.checkedIn" class="bi bi-check-lg"></i>
            <i v-else class="bi bi-x-lg"></i>
          </div>
          <div>
            <RouterLink
              :to="{ name: 'day-detail', params: { scheduleId, dayLabel: detail.dayLabel } }"
              class="font-medium text-white hover:text-violet-400 transition-colors"
            >
              {{ detail.dayLabel }}
            </RouterLink>
            <p class="text-sm text-slate-500">{{ formatDate(detail.date) }}</p>
          </div>
        </div>
        <div class="text-right text-sm">
          <span v-if="detail.checkedIn" class="text-emerald-400">
            {{ formatTime(detail.checkinTime) }}
          </span>
          <span v-else class="text-slate-600">未打卡</span>
        </div>
      </div>
    </div>
  </div>
</template>
