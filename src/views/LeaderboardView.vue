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

// 同分同名次計算
function getRank(index: number): number {
  if (index === 0) return 1
  const current = sortedUsers.value[index]
  const prev = sortedUsers.value[index - 1]
  if (current && prev && current.totalCheckinDays === prev.totalCheckinDays) {
    return getRank(index - 1)
  }
  return index + 1
}

// 我的排名（同分同名次）
const myRank = computed(() => {
  if (!myUserId.value) return null
  const idx = sortedUsers.value.findIndex(u => u.discordUserId === myUserId.value)
  if (idx < 0) return null
  return getRank(idx)
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

            <div class="flex items-center gap-3">
              <StreakBadge :streak="getUserStreak(user)" size="sm" />
              <div class="text-right">
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ user.totalCheckinDays }} 天</p>
                <p class="text-xs text-slate-400">{{ getCompletionRate(user) }}%</p>
              </div>
              <button
                @click.prevent="toggleTrack(user.discordUserId)"
                class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                :class="pinnedStore.isPinned(scheduleId, user.discordUserId)
                  ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:hover:bg-violet-900/60'
                  : 'border border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-violet-500 dark:hover:text-violet-400'"
              >
                {{ pinnedStore.isPinned(scheduleId, user.discordUserId) ? '追蹤中' : '追蹤' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== 正常排名模式 ===== -->
      <template v-else>
        <div class="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div
            v-for="(user, index) in sortedUsers"
            :key="user.discordUserId"
            class="flex items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-700/50"
            :class="user.discordUserId === myUserId ? 'bg-violet-50/50 dark:bg-violet-900/20' : ''"
          >
            <!-- Rank -->
            <span class="w-8 text-center text-sm font-bold text-slate-400">{{ index + 1 }}</span>

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
              <button
                @click.prevent="toggleTrack(user.discordUserId)"
                class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                :class="pinnedStore.isPinned(scheduleId, user.discordUserId)
                  ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:hover:bg-violet-900/60'
                  : 'border border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-violet-500 dark:hover:text-violet-400'"
              >
                {{ pinnedStore.isPinned(scheduleId, user.discordUserId) ? '追蹤中' : '追蹤' }}
              </button>
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
