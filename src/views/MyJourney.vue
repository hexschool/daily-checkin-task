<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import StreakBadge from '@/components/gamification/StreakBadge.vue'
import AchievementList from '@/components/gamification/AchievementList.vue'
import LevelProgress from '@/components/gamification/LevelProgress.vue'
import ContributionHeatmap from '@/components/gamification/ContributionHeatmap.vue'
import { useCheckinStore } from '@/stores/checkin'
import { useIdentityStore } from '@/stores/identity'
import { usePinnedStore } from '@/stores/pinned'
import { useStreaks } from '@/composables/useStreaks'
import { useAchievements } from '@/composables/useAchievements'
import { useLevel } from '@/composables/useLevel'
import type { SearchResult } from '@/types/checkin'

const route = useRoute()
const checkinStore = useCheckinStore()
const identityStore = useIdentityStore()
const pinnedStore = usePinnedStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const myUserId = computed(() => identityStore.getMyUserId(scheduleId.value))
const myUser = computed(() => checkinStore.myUserDetail)

// 身份搜尋
const identitySearch = ref('')
const identityResults = ref<SearchResult[]>([])
const isSearching = ref(false)

async function searchIdentity() {
  if (!identitySearch.value.trim()) {
    identityResults.value = []
    return
  }
  isSearching.value = true
  try {
    const response = await checkinStore.searchUsers(scheduleId.value, identitySearch.value, 5)
    identityResults.value = response.results
  } catch {
    identityResults.value = []
  } finally {
    isSearching.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(identitySearch, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchIdentity, 300)
})

async function selectIdentity(result: SearchResult) {
  identityStore.setMyIdentity(scheduleId.value, result.discordUserId)
  identitySearch.value = ''
  identityResults.value = []
  await checkinStore.fetchMyUserDetail(scheduleId.value, result.discordUserId)
}

function clearIdentity() {
  identityStore.clearMyIdentity(scheduleId.value)
  checkinStore.myUserDetail = null
}

// 個人統計
const myCheckinStatus = computed(() => {
  if (!myUser.value) return {}
  const status: Record<string, boolean> = {}
  myUser.value.checkinDetails.forEach(d => {
    status[d.dayLabel] = d.checkedIn
  })
  return status
})

const streakResult = computed(() => {
  if (!checkinStore.scheduleStats) return { currentStreak: 0, longestStreak: 0 }
  return useStreaks(myCheckinStatus.value, checkinStore.scheduleStats.dailyStats)
})

const achievements = computed(() => {
  if (!myUser.value || !checkinStore.scheduleStats) return []
  const completionRate = checkinStore.scheduleStats.expectedTasks > 0
    ? (myUser.value.totalCheckinDays / checkinStore.scheduleStats.expectedTasks) * 100
    : 0
  return useAchievements({
    totalCheckinDays: myUser.value.totalCheckinDays,
    longestStreak: streakResult.value.longestStreak,
    completionRate,
  })
})

const levelInfo = computed(() => {
  if (!myUser.value || !checkinStore.scheduleStats) return null
  return useLevel({
    totalCheckinDays: myUser.value.totalCheckinDays,
    expectedTasks: checkinStore.scheduleStats.expectedTasks,
    checkinStatus: myCheckinStatus.value,
    dailyStats: checkinStore.scheduleStats.dailyStats,
  })
})

// 最近打卡活動
const recentActivity = computed(() => {
  if (!myUser.value) return []
  return myUser.value.checkinDetails
    .filter(d => d.checkedIn)
    .slice(-5)
    .reverse()
})

// 追蹤好友預覽
const friendList = computed(() => {
  return pinnedStore.getPinnedUserList(scheduleId.value).slice(0, 3)
})

// 好友的 streak 計算
function getFriendStreak(checkinStatus: Record<string, boolean>) {
  if (!checkinStore.scheduleStats) return 0
  return useStreaks(checkinStatus, checkinStore.scheduleStats.dailyStats).currentStreak
}

// 頭貼 URL
function avatarUrl(url: string | null): string {
  return url || 'https://cdn.discordapp.com/embed/avatars/0.png'
}

onMounted(async () => {
  await checkinStore.fetchScheduleStats(scheduleId.value)
  if (myUserId.value) {
    await checkinStore.fetchMyUserDetail(scheduleId.value, myUserId.value)
  }
  await pinnedStore.fetchPinnedUsers(scheduleId.value)
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
      <!-- 個人 Header -->
      <div v-if="myUser" class="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img
              :src="avatarUrl(myUser.avatarUrl)"
              :alt="myUser.displayName"
              class="h-16 w-16 rounded-2xl ring-2 ring-violet-200 dark:ring-violet-700"
            />
            <div>
              <h2 class="text-xl font-bold text-slate-800 dark:text-white">
                {{ myUser.displayName }}
              </h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">@{{ myUser.username }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <StreakBadge :streak="streakResult.currentStreak" size="lg" />
            <button
              @click="clearIdentity"
              class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              title="切換身份"
            >
              <i class="bi bi-person-x text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Level Progress -->
        <div v-if="levelInfo" class="mt-4">
          <LevelProgress :level-info="levelInfo" />
        </div>
      </div>

      <!-- 身份搜尋引導（未設定時） -->
      <div v-else class="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-8 text-center dark:border-violet-700 dark:bg-violet-900/20">
        <i class="bi bi-person-badge text-4xl text-violet-400"></i>
        <h2 class="mt-3 text-lg font-bold text-slate-800 dark:text-white">找到你自己</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">搜尋你的 Discord 帳號，開啟個人化旅程</p>

        <div class="relative mx-auto mt-4 max-w-sm">
          <input
            v-model="identitySearch"
            type="text"
            placeholder="輸入你的暱稱或 Discord ID..."
            class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

          <!-- 搜尋結果 -->
          <div
            v-if="identityResults.length > 0"
            class="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              v-for="result in identityResults"
              :key="result.discordUserId"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
              @click="selectIdentity(result)"
            >
              <img
                :src="avatarUrl(result.avatarUrl)"
                :alt="result.displayName"
                class="h-8 w-8 rounded-full"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-800 dark:text-white">{{ result.displayName }}</p>
                <p class="truncate text-xs text-slate-500">@{{ result.username }}</p>
              </div>
              <span class="text-xs text-slate-400">{{ result.totalCheckinDays }} 天</span>
            </button>
          </div>
        </div>

        <div v-if="isSearching" class="mt-3">
          <LoadingSpinner size="sm" />
        </div>
      </div>

      <!-- 統計卡片列 -->
      <div v-if="myUser" class="grid grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {{ myUser.totalCheckinDays }}/{{ checkinStore.scheduleStats.expectedTasks }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">完成天數</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <div class="flex items-center justify-center">
            <StreakBadge :streak="streakResult.currentStreak" size="md" />
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">連續打卡</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ streakResult.longestStreak }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">最長連續</p>
        </div>
      </div>

      <!-- 全局統計（未設定身份時） -->
      <div v-if="!myUser" class="grid grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {{ checkinStore.scheduleStats.dailyTasks }}/{{ checkinStore.scheduleStats.expectedTasks }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">已發佈天數</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ checkinStore.scheduleStats.uniqueUsers }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">參與人數</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ checkinStore.scheduleStats.totalCheckins }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">總打卡次數</p>
        </div>
      </div>

      <!-- 熱力圖 -->
      <ContributionHeatmap
        :daily-stats="checkinStore.scheduleStats.dailyStats"
        :checkin-status="myUser ? myCheckinStatus : undefined"
        :clickable="true"
        @day-click="$router.push({ name: 'day-detail', params: { scheduleId, dayLabel: $event } })"
      />

      <!-- 成就徽章 -->
      <AchievementList v-if="myUser && achievements.length" :achievements="achievements" />

      <!-- 最近活動 -->
      <div v-if="myUser && recentActivity.length" class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 class="mb-3 font-semibold text-slate-800 dark:text-white">
          <i class="bi bi-clock-history mr-2 text-violet-500"></i>
          最近打卡
        </h3>
        <div class="space-y-2">
          <RouterLink
            v-for="activity in recentActivity"
            :key="activity.dayLabel"
            :to="{ name: 'day-detail', params: { scheduleId, dayLabel: activity.dayLabel } }"
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <i class="bi bi-check2 text-emerald-600 dark:text-emerald-400"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ activity.dayLabel }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ activity.threadTitle }}</p>
              </div>
            </div>
            <span v-if="activity.checkinTime" class="text-xs text-slate-400">
              {{ new Date(activity.checkinTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </RouterLink>
        </div>
      </div>

      <!-- 追蹤好友預覽 -->
      <div v-if="friendList.length" class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800 dark:text-white">
            <i class="bi bi-people mr-2 text-violet-500"></i>
            追蹤好友
          </h3>
          <RouterLink
            :to="{ name: 'friends', params: { scheduleId } }"
            class="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            查看全部
          </RouterLink>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <RouterLink
            v-for="friend in friendList"
            :key="friend.discordUserId"
            :to="{ name: 'user-detail', params: { scheduleId, discordUserId: friend.discordUserId } }"
            class="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
          >
            <img
              :src="avatarUrl(friend.avatarUrl)"
              :alt="friend.displayName"
              class="h-10 w-10 rounded-full ring-2 ring-slate-100 dark:ring-slate-600"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{{ friend.displayName }}</p>
              <p class="text-xs text-slate-500">{{ friend.totalCheckinDays }} 天</p>
            </div>
            <StreakBadge :streak="getFriendStreak(friend.checkinStatus)" size="sm" />
          </RouterLink>
        </div>
      </div>
    </div>
  </AppShell>
</template>
