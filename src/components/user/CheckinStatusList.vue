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
  <div class="rounded-lg bg-white p-4 shadow">
    <h3 class="mb-4 text-lg font-semibold">打卡記錄</h3>
    <div class="space-y-2">
      <div
        v-for="detail in details"
        :key="detail.dayLabel"
        class="flex items-center justify-between rounded-lg border p-3"
        :class="detail.checkedIn ? 'bg-green-50' : 'bg-gray-50'"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full"
            :class="detail.checkedIn ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'"
          >
            <svg
              v-if="detail.checkedIn"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <RouterLink
              :to="{ name: 'day-detail', params: { scheduleId, dayLabel: detail.dayLabel } }"
              class="font-medium hover:text-blue-600"
            >
              {{ detail.dayLabel }}
            </RouterLink>
            <p class="text-sm text-gray-500">{{ formatDate(detail.date) }}</p>
          </div>
        </div>
        <div class="text-right text-sm">
          <span v-if="detail.checkedIn" class="text-green-600">
            {{ formatTime(detail.checkinTime) }}
          </span>
          <span v-else class="text-gray-400">未打卡</span>
        </div>
      </div>
    </div>
  </div>
</template>
