<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CheckinMode } from '@/types/checkin'

interface PinnedUser {
  discordUserId: string
  displayName: string
  avatarUrl: string | null
  totalCheckinDays: number
}

const props = defineProps<{
  title?: string
  subtitle?: string
  dailyTasks: number
  expectedTasks: number
  progress: number
  totalCheckins: number
  uniqueUsers: number
  pinnedUsers?: PinnedUser[]
  checkinMode?: CheckinMode
  extendedHours?: number
}>()

// 打卡模式顯示文字
const checkinModeLabel = computed(() => {
  switch (props.checkinMode) {
    case 'standard':
      return '標準模式'
    case 'extended':
      return '延時模式'
    case 'all_period':
      return '全期間模式'
    default:
      return '標準模式'
  }
})

// 打卡模式描述
const checkinModeDescription = computed(() => {
  switch (props.checkinMode) {
    case 'standard':
      return '僅限貼文當天打卡'
    case 'extended':
      return `可在討論串的隔天，延後 ${props.extendedHours || 0} 小時內打卡`
    case 'all_period':
      return '活動期間內任何時段打卡皆可被計算'
    default:
      return '24 小時內有效'
  }
})

// 計算進度條動畫延遲
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

// 計算用戶在進度條上的位置（百分比）
function getUserProgress(user: PinnedUser): number {
  if (props.expectedTasks === 0) return 0
  return Math.min((user.totalCheckinDays / props.expectedTasks) * 100, 100)
}

// 取得預設頭像
function getDefaultAvatar(discordUserId: string): string {
  const index = parseInt(discordUserId) % 5
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}

// Tooltip 狀態
const activeTooltip = ref<string | null>(null)

function showTooltip(userId: string) {
  activeTooltip.value = userId
}

function hideTooltip() {
  activeTooltip.value = null
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900 sm:p-6"
  >
    <!-- 背景裝飾 -->
    <div
      class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 blur-3xl"
    ></div>
    <div
      class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-3xl"
    ></div>

    <div class="relative">
      <!-- 標題區：左側標題 + 右側進度 -->
      <div class="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <!-- 左側：頁面標題 -->
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-bold text-slate-800 dark:text-white sm:text-2xl">
            {{ title || '完成進度' }}
          </h1>
          <p class="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
            {{ subtitle || encouragementText }}
          </p>
        </div>

        <!-- 右側：進度百分比 + 鼓勵詞 -->
        <div class="flex items-center gap-3 sm:gap-4">
          <div v-if="subtitle" class="hidden text-right sm:block">
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ encouragementText }}</p>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-bold text-slate-800 dark:text-white sm:text-4xl">{{ progress }}</span>
            <span class="text-xl font-medium text-slate-400 sm:text-2xl">%</span>
          </div>
        </div>
      </div>

      <!-- 進度條區域（含釘選用戶頭像） -->
      <div class="mb-4 sm:mb-5">
        <!-- 釘選用戶頭像 -->
        <div v-if="pinnedUsers && pinnedUsers.length > 0" class="relative mb-2 h-10 sm:h-12">
          <div
            v-for="user in pinnedUsers"
            :key="user.discordUserId"
            class="absolute -translate-x-1/2 transform transition-all duration-500"
            :style="{ left: `${getUserProgress(user)}%` }"
            @mouseenter="showTooltip(user.discordUserId)"
            @mouseleave="hideTooltip()"
          >
            <!-- 頭像 -->
            <div class="relative">
              <img
                :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
                :alt="user.displayName"
                class="h-8 w-8 cursor-pointer rounded-full border-2 border-white object-cover shadow-lg transition-transform hover:scale-110 hover:border-violet-400 dark:border-slate-700 dark:hover:border-violet-500 sm:h-10 sm:w-10"
              />
              <!-- 連接線 -->
              <div
                class="absolute left-1/2 top-full h-2 w-0.5 -translate-x-1/2 bg-slate-300 dark:bg-slate-600"
              ></div>

              <!-- Tooltip -->
              <Transition name="tooltip">
                <div
                  v-if="activeTooltip === user.discordUserId"
                  class="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-sm shadow-xl dark:bg-slate-700"
                >
                  <div class="font-medium text-white">{{ user.displayName }}</div>
                  <div class="text-slate-300">
                    已完成 <span class="font-bold text-emerald-400">{{ user.totalCheckinDays }}</span> / {{ expectedTasks }} 天
                  </div>
                  <!-- Tooltip 箭頭 -->
                  <div
                    class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"
                  ></div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- 進度條 -->
        <div class="relative h-7 overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-700 sm:h-8">
          <!-- 進度填充 -->
          <div
            class="progress-bar absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r transition-all duration-1000 ease-out"
            :class="progressColorClass"
            :style="{ width: progressWidth }"
          >
            <!-- 條紋動畫 -->
            <div class="stripe-animation absolute inset-0"></div>
            <!-- 光澤效果 -->
            <div
              class="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/10"
            ></div>
          </div>
          <!-- 進度文字 -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span
              class="text-xs font-bold drop-shadow-sm sm:text-sm"
              :class="progress > 45 ? 'text-white' : 'text-slate-700 dark:text-slate-200'"
            >
              {{ dailyTasks }} / {{ expectedTasks }} 天
            </span>
          </div>
        </div>
      </div>

      <!-- 統計數據 -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div
          class="flex items-center gap-2 rounded-xl bg-white/80 p-3 dark:bg-slate-800/80 sm:gap-3 sm:p-4"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 sm:h-10 sm:w-10"
          >
            <i class="bi bi-check2-all text-base text-blue-600 dark:text-blue-400 sm:text-lg"></i>
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">總打卡次數</p>
            <p class="text-base font-bold text-slate-800 dark:text-white sm:text-lg">
              {{ totalCheckins }}
              <span class="text-xs font-normal text-slate-400 sm:text-sm">次</span>
            </p>
          </div>
        </div>

        <div
          class="flex items-center gap-2 rounded-xl bg-white/80 p-3 dark:bg-slate-800/80 sm:gap-3 sm:p-4"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50 sm:h-10 sm:w-10"
          >
            <i class="bi bi-people-fill text-base text-green-600 dark:text-green-400 sm:text-lg"></i>
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">參與人數</p>
            <p class="text-base font-bold text-slate-800 dark:text-white sm:text-lg">
              {{ uniqueUsers }}
              <span class="text-xs font-normal text-slate-400 sm:text-sm">人</span>
            </p>
          </div>
        </div>

        <!-- 打卡模式 -->
        <div
          class="col-span-2 flex items-center gap-2 rounded-xl bg-white/80 p-3 dark:bg-slate-800/80 sm:col-span-1 sm:gap-3 sm:p-4"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50 sm:h-10 sm:w-10"
          >
            <i class="bi bi-clock-history text-base text-violet-600 dark:text-violet-400 sm:text-lg"></i>
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">打卡模式</p>
            <p class="text-base font-bold text-slate-800 dark:text-white sm:text-lg">
              {{ checkinModeLabel }}
            </p>
            <p class="truncate text-xs text-slate-400">{{ checkinModeDescription }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animated Stripes 效果 */
.stripe-animation {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1.5rem 1.5rem;
  animation: stripe-move 1s linear infinite;
}

@keyframes stripe-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 1.5rem 0;
  }
}

/* 進度條脈動效果 */
.progress-bar {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Tooltip 動畫 */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
