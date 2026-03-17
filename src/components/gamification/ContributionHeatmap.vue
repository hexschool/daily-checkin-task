<script setup lang="ts">
import { computed } from 'vue'
import type { DailyStat } from '@/types/checkin'

const props = withDefaults(defineProps<{
  dailyStats: DailyStat[]
  checkinStatus?: Record<string, boolean>
  clickable?: boolean
  variant?: 'grid' | 'github' | 'strip'
  expectedTasks?: number
}>(), {
  variant: 'grid',
})

const emit = defineEmits<{
  dayClick: [dayLabel: string]
}>()

interface HeatmapCell {
  dayLabel: string
  dayNumber: number
  date: string
  dayOfWeek: number
  weekIndex: number
  intensity: number
  count: number
  checkedIn?: boolean
}

const cells = computed<HeatmapCell[]>(() => {
  if (!props.dailyStats.length) return []

  const maxCount = Math.max(...props.dailyStats.map(s => s.checkinCount), 1)

  const sorted = [...props.dailyStats].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstDate = new Date(sorted[0]!.date)
  const startOfFirstWeek = new Date(firstDate)
  startOfFirstWeek.setDate(startOfFirstWeek.getDate() - firstDate.getDay())

  return sorted.map((stat, index) => {
    const date = new Date(stat.date)
    const dayOfWeek = date.getDay()
    const diffDays = Math.floor(
      (date.getTime() - startOfFirstWeek.getTime()) / (1000 * 60 * 60 * 24)
    )
    const weekIndex = Math.floor(diffDays / 7)

    let intensity = 0
    if (props.checkinStatus) {
      intensity = props.checkinStatus[stat.dayLabel] ? 4 : 0
    } else {
      const ratio = stat.checkinCount / maxCount
      if (ratio > 0.75) intensity = 4
      else if (ratio > 0.5) intensity = 3
      else if (ratio > 0.25) intensity = 2
      else if (ratio > 0) intensity = 1
    }

    return {
      dayLabel: stat.dayLabel,
      dayNumber: index + 1,
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

function getIntensityTextClass(intensity: number): string {
  switch (intensity) {
    case 0: return 'text-slate-400 dark:text-slate-500'
    case 1: return 'text-emerald-700 dark:text-emerald-200'
    case 2: return 'text-emerald-800 dark:text-emerald-100'
    case 3: return 'text-white dark:text-emerald-100'
    case 4: return 'text-white'
    default: return 'text-slate-400 dark:text-slate-500'
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

function tooltipText(cell: HeatmapCell): string {
  let text = `${cell.dayLabel} · ${formatDate(cell.date)}`
  if (props.checkinStatus) {
    text += cell.checkedIn ? ' · ✓ 已打卡' : ' · ✗ 未打卡'
  } else {
    text += ` · ${cell.count} 人`
  }
  return text
}

function handleClick(cell: HeatmapCell) {
  if (props.clickable) {
    emit('dayClick', cell.dayLabel)
  }
}

// strip 模式：尚未發佈的天數
const futureDays = computed(() => {
  if (!props.expectedTasks) return []
  const published = cells.value.length
  const remaining = props.expectedTasks - published
  if (remaining <= 0) return []
  return Array.from({ length: remaining }, (_, i) => ({
    dayNumber: published + i + 1,
    dayLabel: `Day${published + i + 1}`,
  }))
})

function getGithubCell(weekIdx: number, dayIdx: number): HeatmapCell | undefined {
  return cells.value.find(c => c.weekIndex === weekIdx && c.dayOfWeek === dayIdx)
}
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">

    <!-- ===== Variant: grid（日卡片格子）===== -->
    <template v-if="variant === 'grid'">
      <div class="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-10">
        <div
          v-for="cell in cells"
          :key="cell.dayLabel"
          class="group relative flex aspect-square items-center justify-center rounded-lg transition-transform"
          :class="[
            getIntensityClass(cell.intensity),
            clickable ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-violet-400' : '',
          ]"
          @click="handleClick(cell)"
        >
          <span
            class="text-xs font-semibold"
            :class="getIntensityTextClass(cell.intensity)"
          >
            {{ cell.dayNumber }}
          </span>
          <!-- Tooltip -->
          <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
            {{ tooltipText(cell) }}
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Variant: github（放大版 GitHub）===== -->
    <template v-else-if="variant === 'github'">
      <div class="overflow-x-auto pb-2">
        <div class="inline-flex gap-1.5">
          <!-- Week day labels -->
          <div class="flex flex-col gap-1.5 pr-2">
            <div
              v-for="(label, i) in weekDayLabels"
              :key="i"
              class="flex h-9 w-7 items-center justify-end text-xs text-slate-400 dark:text-slate-500"
            >
              {{ label }}
            </div>
          </div>

          <!-- Grid columns (weeks) -->
          <div
            v-for="week in totalWeeks"
            :key="week"
            class="flex flex-col gap-1.5"
          >
            <template v-for="day in 7" :key="`${week}-${day}`">
              <div
                v-if="getGithubCell(week - 1, day - 1)"
                class="group relative flex h-9 w-9 items-center justify-center rounded-lg transition-transform"
                :class="[
                  getIntensityClass(getGithubCell(week - 1, day - 1)!.intensity),
                  clickable ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-violet-400' : '',
                ]"
                @click="handleClick(getGithubCell(week - 1, day - 1)!)"
              >
                <span
                  class="text-xs font-semibold"
                  :class="getIntensityTextClass(getGithubCell(week - 1, day - 1)!.intensity)"
                >
                  {{ getGithubCell(week - 1, day - 1)!.dayNumber }}
                </span>
                <!-- Tooltip -->
                <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                  {{ tooltipText(getGithubCell(week - 1, day - 1)!) }}
                </div>
              </div>
              <div v-else class="h-9 w-9"></div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== Variant: strip（水平進度條帶）===== -->
    <template v-else-if="variant === 'strip'">
      <div class="flex flex-wrap gap-1.5">
        <!-- 已發佈的天數 -->
        <div
          v-for="cell in cells"
          :key="cell.dayLabel"
          class="group relative flex h-8 w-8 items-center justify-center rounded-md transition-transform"
          :class="[
            getIntensityClass(cell.intensity),
            clickable ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-violet-400' : '',
          ]"
          @click="handleClick(cell)"
        >
          <span
            class="text-xs font-semibold"
            :class="getIntensityTextClass(cell.intensity)"
          >
            {{ cell.dayNumber }}
          </span>
          <!-- Tooltip -->
          <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
            {{ tooltipText(cell) }}
          </div>
        </div>
        <!-- 尚未發佈的天數（灰色虛線框） -->
        <div
          v-for="future in futureDays"
          :key="future.dayLabel"
          class="group relative flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-slate-300 dark:border-slate-600"
        >
          <span class="text-xs text-slate-300 dark:text-slate-600">
            {{ future.dayNumber }}
          </span>
          <div class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
            {{ future.dayLabel }} · 尚未發佈
          </div>
        </div>
      </div>
    </template>

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
