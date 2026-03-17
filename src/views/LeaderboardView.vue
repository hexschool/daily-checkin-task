<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import StreakBadge from '@/components/gamification/StreakBadge.vue'
import { useCheckinStore } from '@/stores/checkin'
import { checkinApi } from '@/api/checkin'
import { useIdentityStore } from '@/stores/identity'
import { usePinnedStore } from '@/stores/pinned'
import { useStreaks } from '@/composables/useStreaks'
import type { UserCheckinItem } from '@/types/checkin'

const route = useRoute()
const checkinStore = useCheckinStore()
const identityStore = useIdentityStore()
const pinnedStore = usePinnedStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const myUserId = computed(() => identityStore.getMyUserId(scheduleId.value))

// 搜尋
const searchQuery = ref('')
const searchResults = ref<UserCheckinItem[]>([])
const isSearching = ref(false)
const isSearchMode = computed(() => searchQuery.value.trim().length > 0)

async function handleSearch(query: string) {
  if (!query.trim()) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const response = await checkinApi.getUsers(scheduleId.value, { search: query, limit: 50 })
    searchResults.value = response.users
  } catch {
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 按打卡天數排序
const sortedUsers = computed(() => {
  return [...checkinStore.users].sort((a, b) => b.totalCheckinDays - a.totalCheckinDays)
})

const showPodium = computed(() => sortedUsers.value.length >= 3)
const topThree = computed(() => sortedUsers.value.slice(0, 3))
const restUsers = computed(() => showPodium.value ? sortedUsers.value.slice(3) : sortedUsers.value)

// 我的排名
const myRank = computed(() => {
  if (!myUserId.value) return null
  const idx = sortedUsers.value.findIndex(u => u.discordUserId === myUserId.value)
  return idx >= 0 ? idx + 1 : null
})

function getUserStreak(user: UserCheckinItem) {
  if (!checkinStore.scheduleStats) return 0
  return useStreaks(user.checkinStatus, checkinStore.scheduleStats.dailyStats).currentStreak
}

function getCompletionRate(user: UserCheckinItem): number {
  const expected = checkinStore.scheduleStats?.expectedTasks ?? 1
  return Math.round((user.totalCheckinDays / expected) * 100)
}

function avatarUrl(url: string | null): string {
  return url || 'https://cdn.discordapp.com/embed/avatars/0.png'
}

function toggleTrack(discordUserId: string) {
  pinnedStore.togglePin(scheduleId.value, discordUserId)
}

async function setAsMe(discordUserId: string) {
  identityStore.setMyIdentity(scheduleId.value, discordUserId)
  await checkinStore.fetchMyUserDetail(scheduleId.value, discordUserId)
}

async function fetchAllUsers() {
  await checkinStore.fetchUsers(scheduleId.value, { limit: 100 })
  while (checkinStore.hasMorePages) {
    await checkinStore.fetchMoreUsers(scheduleId.value, { limit: 100 })
  }
}

onMounted(async () => {
  await checkinStore.fetchScheduleStats(scheduleId.value)
  await fetchAllUsers()
})
</script>

<template>
  <AppShell>
    <div v-if="checkinStore.isLoading && !checkinStore.hasUsers" class="flex justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="checkinStore.error && !checkinStore.hasUsers"
      :message="checkinStore.error"
      @retry="checkinStore.fetchUsers(scheduleId, { limit: 100 })"
    />

    <div v-else class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
          <i class="bi bi-trophy-fill mr-2 text-amber-500"></i>
          排行榜
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          共 {{ sortedUsers.length }} 位參與者
        </p>
      </div>

      <!-- Search Bar -->
      <SearchBar
        v-model="searchQuery"
        placeholder="搜尋學員..."
        @search="handleSearch"
      />

      <!-- ===== 搜尋結果模式 ===== -->
      <template v-if="isSearchMode">
        <!-- 搜尋中 -->
        <div v-if="isSearching" class="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>

        <div v-else class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div v-if="searchResults.length === 0" class="p-8 text-center">
            <i class="bi bi-search text-3xl text-slate-300 dark:text-slate-600"></i>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">找不到符合的學員</p>
          </div>

          <div
            v-for="user in searchResults"
            :key="user.discordUserId"
            class="flex items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-700/50"
            :class="user.discordUserId === myUserId ? 'bg-violet-50/50 dark:bg-violet-900/20' : ''"
          >
            <!-- Avatar + Info -->
            <RouterLink
              :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
              class="flex min-w-0 flex-1 items-center gap-3"
            >
              <img
                :src="avatarUrl(user.avatarUrl)"
                :alt="user.displayName"
                class="h-10 w-10 shrink-0 rounded-full ring-1 ring-slate-100 dark:ring-slate-700"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ user.displayName }}
                  <span v-if="user.discordUserId === myUserId" class="ml-1 text-xs text-violet-500">(你)</span>
                </p>
                <p class="text-xs text-slate-400">@{{ user.username }}</p>
              </div>
            </RouterLink>

            <!-- Stats + Actions -->
            <div class="flex items-center gap-3">
              <StreakBadge :streak="getUserStreak(user)" size="sm" />
              <div class="text-right">
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ user.totalCheckinDays }} 天</p>
                <p class="text-xs text-slate-400">{{ getCompletionRate(user) }}%</p>
              </div>

              <!-- 追蹤按鈕 -->
              <button
                @click.prevent="toggleTrack(user.discordUserId)"
                class="rounded-lg p-2 transition-colors"
                :class="pinnedStore.isPinned(scheduleId, user.discordUserId)
                  ? 'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                  : 'text-slate-300 hover:bg-slate-100 hover:text-violet-500 dark:hover:bg-slate-700'"
                :title="pinnedStore.isPinned(scheduleId, user.discordUserId) ? '取消追蹤' : '追蹤'"
              >
                <i :class="pinnedStore.isPinned(scheduleId, user.discordUserId) ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
              </button>

              <!-- 設為自己按鈕 -->
              <button
                v-if="user.discordUserId !== myUserId"
                @click.prevent="setAsMe(user.discordUserId)"
                class="rounded-lg p-2 text-slate-300 transition-colors hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-900/30"
                title="設為自己"
              >
                <i class="bi bi-person-plus"></i>
              </button>
              <span
                v-else
                class="rounded-lg p-2 text-violet-500"
                title="這是你"
              >
                <i class="bi bi-person-check-fill"></i>
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== 正常排名模式 ===== -->
      <template v-else>
        <!-- Top 3 Podium -->
        <div v-if="showPodium" class="flex items-end justify-center gap-4">
          <!-- #2 -->
          <div class="flex w-28 flex-col items-center">
            <img
              :src="avatarUrl(topThree[1]!.avatarUrl)"
              :alt="topThree[1]!.displayName"
              class="h-14 w-14 rounded-full ring-2 ring-slate-300"
            />
            <p class="mt-2 truncate text-sm font-medium text-slate-700 dark:text-slate-200 w-full text-center">{{ topThree[1]!.displayName }}</p>
            <p class="text-xs text-slate-400">{{ topThree[1]!.totalCheckinDays }} 天</p>
            <!-- 設為自己 -->
            <button
              v-if="topThree[1]!.discordUserId !== myUserId"
              @click="setAsMe(topThree[1]!.discordUserId)"
              class="mt-1 rounded-md px-2 py-0.5 text-xs text-slate-400 transition-colors hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-900/30"
            >
              <i class="bi bi-person-plus mr-1"></i>我
            </button>
            <span v-else class="mt-1 text-xs text-violet-500"><i class="bi bi-person-check-fill mr-1"></i>你</span>
            <div class="mt-1 flex h-20 w-full items-end justify-center rounded-t-xl bg-slate-200 dark:bg-slate-700">
              <span class="pb-2 text-2xl font-bold text-slate-500 dark:text-slate-400">2</span>
            </div>
          </div>

          <!-- #1 -->
          <div class="flex w-32 flex-col items-center">
            <div class="relative">
              <img
                :src="avatarUrl(topThree[0]!.avatarUrl)"
                :alt="topThree[0]!.displayName"
                class="h-18 w-18 rounded-full ring-3 ring-amber-400"
              />
              <span class="absolute -top-2 left-1/2 -translate-x-1/2 text-xl">👑</span>
            </div>
            <p class="mt-2 truncate text-sm font-bold text-slate-800 dark:text-white w-full text-center">{{ topThree[0]!.displayName }}</p>
            <p class="text-xs text-slate-400">{{ topThree[0]!.totalCheckinDays }} 天</p>
            <!-- 設為自己 -->
            <button
              v-if="topThree[0]!.discordUserId !== myUserId"
              @click="setAsMe(topThree[0]!.discordUserId)"
              class="mt-1 rounded-md px-2 py-0.5 text-xs text-slate-400 transition-colors hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-900/30"
            >
              <i class="bi bi-person-plus mr-1"></i>我
            </button>
            <span v-else class="mt-1 text-xs text-violet-500"><i class="bi bi-person-check-fill mr-1"></i>你</span>
            <div class="mt-1 flex h-28 w-full items-end justify-center rounded-t-xl bg-amber-100 dark:bg-amber-900/40">
              <span class="pb-2 text-3xl font-bold text-amber-600 dark:text-amber-400">1</span>
            </div>
          </div>

          <!-- #3 -->
          <div class="flex w-28 flex-col items-center">
            <img
              :src="avatarUrl(topThree[2]!.avatarUrl)"
              :alt="topThree[2]!.displayName"
              class="h-14 w-14 rounded-full ring-2 ring-amber-700"
            />
            <p class="mt-2 truncate text-sm font-medium text-slate-700 dark:text-slate-200 w-full text-center">{{ topThree[2]!.displayName }}</p>
            <p class="text-xs text-slate-400">{{ topThree[2]!.totalCheckinDays }} 天</p>
            <!-- 設為自己 -->
            <button
              v-if="topThree[2]!.discordUserId !== myUserId"
              @click="setAsMe(topThree[2]!.discordUserId)"
              class="mt-1 rounded-md px-2 py-0.5 text-xs text-slate-400 transition-colors hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-900/30"
            >
              <i class="bi bi-person-plus mr-1"></i>我
            </button>
            <span v-else class="mt-1 text-xs text-violet-500"><i class="bi bi-person-check-fill mr-1"></i>你</span>
            <div class="mt-1 flex h-14 w-full items-end justify-center rounded-t-xl bg-amber-50 dark:bg-amber-900/20">
              <span class="pb-2 text-2xl font-bold text-amber-700 dark:text-amber-600">3</span>
            </div>
          </div>
        </div>

        <!-- Full Ranking -->
        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div
            v-for="(user, index) in restUsers"
            :key="user.discordUserId"
            class="flex items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-700/50"
            :class="user.discordUserId === myUserId ? 'bg-violet-50/50 dark:bg-violet-900/20' : ''"
          >
            <!-- Rank -->
            <span class="w-8 text-center text-sm font-bold text-slate-400">{{ showPodium ? index + 4 : index + 1 }}</span>

            <!-- Avatar -->
            <RouterLink
              :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
              class="flex min-w-0 flex-1 items-center gap-3"
            >
              <img
                :src="avatarUrl(user.avatarUrl)"
                :alt="user.displayName"
                class="h-10 w-10 shrink-0 rounded-full ring-1 ring-slate-100 dark:ring-slate-700"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ user.displayName }}
                  <span v-if="user.discordUserId === myUserId" class="ml-1 text-xs text-violet-500">(你)</span>
                </p>
                <p class="text-xs text-slate-400">@{{ user.username }}</p>
              </div>
            </RouterLink>

            <!-- Stats + Actions -->
            <div class="flex items-center gap-3">
              <StreakBadge :streak="getUserStreak(user)" size="sm" />
              <div class="text-right">
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ user.totalCheckinDays }} 天</p>
                <p class="text-xs text-slate-400">{{ getCompletionRate(user) }}%</p>
              </div>

              <!-- 追蹤按鈕 -->
              <button
                @click.prevent="toggleTrack(user.discordUserId)"
                class="rounded-lg p-2 transition-colors"
                :class="pinnedStore.isPinned(scheduleId, user.discordUserId)
                  ? 'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                  : 'text-slate-300 hover:bg-slate-100 hover:text-violet-500 dark:hover:bg-slate-700'"
                :title="pinnedStore.isPinned(scheduleId, user.discordUserId) ? '取消追蹤' : '追蹤'"
              >
                <i :class="pinnedStore.isPinned(scheduleId, user.discordUserId) ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'"></i>
              </button>

              <!-- 設為自己按鈕 -->
              <button
                v-if="user.discordUserId !== myUserId"
                @click.prevent="setAsMe(user.discordUserId)"
                class="rounded-lg p-2 text-slate-300 transition-colors hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-900/30"
                title="設為自己"
              >
                <i class="bi bi-person-plus"></i>
              </button>
              <span
                v-else
                class="rounded-lg p-2 text-violet-500"
                title="這是你"
              >
                <i class="bi bi-person-check-fill"></i>
              </span>
            </div>
          </div>
        </div>

        <!-- 載入剩餘用戶中 -->
        <div v-if="checkinStore.hasMorePages" class="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      </template>

      <!-- My Rank Sticky Bar -->
      <div
        v-if="myRank && !isSearchMode"
        class="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-violet-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur-sm dark:border-violet-700 dark:bg-slate-800/95"
      >
        <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
          你的排名
          <span class="ml-1 font-bold text-violet-600 dark:text-violet-400">#{{ myRank }}</span>
          / {{ sortedUsers.length }} 人
        </span>
      </div>
    </div>
  </AppShell>
</template>
