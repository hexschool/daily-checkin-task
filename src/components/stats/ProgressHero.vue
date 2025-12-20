<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dailyTasks: number
  expectedTasks: number
  progress: number
  totalCheckins: number
  uniqueUsers: number
}>()

// 計算進度條動畫延遲（Duolingo 風格）
const progressWidth = computed(() => `${Math.min(props.progress, 100)}%`)

// 根據進度顯示不同的鼓勵文字
const encouragementText = computed(() => {
  if (props.progress >= 100) return '太棒了！已完成全部打卡！'
  if (props.progress >= 80) return '即將完成，再接再厲！'
  if (props.progress >= 50) return '已經過半，繼續保持！'
  if (props.progress >= 25) return '穩定前進中，加油！'
  return '剛開始，一起努力吧！'
})

// 進度條顏色（根據進度變化）
const progressColorClass = computed(() => {
  if (props.progress >= 80) return 'from-emerald-400 to-emerald-600'
  if (props.progress >= 50) return 'from-violet-400 to-violet-600'
  if (props.progress >= 25) return 'from-amber-400 to-amber-600'
  return 'from-rose-400 to-rose-600'
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 sm:p-8"
  >
    <!-- 背景裝飾 -->
    <div
      class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 blur-3xl"
    ></div>
    <div
      class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-3xl"
    ></div>

    <div class="relative">
      <!-- 標題區 -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white sm:text-2xl">完成進度</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ encouragementText }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-4xl font-bold text-slate-800 dark:text-white sm:text-5xl">{{ progress }}</span>
          <span class="text-2xl font-medium text-slate-400 sm:text-3xl">%</span>
        </div>
      </div>

      <!-- 進度條（Duolingo 風格） -->
      <div class="mb-6">
        <div class="relative h-6 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 sm:h-8">
          <!-- 進度填充 -->
          <div
            class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-1000 ease-out"
            :class="progressColorClass"
            :style="{ width: progressWidth }"
          >
            <!-- 閃光效果 -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style="animation: shimmer 2s infinite"
            ></div>
          </div>
          <!-- 進度文字 -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-300 sm:text-sm">
              {{ dailyTasks }} / {{ expectedTasks }} 天
            </span>
          </div>
        </div>
      </div>

      <!-- 統計數據 -->
      <div class="grid grid-cols-2 gap-4">
        <div
          class="flex items-center gap-3 rounded-xl bg-white/80 p-4 dark:bg-slate-800/80 sm:gap-4"
        >
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 sm:h-12 sm:w-12"
          >
            <i class="bi bi-check2-all text-lg text-blue-600 dark:text-blue-400 sm:text-xl"></i>
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">總打卡次數</p>
            <p class="text-lg font-bold text-slate-800 dark:text-white sm:text-xl">
              {{ totalCheckins }}
              <span class="text-sm font-normal text-slate-400">次</span>
            </p>
          </div>
        </div>

        <div
          class="flex items-center gap-3 rounded-xl bg-white/80 p-4 dark:bg-slate-800/80 sm:gap-4"
        >
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50 sm:h-12 sm:w-12"
          >
            <i class="bi bi-people-fill text-lg text-green-600 dark:text-green-400 sm:text-xl"></i>
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">參與人數</p>
            <p class="text-lg font-bold text-slate-800 dark:text-white sm:text-xl">
              {{ uniqueUsers }}
              <span class="text-sm font-normal text-slate-400">人</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
