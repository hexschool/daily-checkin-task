<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

const route = useRoute()
const router = useRouter()
const store = useCheckinStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const isLoadingMore = ref(false)

const dayLabels = computed(() => {
  if (!store.scheduleStats?.dailyStats) return []
  return store.scheduleStats.dailyStats.map((stat) => stat.dayLabel)
})

async function loadData() {
  if (!store.scheduleStats) {
    await store.fetchScheduleStats(scheduleId.value)
  }
  await store.fetchUsers(scheduleId.value, { limit: 50 })
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

        <!-- Table Container -->
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="overflow-x-auto">
            <table class="w-full min-w-max">
              <!-- Table Header -->
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                  <th class="sticky left-0 z-10 bg-slate-50 px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    參與者
                  </th>
                  <th
                    v-for="day in dayLabels"
                    :key="day"
                    class="px-3 py-4 text-center text-xs font-medium text-slate-500 whitespace-nowrap dark:text-slate-400"
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
                  <td class="sticky left-0 z-10 bg-white px-6 py-4 dark:bg-slate-800">
                    <div class="flex items-center gap-3">
                      <img
                        :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
                        :alt="user.displayName"
                        class="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                        loading="lazy"
                      />
                      <div class="min-w-0">
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
                    class="px-3 py-4 text-center"
                  >
                    <span
                      v-if="user.checkinStatus[day]"
                      class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                    >
                      <i class="bi bi-check-lg"></i>
                    </span>
                    <span
                      v-else
                      class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                    >
                      <i class="bi bi-dash"></i>
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
