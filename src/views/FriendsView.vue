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
          <h1 class="text-2xl font-bold text-ink">
            <i class="bi bi-people-fill mr-2 text-acc"></i>
            追蹤好友
          </h1>
          <p class="mt-1 text-[15px] text-muted">
            <span class="font-pixel text-acc">{{ friends.length }}</span>
            / {{ pinnedStore.MAX_PINNED }} 位好友
          </p>
        </div>
      </div>

      <!-- 搜尋 + 新增 -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋用戶加入追蹤..."
          class="w-full border border-edge bg-surface py-3 pl-10 pr-4 text-[15px] text-ink placeholder-muted transition-colors focus:border-acc focus:outline-none"
        />
        <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>

        <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
          <LoadingSpinner size="sm" />
        </div>

        <!-- 搜尋結果 -->
        <div
          v-if="searchResults.length > 0"
          class="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden border border-edge bg-panel shadow-[6px_6px_0_var(--color-base)]"
        >
          <div
            v-for="result in searchResults"
            :key="result.discordUserId"
            class="flex items-center gap-3 border-b border-edge px-4 py-3 transition-colors last:border-b-0 hover:bg-surface"
          >
            <img :src="avatarUrl(result.avatarUrl)" :alt="result.displayName" class="h-8 w-8 rounded-full border border-edge" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-bold text-ink">{{ result.displayName }}</p>
              <p class="truncate text-[15px] text-muted">@{{ result.username }} · <span class="font-pixel text-acc">{{ result.totalCheckinDays }}</span> 天</p>
            </div>
            <button
              v-if="!pinnedStore.isPinned(scheduleId, result.discordUserId)"
              @click="trackUser(result)"
              :disabled="!pinnedStore.canPin(scheduleId)"
              class="arcade-btn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              追蹤
            </button>
            <span v-else class="text-[15px] font-bold text-acc">已追蹤</span>
          </div>
        </div>
      </div>

      <!-- 好友卡片 -->
      <div v-if="friends.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="friend in friends"
          :key="friend.discordUserId"
          class="arcade-panel p-5 transition-colors hover:border-acc"
        >
          <div class="flex items-start justify-between">
            <RouterLink
              :to="{ name: 'user-detail', params: { scheduleId, discordUserId: friend.discordUserId } }"
              class="flex min-w-0 items-center gap-3"
            >
              <img
                :src="avatarUrl(friend.avatarUrl)"
                :alt="friend.displayName"
                class="h-12 w-12 shrink-0 rounded-full border border-acc"
              />
              <div class="min-w-0">
                <p class="truncate font-bold text-ink">{{ friend.displayName }}</p>
                <p class="truncate text-[15px] text-muted">@{{ friend.username }}</p>
              </div>
            </RouterLink>
            <button
              @click="untrackUser(friend.discordUserId)"
              class="shrink-0 cursor-pointer border border-transparent p-1.5 text-muted transition-colors hover:border-edge hover:text-ink"
              title="取消追蹤"
              aria-label="取消追蹤"
            >
              <i class="bi bi-x-lg text-base"></i>
            </button>
          </div>

          <!-- Stats -->
          <div class="mt-4 grid grid-cols-3 gap-2">
            <div class="border border-edge bg-surface p-2 text-center">
              <p class="font-pixel text-lg text-acc">{{ friend.totalCheckinDays }}</p>
              <p class="mt-1 text-[15px] text-muted">天數</p>
            </div>
            <div class="flex flex-col items-center justify-center border border-edge bg-surface p-2 text-center">
              <StreakBadge :streak="getUserStreak(friend)" size="sm" />
              <p class="mt-1 text-[15px] text-muted">連續</p>
            </div>
            <div class="border border-edge bg-surface p-2 text-center">
              <p class="font-pixel text-lg text-acc">{{ getCompletionRate(friend) }}%</p>
              <p class="mt-1 text-[15px] text-muted">完成率</p>
            </div>
          </div>

          <!-- 與我比較 -->
          <button
            v-if="myDetail"
            @click="toggleCompare(friend.discordUserId)"
            class="mt-3 w-full cursor-pointer border border-edge py-2 text-[15px] font-bold text-muted transition-colors hover:border-acc2 hover:text-acc2"
          >
            {{ compareUserId === friend.discordUserId ? '收起比較' : '與我比較' }}
          </button>

          <!-- 比較面板 -->
          <div
            v-if="compareUserId === friend.discordUserId && myDetail"
            class="mt-3 border border-edge bg-surface p-3"
          >
            <div class="grid grid-cols-3 gap-2 text-center text-[15px]">
              <div class="min-w-0">
                <p class="font-bold text-muted">你</p>
                <p class="font-pixel text-lg text-acc">{{ myDetail.totalCheckinDays }}</p>
              </div>
              <div class="flex items-center justify-center font-pixel text-muted">VS</div>
              <div class="min-w-0">
                <p class="truncate font-bold text-muted">{{ friend.displayName }}</p>
                <p class="font-pixel text-lg text-acc">{{ friend.totalCheckinDays }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else class="border-2 border-dashed border-edge bg-surface p-12 text-center">
        <i class="bi bi-people text-4xl text-acc"></i>
        <h3 class="mt-3 text-lg font-bold text-ink">還沒有追蹤任何人</h3>
        <p class="mt-1 text-[15px] text-muted">使用上方搜尋來追蹤你的朋友吧！</p>
      </div>
    </div>
  </AppShell>
</template>
