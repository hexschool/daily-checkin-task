<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { useCheckinStore } from '@/stores/checkin'
import { useIdentityStore } from '@/stores/identity'
import { useStreaks } from '@/composables/useStreaks'
import type { DailyStat } from '@/types/checkin'

const route = useRoute()
const checkinStore = useCheckinStore()
const identityStore = useIdentityStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const myUserId = computed(() => identityStore.getMyUserId(scheduleId.value))

// 打卡規則說明（標題文字固定為「打卡規則」，僅描述隨模式變動）
const checkinModeDescription = computed(() => {
  switch (checkinStore.scheduleStats?.checkinMode) {
    case 'standard': return '僅限貼文當天打卡，錯過當日即中斷連續紀錄'
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
    new Date(t).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
  return `${fmt(Math.min(...times))} ▸ ${fmt(Math.max(...times))}`
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

// 個人連續天數（已設定身份才顯示）
const myStreak = computed(() => {
  if (!myCheckinStatus.value || !checkinStore.scheduleStats) return null
  return useStreaks(myCheckinStatus.value, checkinStore.scheduleStats.dailyStats).currentStreak
})

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

type CellState = 'done' | 'today' | 'miss' | 'future'
interface HeatCell {
  dayNumber: number
  dayLabel?: string
  state: CellState
  stat?: DailyStat
}

// 熱力圖格子：1..預計天數，依發佈與個人打卡狀態決定狀態
const heatCells = computed<HeatCell[]>(() => {
  const stats = checkinStore.scheduleStats
  if (!stats) return []
  const total = Math.max(stats.expectedTasks || 0, stats.dailyStats.length)
  const byNum = new Map(stats.dailyStats.map(s => [s.dayNumber, s]))
  const cells: HeatCell[] = []
  for (let i = 1; i <= total; i++) {
    const stat = byNum.get(i)
    if (!stat) {
      cells.push({ dayNumber: i, state: 'future' })
      continue
    }
    let state: CellState = 'miss'
    if (isToday(stat.date)) state = 'today'
    else if (myCheckinStatus.value?.[stat.dayLabel]) state = 'done'
    cells.push({ dayNumber: i, dayLabel: stat.dayLabel, state, stat })
  }
  return cells
})

// 每日任務：全部天數（新到舊），列表區塊限高並可捲動
const dailyTasks = computed(() => {
  const stats = checkinStore.scheduleStats?.dailyStats
  if (!stats) return []
  return [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function selectCell(cell: HeatCell) {
  if (cell.stat) selectedDay.value = cell.stat
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
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
    <div v-if="checkinStore.isLoading && !checkinStore.scheduleStats" class="flex justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="checkinStore.error && !checkinStore.scheduleStats"
      :message="checkinStore.error"
      @retry="checkinStore.fetchScheduleStats(scheduleId)"
    />

    <div v-else-if="checkinStore.scheduleStats" class="space-y-7">
      <!-- Hero -->
      <header
        class="border-2 border-ink bg-surface p-6 shadow-[7px_7px_0_var(--color-acc)] [animation:arcade-pop_.5s_.05s_cubic-bezier(.2,.9,.3,1.2)_both]"
      >
        <div class="text-[15px] font-bold tracking-[0.14em] text-muted">▶ CHECK-IN CALENDAR</div>
        <h1 class="my-3 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          {{ checkinStore.scheduleStats.scheduleName }}
        </h1>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <span
            v-if="myStreak !== null"
            class="flex items-center gap-1.5 border border-acc px-3 py-1.5 text-[15px] font-bold text-acc"
          >
            <i class="bi bi-fire"></i> 連續 {{ myStreak }} 天
          </span>
          <span
            v-if="activityPeriod"
            class="border border-dashed border-acc px-3 py-1.5 text-[15px] font-bold tracking-wide text-acc"
          >{{ activityPeriod }}</span>
        </div>
      </header>

      <!-- 統計 -->
      <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">{{ checkinStore.scheduleStats.dailyTasks }}</div>
          <div class="mt-3 text-[15px] font-semibold text-muted">已發佈天數</div>
        </div>
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">{{ checkinStore.scheduleStats.expectedTasks }}</div>
          <div class="mt-3 text-[15px] font-semibold text-muted">預計天數</div>
        </div>
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">{{ checkinStore.scheduleStats.totalCheckins }}</div>
          <div class="mt-3 text-[15px] font-semibold text-muted">總打卡次數</div>
        </div>
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">{{ checkinStore.scheduleStats.uniqueUsers }}</div>
          <div class="mt-3 text-[15px] font-semibold text-muted">參與人數</div>
        </div>
      </section>

      <!-- 熱力圖 -->
      <section class="arcade-panel p-5">
        <div class="arcade-eyebrow mb-4">修煉軌跡 · {{ heatCells.length }} DAYS</div>
        <div class="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
          <button
            v-for="cell in heatCells"
            :key="cell.dayNumber"
            type="button"
            :disabled="!cell.stat"
            :title="cell.dayLabel || `Day ${cell.dayNumber}`"
            class="aspect-square cursor-pointer border transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
            :class="{
              'border-acc bg-acc shadow-[0_0_9px_color-mix(in_srgb,var(--color-acc)_40%,transparent)]': cell.state === 'done',
              'border-2 border-acc2 bg-transparent shadow-[0_0_14px_color-mix(in_srgb,var(--color-acc2)_55%,transparent)] [animation:arcade-blink_1.1s_steps(2,jump-none)_infinite]': cell.state === 'today',
              'border-edge bg-[color-mix(in_srgb,var(--color-ink)_22%,var(--color-base))]': cell.state === 'miss',
              'border-dashed border-edge bg-base': cell.state === 'future',
            }"
            @click="selectCell(cell)"
          ></button>
        </div>
        <div class="mt-4 flex flex-wrap gap-4 text-[15px] text-muted">
          <span class="flex items-center gap-2"><i class="inline-block h-3.5 w-3.5 border border-acc bg-acc"></i> 已完成</span>
          <span class="flex items-center gap-2"><i class="inline-block h-3.5 w-3.5 border-2 border-acc2"></i> 今日</span>
          <span class="flex items-center gap-2"><i class="inline-block h-3.5 w-3.5 border border-edge bg-[color-mix(in_srgb,var(--color-ink)_22%,var(--color-base))]"></i> 未完成</span>
          <span class="flex items-center gap-2"><i class="inline-block h-3.5 w-3.5 border border-dashed border-edge bg-base"></i> 未發佈</span>
        </div>
      </section>

      <!-- 選中日期預覽 -->
      <Transition name="slide-up">
        <section v-if="selectedDay" class="arcade-panel p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="font-pixel text-lg text-ink">{{ selectedDay.dayLabel }}</h3>
              <p class="mt-1 text-[15px] text-muted">{{ formatDate(selectedDay.date) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="border border-edge px-4 py-2">
                <span class="font-pixel text-lg text-acc">{{ selectedDay.checkinCount }}</span>
                <span class="ml-1 text-[15px] text-muted">人打卡</span>
              </div>
              <RouterLink
                :to="{ name: 'day-detail', params: { scheduleId, dayLabel: selectedDay.dayLabel } }"
                class="arcade-btn-alt"
              >查看詳情 →</RouterLink>
            </div>
          </div>
          <div
            v-if="myCheckinStatus"
            class="mt-4 flex items-center gap-2 text-[15px]"
            :class="myCheckinStatus[selectedDay.dayLabel] ? 'text-acc' : 'text-muted'"
          >
            <i :class="myCheckinStatus[selectedDay.dayLabel] ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
            {{ myCheckinStatus[selectedDay.dayLabel] ? '你已打卡' : '你尚未打卡' }}
          </div>
        </section>
      </Transition>

      <!-- 每日任務 -->
      <section v-if="dailyTasks.length" class="arcade-panel p-5">
        <div class="arcade-eyebrow mb-4">每日任務 · QUESTS</div>

        <!-- 如何參與 -->
        <div class="mb-4 flex items-center gap-3 border border-dashed border-acc px-4 py-3.5 [background:color-mix(in_srgb,var(--color-acc)_7%,transparent)]">
          <span class="text-xl">💡</span>
          <p class="text-[15px] text-muted">
            <b class="font-bold text-acc">如何參與</b>　點任務 → 進入 Discord 頻道 → 留言即自動打卡
          </p>
        </div>

        <!-- 打卡規則 -->
        <div class="mb-4 flex flex-wrap items-center gap-3 border border-edge bg-surface px-4 py-3.5">
          <span class="border border-acc px-2.5 py-1.5 text-[15px] font-bold text-acc">打卡規則</span>
          <p class="text-[15px] text-muted">
            {{ checkinModeDescription }}
            <span class="font-semibold text-ink">（資料每小時更新一次）</span>
          </p>
        </div>

        <!-- 全部天數，限高並可捲動查看 -->
        <div class="max-h-[28rem] space-y-2.5 overflow-y-auto overflow-x-hidden pr-1">
          <a
            v-for="task in dailyTasks"
            :key="task.dayLabel"
            :href="task.threadUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 border border-edge bg-surface p-4 transition-all hover:translate-x-1 hover:border-acc"
          >
            <span
              class="w-16 shrink-0 font-mono text-[15px] font-extrabold tracking-wide"
              :class="isToday(task.date) ? 'text-acc2' : 'text-ink'"
            >{{ task.dayLabel?.toUpperCase() }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2.5 text-[17px] font-bold text-ink">
                <span>{{ task.threadTitle }}</span>
                <span v-if="isToday(task.date)" class="arcade-badge arcade-badge-today">今日</span>
                <span v-else-if="myCheckinStatus?.[task.dayLabel]" class="arcade-badge arcade-badge-done">已完成</span>
              </div>
            </div>
            <!-- 整列即連結，以下僅為視覺提示（避免巢狀 <a>） -->
            <span v-if="isToday(task.date)" class="arcade-btn shrink-0"><i class="bi bi-discord"></i> 前往打卡</span>
            <span v-else class="arcade-btn-alt shrink-0">前往 ↗</span>
          </a>
        </div>
      </section>
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
