<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import StatCard from '@/components/stats/StatCard.vue'
import DailyCheckinChart from '@/components/charts/DailyCheckinChart.vue'

const route = useRoute()
const store = useCheckinStore()

const scheduleId = computed(() => route.params.scheduleId as string)

async function loadData() {
  await store.fetchScheduleStats(scheduleId.value)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <MainLayout>
    <div class="p-8">
      <!-- Loading -->
      <div v-if="store.isLoading && !store.scheduleStats" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.scheduleStats">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">{{ store.scheduleStats.scheduleName }} 的打卡統計總覽</p>
        </div>

        <!-- Stats Cards -->
        <div class="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="總打卡次數"
            :value="store.scheduleStats.totalCheckins"
            unit="次"
            icon="bi-check2-all"
            color="violet"
          />
          <StatCard
            title="參與人數"
            :value="store.scheduleStats.uniqueUsers"
            unit="人"
            icon="bi-people-fill"
            color="emerald"
          />
          <StatCard
            title="累積天數"
            :value="store.scheduleStats.dailyTasks"
            unit="天"
            icon="bi-calendar-check"
            color="amber"
          />
          <StatCard
            title="完成進度"
            :value="store.scheduleStats.progress"
            unit="%"
            icon="bi-graph-up-arrow"
            color="rose"
          />
        </div>

        <!-- Main Content Grid -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Chart -->
          <div class="lg:col-span-2">
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div class="mb-6 flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-800 dark:text-white">每日打卡趨勢</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">查看每日參與人數變化</p>
                </div>
                <div class="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-700">
                  <span class="h-2 w-2 rounded-full bg-violet-500"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-300">打卡人數</span>
                </div>
              </div>
              <div class="h-72">
                <DailyCheckinChart :daily-stats="store.scheduleStats.dailyStats" />
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-6">
            <!-- Recent Activity -->
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 class="mb-4 text-lg font-semibold text-slate-800 dark:text-white">最近打卡</h3>
              <div class="space-y-3">
                <RouterLink
                  v-for="day in store.scheduleStats.dailyStats.slice(-5).reverse()"
                  :key="day.dayLabel"
                  :to="{ name: 'day-detail', params: { scheduleId, dayLabel: day.dayLabel } }"
                  class="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                      <i class="bi bi-calendar-event text-sm text-violet-600 dark:text-violet-400"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ day.dayLabel }}：</span>
                      <span class="text-sm text-slate-500 dark:text-slate-400 truncate">{{ day.threadTitle }}</span>
                    </div>
                  </div>
                  <span class="ml-2 flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">{{ day.checkinCount }} 人</span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </MainLayout>
</template>
