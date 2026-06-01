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

    <div v-else-if="checkinStore.scheduleStats" class="space-y-7">
      <!-- 個人 Header -->
      <header
        v-if="myUser"
        class="border-2 border-ink bg-surface p-6 shadow-[7px_7px_0_var(--color-acc)] [animation:arcade-pop_.5s_.05s_cubic-bezier(.2,.9,.3,1.2)_both]"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img
              :src="avatarUrl(myUser.avatarUrl)"
              :alt="myUser.displayName"
              class="h-16 w-16 rounded-full border-2 border-acc shadow-[0_0_14px_color-mix(in_srgb,var(--color-acc)_40%,transparent)]"
            />
            <div>
              <div class="text-[15px] font-bold tracking-[0.14em] text-muted">▶ MY JOURNEY</div>
              <h2 class="my-1 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
                {{ myUser.displayName }}
              </h2>
              <p class="font-mono text-[15px] text-muted">@{{ myUser.username }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <StreakBadge :streak="streakResult.currentStreak" size="lg" />
            <button
              type="button"
              @click="clearIdentity"
              class="flex h-9 w-9 items-center justify-center border border-edge text-muted transition-colors hover:border-acc2 hover:text-acc2"
              title="切換身份"
              aria-label="切換身份"
            >
              <i class="bi bi-person-x text-base"></i>
            </button>
          </div>
        </div>

        <!-- Level Progress -->
        <div v-if="levelInfo" class="mt-5">
          <LevelProgress :level-info="levelInfo" />
        </div>
      </header>

      <!-- 身份搜尋引導（未設定時） -->
      <div v-else class="arcade-panel p-8 text-center">
        <i class="bi bi-person-badge text-4xl text-acc [text-shadow:0_0_18px_color-mix(in_srgb,var(--color-acc)_45%,transparent)]"></i>
        <h2 class="mt-4 text-xl font-bold tracking-tight text-ink">找到你自己</h2>
        <p class="mt-2 text-[15px] text-muted">從列表中找到自己，點擊「這是我」開啟個人化旅程</p>

        <!-- 點擊開啟身份選擇彈窗 -->
        <button
          type="button"
          @click="openIdentityModal"
          class="relative mx-auto mt-5 flex w-full max-w-sm cursor-pointer items-center border border-edge bg-base py-3 pl-10 pr-4 text-left text-[15px] text-muted transition-colors hover:border-acc hover:text-ink"
          aria-label="開啟身份選擇"
        >
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
          搜尋暱稱或 Discord ID...
        </button>
      </div>

      <!-- 全局統計（未設定身份時） -->
      <div v-if="!myUser" class="grid grid-cols-3 gap-3">
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">
            {{ checkinStore.scheduleStats.dailyTasks }}/{{ checkinStore.scheduleStats.expectedTasks }}
          </div>
          <div class="mt-3 text-[15px] font-semibold text-muted">已發佈天數</div>
        </div>
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">
            {{ checkinStore.scheduleStats.uniqueUsers }}
          </div>
          <div class="mt-3 text-[15px] font-semibold text-muted">參與人數</div>
        </div>
        <div class="arcade-panel p-5 text-center">
          <div class="font-pixel text-2xl text-acc">
            {{ checkinStore.scheduleStats.totalCheckins }}
          </div>
          <div class="mt-3 text-[15px] font-semibold text-muted">總打卡次數</div>
        </div>
      </div>

      <!-- 成就徽章 -->
      <AchievementList v-if="myUser && achievements.length" :achievements="achievements" />

      <!-- 追蹤好友預覽 -->
      <section v-if="friendList.length" class="arcade-panel p-5">
        <div class="mb-4 flex items-center justify-between">
          <div class="arcade-eyebrow">追蹤好友 · FRIENDS</div>
          <RouterLink
            :to="{ name: 'friends', params: { scheduleId } }"
            class="text-[15px] font-bold text-muted transition-colors hover:text-acc2"
          >
            查看全部 →
          </RouterLink>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <RouterLink
            v-for="friend in friendList"
            :key="friend.discordUserId"
            :to="{ name: 'user-detail', params: { scheduleId, discordUserId: friend.discordUserId } }"
            class="flex items-center gap-3 border border-edge bg-surface p-3 transition-all hover:translate-x-1 hover:border-acc"
          >
            <img
              :src="avatarUrl(friend.avatarUrl)"
              :alt="friend.displayName"
              class="h-10 w-10 rounded-full border border-edge"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-bold text-ink">{{ friend.displayName }}</p>
              <p class="font-mono text-[15px] text-muted">{{ friend.totalCheckinDays }} 天</p>
            </div>
            <StreakBadge :streak="getFriendStreak(friend.checkinStatus)" size="sm" />
          </RouterLink>
        </div>
      </section>
    </div>

    <!-- 身份選擇彈窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isIdentityModalOpen"
          class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        >
          <!-- 背景遮罩 -->
          <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" @click="closeIdentityModal"></div>

          <!-- 彈窗主體 -->
          <div
            class="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden border border-edge bg-panel shadow-[8px_8px_0_var(--color-acc)]"
          >
            <!-- 標題列 -->
            <div class="flex items-center justify-between border-b border-edge px-5 py-4">
              <div class="flex items-center gap-2">
                <i class="bi bi-person-badge text-acc"></i>
                <h2 class="text-base font-bold text-ink">找到你自己</h2>
              </div>
              <button
                type="button"
                @click="closeIdentityModal"
                class="flex h-8 w-8 items-center justify-center border border-edge text-muted transition-colors hover:border-acc2 hover:text-acc2"
                aria-label="關閉"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- 搜尋框 -->
            <div class="border-b border-edge p-4">
              <div class="relative">
                <input
                  ref="identityInputRef"
                  v-model="identitySearch"
                  type="text"
                  placeholder="搜尋暱稱或 Discord ID..."
                  class="w-full border border-edge bg-base py-3 pl-10 pr-10 text-[15px] text-ink placeholder-muted transition-colors focus:border-acc focus:outline-none focus:ring-1 focus:ring-acc"
                />
                <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
                <button
                  v-if="identitySearch"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-acc2"
                  aria-label="清除搜尋"
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
                <i class="bi bi-search text-2xl text-muted"></i>
                <p class="mt-3 text-[15px] text-muted">找不到「{{ identitySearch }}」</p>
              </div>

              <div v-else-if="displayUsers.length === 0" class="p-8 text-center">
                <i class="bi bi-people text-2xl text-muted"></i>
                <p class="mt-3 text-[15px] text-muted">目前沒有可選的使用者</p>
              </div>

              <div
                v-for="user in displayUsers"
                :key="user.discordUserId"
                class="flex items-center gap-3 border-b border-edge px-5 py-3 last:border-0"
              >
                <img
                  :src="avatarUrl(user.avatarUrl)"
                  :alt="user.displayName"
                  class="h-10 w-10 shrink-0 rounded-full border border-edge"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[15px] font-bold text-ink">{{ user.displayName }}</p>
                  <p class="truncate font-mono text-[15px] text-muted">@{{ user.username }}</p>
                </div>
                <span class="shrink-0 font-mono text-[15px] text-muted">{{ user.totalCheckinDays }} 天</span>
                <button
                  type="button"
                  @click="selectIdentity(user)"
                  class="shrink-0 border border-acc2 px-3 py-1.5 text-[15px] font-bold text-acc2 transition-colors hover:bg-acc2 hover:text-acc-ink"
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
