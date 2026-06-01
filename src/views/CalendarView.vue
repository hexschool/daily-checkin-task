<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import ContributionHeatmap from '@/components/gamification/ContributionHeatmap.vue'
import { useCheckinStore } from '@/stores/checkin'
import { useIdentityStore } from '@/stores/identity'
import type { DailyStat } from '@/types/checkin'

const route = useRoute()
const checkinStore = useCheckinStore()
const identityStore = useIdentityStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const myUserId = computed(() => identityStore.getMyUserId(scheduleId.value))

// 打卡模式
const checkinModeLabel = computed(() => {
  switch (checkinStore.scheduleStats?.checkinMode) {
    case 'standard': return '標準模式'
    case 'extended': return '延時模式'
    case 'all_period': return '全期間模式'
    default: return '標準模式'
  }
})

const checkinModeDescription = computed(() => {
  switch (checkinStore.scheduleStats?.checkinMode) {
    case 'standard': return '僅限貼文當天打卡'
    case 'extended': return `可在討論串的隔天，延後 ${checkinStore.scheduleStats?.extendedHours || 0} 小時內打卡`
    case 'all_period': return '活動期間內任何時段打卡皆可被計算'
    default: return '24 小時內有效'
  }
})

// 活動起訖日期區間（由 dailyStats 的最早～最晚日期推導）
const activityPeriod = computed(() => {
  const stats = checkinStore.scheduleStats?.dailyStats
  if (!stats || stats.length === 0) return null
  const times = stats.map(s => new Date(s.date).getTime())
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
  return `${fmt(Math.min(...times))} – ${fmt(Math.max(...times))}`
})

// 選中的日期
const selectedDay = ref<DailyStat | null>(null)

const myCheckinStatus = computed(() => {
  if (!checkinStore.myUserDetail) return undefined
  const status: Record<string, boolean> = {}
  checkinStore.myUserDetail.checkinDetails.forEach(d => {
    status[d.dayLabel] = d.checkedIn
  })
  return status
})

// 每日任務：取最近 5 天（新到舊），數量可視需求調整
const dailyTasks = computed(() => {
  const stats = checkinStore.scheduleStats?.dailyStats
  if (!stats) return []
  return [...stats]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

function handleDayClick(dayLabel: string) {
  const stat = checkinStore.scheduleStats?.dailyStats.find(s => s.dayLabel === dayLabel)
  if (stat) {
    selectedDay.value = stat
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

// 以本地年/月/日判斷某日期是否為今天 / 昨天
function isSameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(dateStr: string): boolean {
  return isSameLocalDate(new Date(dateStr), new Date())
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameLocalDate(new Date(dateStr), yesterday)
}

onMounted(async () => {
  if (!checkinStore.scheduleStats) {
    await checkinStore.fetchScheduleStats(scheduleId.value)
  }
  if (myUserId.value && !checkinStore.myUserDetail) {
    await checkinStore.fetchMyUserDetail(scheduleId.value, myUserId.value)
  }
})
</script>

<template>
  <AppShell>
    <div v-if="checkinStore.isLoading && !checkinStore.scheduleStats" class="flex justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="checkinStore.error && !checkinStore.scheduleStats"
      :message="checkinStore.error"
      @retry="checkinStore.fetchScheduleStats(scheduleId)"
    />

    <div v-else-if="checkinStore.scheduleStats" class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
          <i class="bi bi-calendar3 mr-2 text-violet-500"></i>
          打卡日曆
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ checkinStore.scheduleStats.scheduleName }}
          <span v-if="activityPeriod"> · {{ activityPeriod }}</span>
        </p>
      </div>

      <!-- 打卡模式說明 -->
      <div class="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 dark:border-violet-800 dark:bg-violet-900/20">
        <i class="bi bi-clock-history mt-0.5 text-violet-500"></i>
        <div>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ checkinModeLabel }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ checkinModeDescription }}</p>
        </div>
      </div>

      <!-- 切換：個人 / 全局 -->
      <div v-if="myCheckinStatus" class="flex gap-2">
        <span class="text-sm text-slate-500 dark:text-slate-400">
          顯示你的個人打卡狀態
        </span>
      </div>

      <!-- 熱力圖 -->
      <ContributionHeatmap
        variant="strip"
        :daily-stats="checkinStore.scheduleStats.dailyStats"
        :checkin-status="myCheckinStatus"
        :expected-tasks="checkinStore.scheduleStats.expectedTasks"
        :clickable="true"
        @day-click="handleDayClick"
      />

      <!-- 選中日期預覽 -->
      <Transition name="slide-up">
        <div
          v-if="selectedDay"
          class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">{{ selectedDay.dayLabel }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ formatDate(selectedDay.date) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-violet-50 px-4 py-2 dark:bg-violet-900/30">
                <span class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ selectedDay.checkinCount }}</span>
                <span class="ml-1 text-sm text-slate-500 dark:text-slate-400">人打卡</span>
              </div>
              <RouterLink
                :to="{ name: 'day-detail', params: { scheduleId, dayLabel: selectedDay.dayLabel } }"
                class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              >
                查看詳情
              </RouterLink>
            </div>
          </div>

          <!-- 顯示自己是否有打卡 -->
          <div
            v-if="myCheckinStatus"
            class="mt-3 flex items-center gap-2 text-sm"
            :class="myCheckinStatus[selectedDay.dayLabel] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
          >
            <i :class="myCheckinStatus[selectedDay.dayLabel] ? 'bi bi-check-circle-fill' : 'bi bi-x-circle'"></i>
            {{ myCheckinStatus[selectedDay.dayLabel] ? '你已打卡' : '你未打卡' }}
          </div>
        </div>
      </Transition>

      <!-- 每日任務 -->
      <div v-if="dailyTasks.length" class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 class="mb-3 font-semibold text-slate-800 dark:text-white">
          <i class="bi bi-list-check mr-2 text-violet-500"></i>
          每日任務
        </h3>

        <!-- 如何參與說明 -->
        <div class="mb-3 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/10">
          <i class="bi bi-lightbulb-fill mt-0.5 text-amber-500"></i>
          <div>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">如何參與</p>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              點任務 → 進入 Discord 頻道 → 留言即自動打卡
              <span class="font-medium text-slate-600 dark:text-slate-300">（資料每小時更新一次）</span>
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="task in dailyTasks"
            :key="task.dayLabel"
            class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50"
          >
            <!-- 左側：任務標題 + 狀態徽章 -->
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                <i class="bi bi-calendar-check text-violet-600 dark:text-violet-400"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ task.dayLabel }}</p>
                  <span
                    v-if="isToday(task.date)"
                    class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                  >今日</span>
                  <span
                    v-if="myCheckinStatus?.[task.dayLabel]"
                    class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                  >已完成</span>
                </div>
                <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ task.threadTitle }}</p>
              </div>
            </div>

            <!-- 右側：前往打卡（今日）/ 前往（昨日）— 連 Discord 討論串 -->
            <a
              v-if="isToday(task.date)"
              :href="task.threadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
            >
              <i class="bi bi-discord"></i>
              前往打卡
            </a>
            <a
              v-else-if="isYesterday(task.date)"
              :href="task.threadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              前往
              <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ checkinStore.scheduleStats.dailyTasks }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">已發佈天數</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ checkinStore.scheduleStats.expectedTasks }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">預計天數</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ checkinStore.scheduleStats.totalCheckins }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">總打卡次數</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ checkinStore.scheduleStats.uniqueUsers }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">參與人數</p>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
