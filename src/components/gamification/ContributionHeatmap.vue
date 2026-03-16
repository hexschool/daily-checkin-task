<script setup lang="ts">
import { computed } from 'vue'
import type { DailyStat } from '@/types/checkin'

const props = defineProps<{
  dailyStats: DailyStat[]
  checkinStatus?: Record<string, boolean> // 個人模式：只顯示已打卡/未打卡
  clickable?: boolean
}>()

const emit = defineEmits<{
  dayClick: [dayLabel: string]
}>()

// 將 dailyStats 按週排列成 GitHub 風格的網格
// 每列一週（7天），從最早的日期開始
interface HeatmapCell {
  dayLabel: string
  date: string
  dayOfWeek: number // 0=Sun, 6=Sat
  weekIndex: number
  intensity: number // 0-4
  count: number
  checkedIn?: boolean
}

const cells = computed<HeatmapCell[]>(() => {
  if (!props.dailyStats.length) return []

  const maxCount = Math.max(...props.dailyStats.map(s => s.checkinCount), 1)

  // 按日期排序
  const sorted = [...props.dailyStats].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstDate = new Date(sorted[0]!.date)
  // 找到第一天所在那週的週日
  const startOfFirstWeek = new Date(firstDate)
  startOfFirstWeek.setDate(startOfFirstWeek.getDate() - firstDate.getDay())

  return sorted.map(stat => {
    const date = new Date(stat.date)
    const dayOfWeek = date.getDay()
    const diffDays = Math.floor(
      (date.getTime() - startOfFirstWeek.getTime()) / (1000 * 60 * 60 * 24)
    )
    const weekIndex = Math.floor(diffDays / 7)

    let intensity = 0
    if (props.checkinStatus) {
      // 個人模式：二元
      intensity = props.checkinStatus[stat.dayLabel] ? 4 : 0
    } else {
      // 全局模式：依打卡人數
      const ratio = stat.checkinCount / maxCount
      if (ratio > 0.75) intensity = 4
      else if (ratio > 0.5) intensity = 3
      else if (ratio > 0.25) intensity = 2
      else if (ratio > 0) intensity = 1
    }

    return {
      dayLabel: stat.dayLabel,
      date: stat.date,
      dayOfWeek,
      weekIndex,
      intensity,
      count: stat.checkinCount,
      checkedIn: props.checkinStatus?.[stat.dayLabel],
    }
  })
})

const totalWeeks = computed(() => {
  if (!cells.value.length) return 0
  return Math.max(...cells.value.map(c => c.weekIndex)) + 1
})

const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六']

function getIntensityClass(intensity: number): string {
  switch (intensity) {
    case 0: return 'bg-slate-100 dark:bg-slate-800'
    case 1: return 'bg-emerald-200 dark:bg-emerald-900'
    case 2: return 'bg-emerald-300 dark:bg-emerald-700'
    case 3: return 'bg-emerald-400 dark:bg-emerald-600'
    case 4: return 'bg-emerald-500 dark:bg-emerald-500'
    default: return 'bg-slate-100 dark:bg-slate-800'
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

function handleClick(cell: HeatmapCell) {
  if (props.clickable) {
    emit('dayClick', cell.dayLabel)
  }
}
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
    <div class="overflow-x-auto pb-2">
      <div class="inline-flex gap-1">
        <!-- Week day labels -->
        <div class="flex flex-col gap-1 pr-2">
          <div
            v-for="(label, i) in weekDayLabels"
            :key="i"
            class="flex h-4 w-6 items-center justify-end text-xs text-slate-400 dark:text-slate-500"
            :class="i % 2 === 0 ? 'visible' : 'invisible'"
          >
            {{ label }}
          </div>
        </div>

        <!-- Grid columns (weeks) -->
        <div
          v-for="week in totalWeeks"
          :key="week"
          class="flex flex-col gap-1"
        >
          <template v-for="day in 7" :key="`${week}-${day}`">
            <div
              v-if="cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)"
              class="group relative h-4 w-4 rounded-sm transition-transform"
              :class="[
                getIntensityClass(cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)!.intensity),
                clickable ? 'cursor-pointer hover:scale-125' : '',
              ]"
              @click="handleClick(cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)!)"
            >
              <!-- Tooltip -->
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700"
              >
                {{ cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)!.dayLabel }}
                · {{ formatDate(cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)!.date) }}
                <template v-if="checkinStatus">
                  · {{ cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)!.checkedIn ? '✓ 已打卡' : '✗ 未打卡' }}
                </template>
                <template v-else>
                  · {{ cells.find(c => c.weekIndex === week - 1 && c.dayOfWeek === day - 1)!.count }} 人
                </template>
              </div>
            </div>
            <div v-else class="h-4 w-4"></div>
          </template>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span>少</span>
      <div class="flex gap-1">
        <div class="h-3 w-3 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
        <div class="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900"></div>
        <div class="h-3 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700"></div>
        <div class="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-600"></div>
        <div class="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-500"></div>
      </div>
      <span>多</span>
    </div>
  </div>
</template>
