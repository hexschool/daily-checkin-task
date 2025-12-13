<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
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
          <h1 class="text-2xl font-bold text-white">Dashboard</h1>
          <p class="mt-1 text-slate-400">{{ store.scheduleStats.scheduleName }} 的打卡統計總覽</p>
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
            <div class="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <div class="mb-6 flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-white">每日打卡趨勢</h2>
                  <p class="mt-1 text-sm text-slate-400">查看每日參與人數變化</p>
                </div>
                <div class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                  <span class="h-2 w-2 rounded-full bg-violet-500"></span>
                  <span class="text-xs text-slate-400">打卡人數</span>
                </div>
              </div>
              <div class="h-72">
                <DailyCheckinChart :daily-stats="store.scheduleStats.dailyStats" />
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-6">
            <!-- Discord Link Card -->
            <div class="overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 p-6">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <i class="bi bi-discord text-2xl text-violet-400"></i>
              </div>
              <h3 class="text-lg font-semibold text-white">Discord 頻道</h3>
              <p class="mt-1 text-sm text-slate-400">
                {{ store.scheduleStats.channelInfo?.channelName || '打卡回報區' }}
              </p>
              <a
                :href="store.scheduleStats.channelInfo?.channelId ? `https://discord.com/channels/${store.scheduleStats.channelInfo.guildId}/${store.scheduleStats.channelInfo.channelId}` : '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                前往頻道
                <i class="bi bi-arrow-right"></i>
              </a>
            </div>

            <!-- Recent Activity -->
            <div class="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <h3 class="mb-4 text-lg font-semibold text-white">最近打卡</h3>
              <div class="space-y-3">
                <div
                  v-for="day in store.scheduleStats.dailyStats.slice(-5).reverse()"
                  :key="day.dayLabel"
                  class="flex items-center justify-between rounded-lg bg-white/5 p-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                      <i class="bi bi-calendar-event text-sm text-violet-400"></i>
                    </div>
                    <span class="text-sm font-medium text-white">{{ day.dayLabel }}</span>
                  </div>
                  <span class="text-sm text-slate-400">{{ day.checkinCount }} 人</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </MainLayout>
</template>
