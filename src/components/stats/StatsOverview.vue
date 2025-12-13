<script setup lang="ts">
import type { ScheduleStats } from '@/types/checkin'

defineProps<{
  stats: ScheduleStats
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
    <div class="rounded-lg bg-white p-4 shadow">
      <p class="text-sm text-gray-500">總打卡次數</p>
      <p class="text-2xl font-bold text-blue-600">{{ stats.totalCheckins }}</p>
    </div>
    <div class="rounded-lg bg-white p-4 shadow">
      <p class="text-sm text-gray-500">參與人數</p>
      <p class="text-2xl font-bold text-green-600">{{ stats.uniqueUsers }}</p>
    </div>
    <div class="rounded-lg bg-white p-4 shadow">
      <p class="text-sm text-gray-500">已發佈天數</p>
      <p class="text-2xl font-bold text-purple-600">
        {{ stats.dailyTasks }} / {{ stats.expectedTasks }}
      </p>
    </div>
    <div class="rounded-lg bg-white p-4 shadow">
      <p class="text-sm text-gray-500">進度</p>
      <p class="text-2xl font-bold text-orange-600">{{ stats.progress }}%</p>
    </div>
  </div>
</template>
