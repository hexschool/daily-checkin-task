<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import StreakBadge from '@/components/gamification/StreakBadge.vue'
import { useCheckinStore } from '@/stores/checkin'
import { useIdentityStore } from '@/stores/identity'
import { usePinnedStore } from '@/stores/pinned'
import { useStreaks } from '@/composables/useStreaks'
import type { SearchResult, UserCheckinItem } from '@/types/checkin'

const route = useRoute()
const checkinStore = useCheckinStore()
const identityStore = useIdentityStore()
const pinnedStore = usePinnedStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const myUserId = computed(() => identityStore.getMyUserId(scheduleId.value))

// 搜尋
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isSearching = ref(false)

async function doSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const response = await checkinStore.searchUsers(scheduleId.value, searchQuery.value, 10)
    // API 實際回傳陣列，非 SearchResponse 物件
    searchResults.value = (Array.isArray(response) ? response : response.results) as SearchResult[]
  } catch {
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(doSearch, 300)
})

// 好友列表
const friends = computed(() => pinnedStore.getPinnedUserList(scheduleId.value))

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

async function trackUser(result: SearchResult) {
  pinnedStore.pinUser(scheduleId.value, result.discordUserId)
  await pinnedStore.fetchPinnedUsers(scheduleId.value)
  searchQuery.value = ''
  searchResults.value = []
}

function untrackUser(discordUserId: string) {
  pinnedStore.unpinUser(scheduleId.value, discordUserId)
}

// 比較模式
const compareUserId = ref<string | null>(null)
const myDetail = computed(() => checkinStore.myUserDetail)

function toggleCompare(discordUserId: string) {
  compareUserId.value = compareUserId.value === discordUserId ? null : discordUserId
}

onMounted(async () => {
  await Promise.all([
    checkinStore.fetchScheduleStats(scheduleId.value),
    pinnedStore.fetchPinnedUsers(scheduleId.value),
  ])
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

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
            <i class="bi bi-people-fill mr-2 text-violet-500"></i>
            追蹤好友
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ friends.length }} / {{ pinnedStore.MAX_PINNED }} 位好友
          </p>
        </div>
      </div>

      <!-- 搜尋 + 新增 -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋用戶加入追蹤..."
          class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

        <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
          <LoadingSpinner size="sm" />
        </div>

        <!-- 搜尋結果 -->
        <div
          v-if="searchResults.length > 0"
          class="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div
            v-for="result in searchResults"
            :key="result.discordUserId"
            class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <img :src="avatarUrl(result.avatarUrl)" :alt="result.displayName" class="h-8 w-8 rounded-full" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-800 dark:text-white">{{ result.displayName }}</p>
              <p class="truncate text-xs text-slate-500">@{{ result.username }} · {{ result.totalCheckinDays }} 天</p>
            </div>
            <button
              v-if="!pinnedStore.isPinned(scheduleId, result.discordUserId)"
              @click="trackUser(result)"
              :disabled="!pinnedStore.canPin(scheduleId)"
              class="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-200 disabled:opacity-50 dark:bg-violet-900/40 dark:text-violet-400"
            >
              追蹤
            </button>
            <span v-else class="text-xs text-violet-500">已追蹤</span>
          </div>
        </div>
      </div>

      <!-- 好友卡片 -->
      <div v-if="friends.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="friend in friends"
          :key="friend.discordUserId"
          class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="flex items-start justify-between">
            <RouterLink
              :to="{ name: 'user-detail', params: { scheduleId, discordUserId: friend.discordUserId } }"
              class="flex items-center gap-3"
            >
              <img
                :src="avatarUrl(friend.avatarUrl)"
                :alt="friend.displayName"
                class="h-12 w-12 rounded-full ring-2 ring-slate-100 dark:ring-slate-700"
              />
              <div>
                <p class="font-medium text-slate-800 dark:text-white">{{ friend.displayName }}</p>
                <p class="text-xs text-slate-500">@{{ friend.username }}</p>
              </div>
            </RouterLink>
            <button
              @click="untrackUser(friend.discordUserId)"
              class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
              title="取消追蹤"
            >
              <i class="bi bi-x-lg text-sm"></i>
            </button>
          </div>

          <!-- Stats -->
          <div class="mt-4 grid grid-cols-3 gap-2">
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-700/50">
              <p class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ friend.totalCheckinDays }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">天數</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-700/50">
              <StreakBadge :streak="getUserStreak(friend)" size="sm" />
              <p class="text-xs text-slate-500 dark:text-slate-400">連續</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-700/50">
              <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ getCompletionRate(friend) }}%</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">完成率</p>
            </div>
          </div>

          <!-- 與我比較 -->
          <button
            v-if="myDetail"
            @click="toggleCompare(friend.discordUserId)"
            class="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            {{ compareUserId === friend.discordUserId ? '收起比較' : '與我比較' }}
          </button>

          <!-- 比較面板 -->
          <div
            v-if="compareUserId === friend.discordUserId && myDetail"
            class="mt-3 rounded-lg bg-violet-50 p-3 dark:bg-violet-900/20"
          >
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p class="font-medium text-slate-600 dark:text-slate-300">你</p>
                <p class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ myDetail.totalCheckinDays }}</p>
              </div>
              <div class="flex items-center justify-center text-slate-400">VS</div>
              <div>
                <p class="font-medium text-slate-600 dark:text-slate-300">{{ friend.displayName }}</p>
                <p class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ friend.totalCheckinDays }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else class="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center dark:border-slate-600">
        <i class="bi bi-people text-4xl text-slate-300 dark:text-slate-600"></i>
        <h3 class="mt-3 text-lg font-medium text-slate-600 dark:text-slate-400">還沒有追蹤任何人</h3>
        <p class="mt-1 text-sm text-slate-400 dark:text-slate-500">使用上方搜尋來追蹤你的朋友吧！</p>
      </div>
    </div>
  </AppShell>
</template>
