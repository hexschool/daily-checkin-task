<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import { usePinnedStore } from '@/stores/pinned'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

const route = useRoute()
const router = useRouter()
const store = useCheckinStore()
const pinnedStore = usePinnedStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const isLoadingMore = ref(false)

const dayLabels = computed(() => {
  if (!store.scheduleStats?.dailyStats) return []
  return store.scheduleStats.dailyStats.map((stat) => stat.dayLabel)
})

const pinnedUsers = computed(() => pinnedStore.getPinnedUserList(scheduleId.value))

async function loadData() {
  if (!store.scheduleStats) {
    await store.fetchScheduleStats(scheduleId.value)
  }
  await Promise.all([
    store.fetchUsers(scheduleId.value, { limit: 50 }),
    pinnedStore.fetchPinnedUsers(scheduleId.value),
  ])
}

async function loadMore() {
  if (isLoadingMore.value || !store.hasMorePages) return
  isLoadingMore.value = true
  await store.fetchMoreUsers(scheduleId.value, { limit: 50 })
  isLoadingMore.value = false
}

function goToUserDetail(discordUserId: string) {
  router.push({
    name: 'user-detail',
    params: { scheduleId: scheduleId.value, discordUserId },
  })
}

function getDefaultAvatar(discordUserId: string) {
  const index = parseInt(discordUserId) % 5
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}

function handleTogglePin(discordUserId: string, event: Event) {
  event.stopPropagation()
  const wasPinned = pinnedStore.isPinned(scheduleId.value, discordUserId)
  const success = pinnedStore.togglePin(scheduleId.value, discordUserId)

  // 如果是新釘選，需要載入該用戶資料
  if (!wasPinned && success) {
    pinnedStore.fetchPinnedUsers(scheduleId.value)
  }
}

function isPinned(discordUserId: string) {
  return pinnedStore.isPinned(scheduleId.value, discordUserId)
}

function canPin() {
  return pinnedStore.canPin(scheduleId.value)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <MainLayout>
    <div class="p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">打卡進度追蹤</h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">查看所有參與者的打卡狀況</p>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading && store.users.length === 0" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else>
        <!-- Stats Summary -->
        <div v-if="store.scheduleStats" class="mb-6 flex flex-wrap items-center gap-6">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
              <i class="bi bi-people-fill text-sm text-violet-600 dark:text-violet-400"></i>
            </div>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              <strong class="text-slate-800 dark:text-white">{{ store.scheduleStats.uniqueUsers }}</strong> 位參與者
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <i class="bi bi-calendar-check text-sm text-emerald-600 dark:text-emerald-400"></i>
            </div>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              累計 <strong class="text-slate-800 dark:text-white">{{ store.scheduleStats.dailyTasks }}</strong> 天
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <i class="bi bi-check2-all text-sm text-amber-600 dark:text-amber-400"></i>
            </div>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              總打卡 <strong class="text-slate-800 dark:text-white">{{ store.scheduleStats.totalCheckins }}</strong> 次
            </span>
          </div>
        </div>

        <!-- Pinned Users Section -->
        <div v-if="pinnedUsers.length > 0" class="mb-6">
          <div class="mb-3 flex items-center gap-2">
            <i class="bi bi-pin-fill text-violet-500"></i>
            <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">
              釘選用戶 ({{ pinnedUsers.length }}/{{ pinnedStore.MAX_PINNED }})
            </h2>
          </div>
          <div class="overflow-hidden rounded-2xl border-2 border-violet-200 bg-white shadow-sm dark:border-violet-800 dark:bg-slate-800">
            <div class="overflow-x-auto">
              <table class="w-full">
                <!-- Table Header -->
                <thead>
                  <tr class="border-b border-violet-100 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/30">
                    <th class="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] bg-violet-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:bg-violet-900/30 dark:text-slate-200">
                      參與者
                    </th>
                    <th
                      v-for="day in dayLabels"
                      :key="day"
                      class="px-2 py-3 text-center text-xs font-medium text-slate-500 whitespace-nowrap dark:text-slate-400"
                    >
                      {{ day }}
                    </th>
                  </tr>
                </thead>

                <!-- Table Body -->
                <tbody class="divide-y divide-violet-100 dark:divide-violet-800">
                  <tr
                    v-for="user in pinnedUsers"
                    :key="user.discordUserId"
                    class="cursor-pointer transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    @click="goToUserDetail(user.discordUserId)"
                  >
                    <!-- User Info -->
                    <td class="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] px-4 py-3">
                      <div class="flex items-center gap-2">
                        <button
                          class="flex-shrink-0 rounded-lg p-1.5 text-violet-500 transition-colors hover:bg-violet-100 dark:hover:bg-violet-900/50"
                          title="取消釘選"
                          @click="handleTogglePin(user.discordUserId, $event)"
                        >
                          <i class="bi bi-pin-fill text-sm"></i>
                        </button>
                        <img
                          :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
                          :alt="user.displayName"
                          class="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-violet-100 dark:ring-violet-800"
                          loading="lazy"
                        />
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-slate-800 dark:text-white">
                            {{ user.displayName }}
                          </p>
                          <p class="truncate text-xs text-slate-500 dark:text-slate-400">
                            {{ user.totalCheckinDays }} / {{ dayLabels.length }} 天
                          </p>
                        </div>
                      </div>
                    </td>

                    <!-- Check-in Status Cells -->
                    <td
                      v-for="day in dayLabels"
                      :key="day"
                      class="px-2 py-3 text-center"
                    >
                      <span
                        v-if="user.checkinStatus[day]"
                        class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                      >
                        <i class="bi bi-check-lg text-sm"></i>
                      </span>
                      <span
                        v-else
                        class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                      >
                        <i class="bi bi-dash text-sm"></i>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- All Users Table -->
        <div class="mb-3 flex items-center gap-2">
          <i class="bi bi-list-ul text-slate-500"></i>
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">所有參與者</h2>
        </div>
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="overflow-x-auto">
            <table class="w-full">
              <!-- Table Header -->
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                  <th class="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    參與者
                  </th>
                  <th
                    v-for="day in dayLabels"
                    :key="day"
                    class="px-2 py-3 text-center text-xs font-medium text-slate-500 whitespace-nowrap dark:text-slate-400"
                  >
                    {{ day }}
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr
                  v-for="user in store.users"
                  :key="user.discordUserId"
                  class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  @click="goToUserDetail(user.discordUserId)"
                >
                  <!-- User Info -->
                  <td class="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button
                        class="flex-shrink-0 rounded-lg p-1.5 transition-colors"
                        :class="
                          isPinned(user.discordUserId)
                            ? 'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50'
                            : canPin()
                              ? 'text-slate-400 hover:bg-slate-100 hover:text-violet-500 dark:hover:bg-slate-700'
                              : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                        "
                        :title="isPinned(user.discordUserId) ? '取消釘選' : canPin() ? '釘選用戶' : '已達釘選上限'"
                        :disabled="!isPinned(user.discordUserId) && !canPin()"
                        @click="handleTogglePin(user.discordUserId, $event)"
                      >
                        <i :class="['bi text-sm', isPinned(user.discordUserId) ? 'bi-pin-fill' : 'bi-pin']"></i>
                      </button>
                      <img
                        :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
                        :alt="user.displayName"
                        class="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                        loading="lazy"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-slate-800 dark:text-white">
                          {{ user.displayName }}
                        </p>
                        <p class="truncate text-xs text-slate-500 dark:text-slate-400">
                          {{ user.totalCheckinDays }} / {{ dayLabels.length }} 天
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- Check-in Status Cells -->
                  <td
                    v-for="day in dayLabels"
                    :key="day"
                    class="px-2 py-3 text-center"
                  >
                    <span
                      v-if="user.checkinStatus[day]"
                      class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                    >
                      <i class="bi bi-check-lg text-sm"></i>
                    </span>
                    <span
                      v-else
                      class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                    >
                      <i class="bi bi-dash text-sm"></i>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Load More -->
          <div v-if="store.hasMorePages" class="border-t border-slate-200 p-4 text-center dark:border-slate-700">
            <button
              class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-violet-700 disabled:opacity-50"
              :disabled="isLoadingMore"
              @click="loadMore"
            >
              <LoadingSpinner v-if="isLoadingMore" size="sm" />
              {{ isLoadingMore ? '載入中...' : '載入更多' }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="store.users.length === 0"
          class="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="mb-4 flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <i class="bi bi-people text-3xl text-slate-400"></i>
            </div>
          </div>
          <p class="text-slate-500 dark:text-slate-400">尚無參與者資料</p>
        </div>
      </template>
    </div>
  </MainLayout>
</template>
