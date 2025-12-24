<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import { usePinnedStore } from '@/stores/pinned'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import ProgressHero from '@/components/stats/ProgressHero.vue'
import DailyCheckinChart from '@/components/charts/DailyCheckinChart.vue'

const route = useRoute()
const store = useCheckinStore()
const pinnedStore = usePinnedStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const pinnedUsers = computed(() => pinnedStore.getPinnedUserList(scheduleId.value))

async function loadData() {
  await store.fetchScheduleStats(scheduleId.value)
  // 載入釘選用戶資料
  await pinnedStore.fetchPinnedUsers(scheduleId.value)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <MainLayout>
    <div class="p-4 sm:p-6 lg:p-8">
      <!-- Loading -->
      <div v-if="store.isLoading && !store.scheduleStats" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.scheduleStats">
        <!-- Progress Hero (含標題與釘選用戶進度) -->
        <div class="mb-6">
          <ProgressHero
            title="Dashboard"
            :subtitle="`${store.scheduleStats.scheduleName} 的打卡統計總覽`"
            :daily-tasks="store.scheduleStats.dailyTasks"
            :expected-tasks="store.scheduleStats.expectedTasks"
            :progress="store.scheduleStats.progress"
            :total-checkins="store.scheduleStats.totalCheckins"
            :unique-users="store.scheduleStats.uniqueUsers"
            :pinned-users="pinnedUsers"
            :checkin-mode="store.scheduleStats.checkinMode"
            :extended-hours="store.scheduleStats.extendedHours"
          />
        </div>

        <!-- Main Content Grid -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Chart -->
          <div class="lg:col-span-2">
            <div
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
            >
              <div class="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-base font-semibold text-slate-800 dark:text-white sm:text-lg">每日打卡趨勢</h2>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
                    查看每日參與人數變化
                  </p>
                </div>
                <div
                  class="flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-700"
                >
                  <span class="h-2 w-2 rounded-full bg-violet-500"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-300">打卡人數</span>
                </div>
              </div>
              <div class="h-56 sm:h-72">
                <DailyCheckinChart :daily-stats="store.scheduleStats.dailyStats" />
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div>
            <div
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
            >
              <h3 class="mb-4 text-base font-semibold text-slate-800 dark:text-white sm:text-lg">最近打卡</h3>
              <div class="space-y-2 sm:space-y-3">
                <RouterLink
                  v-for="day in store.scheduleStats.dailyStats.slice(-5).reverse()"
                  :key="day.dayLabel"
                  :to="{ name: 'day-detail', params: { scheduleId, dayLabel: day.dayLabel } }"
                  class="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 sm:p-3"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <div
                      class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50 sm:h-8 sm:w-8"
                    >
                      <i
                        class="bi bi-calendar-event text-xs text-violet-600 dark:text-violet-400 sm:text-sm"
                      ></i>
                    </div>
                    <div class="min-w-0 flex-1 truncate">
                      <span class="text-xs text-slate-500 dark:text-slate-400">
                        {{ day.threadTitle }}
                      </span>
                    </div>
                  </div>
                  <span
                    class="ml-2 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:text-sm"
                  >
                    {{ day.checkinCount }} 人
                  </span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </MainLayout>
</template>
