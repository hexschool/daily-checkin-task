<script setup lang="ts">
import { onMounted, computed, ref, watch, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import StreakBadge from '@/components/gamification/StreakBadge.vue'
import AchievementList from '@/components/gamification/AchievementList.vue'
import LevelProgress from '@/components/gamification/LevelProgress.vue'
import { useCheckinStore } from '@/stores/checkin'
import { checkinApi } from '@/api/checkin'
import { useIdentityStore } from '@/stores/identity'
import { usePinnedStore } from '@/stores/pinned'
import { useStreaks } from '@/composables/useStreaks'
import { useAchievements } from '@/composables/useAchievements'
import { useLevel } from '@/composables/useLevel'
import type { UserCheckinItem } from '@/types/checkin'

const route = useRoute()
const checkinStore = useCheckinStore()
const identityStore = useIdentityStore()
const pinnedStore = usePinnedStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const myUserId = computed(() => identityStore.getMyUserId(scheduleId.value))
const myUser = computed(() => checkinStore.myUserDetail)

// 身份搜尋 + 名單
const identitySearch = ref('')
const allUsers = ref<UserCheckinItem[]>([])
const isLoadingUsers = ref(false)
const isSearching = ref(false)
const searchResults = ref<UserCheckinItem[]>([])

// 身份選擇彈窗
const isIdentityModalOpen = ref(false)
const identityInputRef = ref<HTMLInputElement | null>(null)

async function openIdentityModal() {
  isIdentityModalOpen.value = true
  await nextTick()
  identityInputRef.value?.focus()
  // 首次開啟時才載入名單
  if (allUsers.value.length === 0) {
    await loadAllUsers()
  }
}

function closeIdentityModal() {
  isIdentityModalOpen.value = false
  identitySearch.value = ''
  searchResults.value = []
}

const displayUsers = computed(() => {
  if (identitySearch.value.trim() && searchResults.value.length > 0) {
    return searchResults.value
  }
  return allUsers.value
})

async function loadAllUsers() {
  isLoadingUsers.value = true
  try {
    const response = await checkinApi.getUsers(scheduleId.value, { limit: 100 })
    allUsers.value = response.users
  } catch {
    allUsers.value = []
  } finally {
    isLoadingUsers.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(identitySearch, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (!identitySearch.value.trim()) {
      searchResults.value = []
      return
    }
    isSearching.value = true
    try {
      const response = await checkinApi.getUsers(scheduleId.value, { search: identitySearch.value, limit: 50 })
      searchResults.value = response.users
    } catch {
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
})

async function selectIdentity(user: UserCheckinItem) {
  identityStore.setMyIdentity(scheduleId.value, user.discordUserId)
  closeIdentityModal()
  await checkinStore.fetchMyUserDetail(scheduleId.value, user.discordUserId)
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
    await pinnedStore.fetchPinnedUsers(scheduleId.value)
  }
  // 未設定身份時，名單改為開啟彈窗時才載入
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
      <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
        <i class="bi bi-person-badge text-4xl text-violet-400"></i>
        <h2 class="mt-3 text-lg font-bold text-slate-800 dark:text-white">找到你自己</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">從列表中找到自己，點擊「這是我」開啟個人化旅程</p>

        <!-- 點擊開啟身份選擇彈窗 -->
        <button
          type="button"
          @click="openIdentityModal"
          class="relative mx-auto mt-4 flex w-full max-w-sm items-center rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-left text-sm text-slate-400 transition-colors hover:border-violet-400 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-800"
        >
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          搜尋暱稱或 Discord ID...
        </button>
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

      <!-- 成就徽章 -->
      <AchievementList v-if="myUser && achievements.length" :achievements="achievements" />

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

    <!-- 身份選擇彈窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isIdentityModalOpen"
          class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        >
          <!-- 背景遮罩 -->
          <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeIdentityModal"></div>

          <!-- 彈窗主體 -->
          <div
            class="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:rounded-2xl"
          >
            <!-- 標題列 -->
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <div class="flex items-center gap-2">
                <i class="bi bi-person-badge text-violet-500"></i>
                <h2 class="text-base font-bold text-slate-800 dark:text-white">找到你自己</h2>
              </div>
              <button
                @click="closeIdentityModal"
                class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                aria-label="關閉"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- 搜尋框 -->
            <div class="border-b border-slate-100 p-4 dark:border-slate-700">
              <div class="relative">
                <input
                  ref="identityInputRef"
                  v-model="identitySearch"
                  type="text"
                  placeholder="搜尋暱稱或 Discord ID..."
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
                />
                <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <button
                  v-if="identitySearch"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  @click="identitySearch = ''; searchResults = []"
                >
                  <i class="bi bi-x-lg text-sm"></i>
                </button>
              </div>
            </div>

            <!-- 用戶名單（可捲動） -->
            <div class="flex-1 overflow-y-auto">
              <div v-if="isSearching || isLoadingUsers" class="flex justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>

              <div v-else-if="displayUsers.length === 0 && identitySearch.trim()" class="p-8 text-center">
                <i class="bi bi-search text-2xl text-slate-300 dark:text-slate-600"></i>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">找不到「{{ identitySearch }}」</p>
              </div>

              <div v-else-if="displayUsers.length === 0" class="p-8 text-center">
                <i class="bi bi-people text-2xl text-slate-300 dark:text-slate-600"></i>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">目前沒有可選的使用者</p>
              </div>

              <div
                v-for="user in displayUsers"
                :key="user.discordUserId"
                class="flex items-center gap-3 border-b border-slate-50 px-5 py-3 last:border-0 dark:border-slate-700/30"
              >
                <img
                  :src="avatarUrl(user.avatarUrl)"
                  :alt="user.displayName"
                  class="h-10 w-10 shrink-0 rounded-full ring-1 ring-slate-100 dark:ring-slate-700"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-slate-800 dark:text-white">{{ user.displayName }}</p>
                  <p class="truncate text-xs text-slate-500 dark:text-slate-400">@{{ user.username }}</p>
                </div>
                <span class="shrink-0 text-xs text-slate-400">{{ user.totalCheckinDays }} 天</span>
                <button
                  @click="selectIdentity(user)"
                  class="shrink-0 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:hover:bg-violet-900/60"
                >
                  這是我
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
