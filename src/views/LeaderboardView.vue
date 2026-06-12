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
import { getEligibleFlameIds, rotateFlameWindow, useFlameTick } from '@/composables/useFlameHighlights'
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

// 旺火動畫：同一時間最多 10 個（避免長列表卡頓），並隨 flameTick 輪流分配給所有達標者
const MAX_ANIMATED_FIRES = 10
const flameTick = useFlameTick()

// 合格名單（連續 7 天以上）只隨資料變動，避免每次輪替都重算 streak
const eligibleFireIds = computed(() =>
  getEligibleFlameIds(
    sortedUsers.value.map((u) => ({ id: u.discordUserId, streak: getUserStreak(u) })),
  ),
)
const eligibleFireIdsSearch = computed(() =>
  getEligibleFlameIds(
    searchResults.value.map((u) => ({ id: u.discordUserId, streak: getUserStreak(u) })),
  ),
)

// 本回合實際播放動畫的名單（隨 flameTick 滑動視窗）
const animatedFireIds = computed(() =>
  rotateFlameWindow(eligibleFireIds.value, MAX_ANIMATED_FIRES, flameTick.value),
)
const animatedFireIdsSearch = computed(() =>
  rotateFlameWindow(eligibleFireIdsSearch.value, MAX_ANIMATED_FIRES, flameTick.value),
)

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

    <div v-else class="space-y-6 pb-20">
      <!-- Header -->
      <header class="arcade-panel p-5">
        <div class="arcade-eyebrow mb-3">排行榜 · LEADERBOARD</div>
        <h1 class="flex items-center gap-2 text-2xl font-bold text-ink">
          <i class="bi bi-trophy-fill text-acc"></i>
          排行榜
        </h1>
        <p class="mt-1 text-[15px] text-muted">
          共 <span class="font-pixel text-acc">{{ sortedUsers.length }}</span> 位參與者
        </p>
        <!-- 火焰圖示說明 -->
        <p class="mt-3 flex items-start gap-2 border-t border-edge pt-3 text-[14px] text-muted">
          <i class="bi bi-fire mt-0.5 shrink-0 text-acc"></i>
          <span>火焰圖示代表「目前連續打卡天數」，連續越多天、火焰越旺、燃燒越劇烈。</span>
        </p>
      </header>

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

        <div v-else class="arcade-panel">
          <div v-if="searchResults.length === 0" class="p-10 text-center">
            <i class="bi bi-search text-3xl text-muted"></i>
            <p class="mt-3 text-[15px] text-muted">找不到符合的學員</p>
          </div>

          <div
            v-for="user in searchResults"
            :key="user.discordUserId"
            class="flex items-center gap-4 border-b border-edge px-5 py-3 last:border-0"
            :class="user.discordUserId === myUserId ? 'border-l-2 border-l-acc2 bg-[color-mix(in_srgb,var(--color-acc2)_10%,transparent)]' : ''"
          >
            <RouterLink
              :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
              class="flex min-w-0 flex-1 items-center gap-3"
            >
              <img
                :src="avatarUrl(user.avatarUrl)"
                :alt="user.displayName"
                class="h-10 w-10 shrink-0 rounded-full ring-1 ring-edge"
              />
              <div class="min-w-0">
                <p class="truncate text-[15px] font-bold text-ink">
                  {{ user.displayName }}
                  <span v-if="user.discordUserId === myUserId" class="ml-1 text-[15px] font-bold text-acc2">(你)</span>
                </p>
                <p class="text-[15px] text-muted">@{{ user.username }}</p>
              </div>
            </RouterLink>

            <div class="flex items-center gap-3">
              <StreakBadge
                :streak="getUserStreak(user)"
                size="sm"
                :animated="animatedFireIdsSearch.has(user.discordUserId)"
              />
              <div class="text-right">
                <p class="text-[15px] font-bold text-ink"><span class="font-pixel text-acc">{{ user.totalCheckinDays }}</span> 天</p>
                <p class="text-[15px] text-muted">{{ getCompletionRate(user) }}%</p>
              </div>
              <button
                @click.prevent="toggleTrack(user.discordUserId)"
                :aria-label="pinnedStore.isPinned(scheduleId, user.discordUserId) ? '取消追蹤' : '追蹤'"
                class="shrink-0 cursor-pointer px-2.5 py-1 text-[15px] font-bold transition-colors"
                :class="pinnedStore.isPinned(scheduleId, user.discordUserId)
                  ? 'bg-acc text-acc-ink'
                  : 'border border-edge text-ink hover:border-acc2 hover:text-acc2'"
              >
                {{ pinnedStore.isPinned(scheduleId, user.discordUserId) ? '追蹤中' : '追蹤' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== 正常排名模式 ===== -->
      <template v-else>
        <div class="arcade-panel">
          <div
            v-for="(user, index) in sortedUsers"
            :key="user.discordUserId"
            class="flex items-center gap-4 border-b border-edge px-5 py-3 last:border-0"
            :class="user.discordUserId === myUserId ? 'border-l-2 border-l-acc2 bg-[color-mix(in_srgb,var(--color-acc2)_10%,transparent)]' : ''"
          >
            <!-- Rank -->
            <span
              class="w-8 shrink-0 text-center font-pixel text-[15px]"
              :class="index < 3 ? 'text-acc' : 'text-muted'"
            >{{ index + 1 }}</span>

            <!-- Avatar + Info -->
            <RouterLink
              :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
              class="flex min-w-0 flex-1 items-center gap-3"
            >
              <img
                :src="avatarUrl(user.avatarUrl)"
                :alt="user.displayName"
                class="h-10 w-10 shrink-0 rounded-full ring-1 ring-edge"
              />
              <div class="min-w-0">
                <p class="truncate text-[15px] font-bold text-ink">
                  {{ user.displayName }}
                  <span v-if="user.discordUserId === myUserId" class="ml-1 text-[15px] font-bold text-acc2">(你)</span>
                </p>
                <p class="text-[15px] text-muted">@{{ user.username }}</p>
              </div>
            </RouterLink>

            <!-- Stats + Actions -->
            <div class="flex items-center gap-3">
              <StreakBadge
                :streak="getUserStreak(user)"
                size="sm"
                :animated="animatedFireIds.has(user.discordUserId)"
              />
              <div class="text-right">
                <p class="text-[15px] font-bold text-ink"><span class="font-pixel text-acc">{{ user.totalCheckinDays }}</span> 天</p>
                <p class="text-[15px] text-muted">{{ getCompletionRate(user) }}%</p>
              </div>
              <button
                @click.prevent="toggleTrack(user.discordUserId)"
                :aria-label="pinnedStore.isPinned(scheduleId, user.discordUserId) ? '取消追蹤' : '追蹤'"
                class="shrink-0 cursor-pointer px-2.5 py-1 text-[15px] font-bold transition-colors"
                :class="pinnedStore.isPinned(scheduleId, user.discordUserId)
                  ? 'bg-acc text-acc-ink'
                  : 'border border-edge text-ink hover:border-acc2 hover:text-acc2'"
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
        class="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 border border-acc bg-base/95 px-6 py-3 shadow-[3px_3px_0_var(--color-acc-strong)] backdrop-blur-sm"
      >
        <span class="flex items-center gap-1.5 text-[15px] font-bold text-muted">
          <i class="bi bi-person-fill text-acc2"></i>
          你的排名
          <span class="font-pixel text-acc2">#{{ myRank }}</span>
          <span class="text-muted">/ {{ sortedUsers.length }} 人</span>
        </span>
      </div>
    </div>
  </AppShell>
</template>
