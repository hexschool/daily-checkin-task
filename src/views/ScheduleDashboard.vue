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
    <div class="p-6 lg:p-8">
      <!-- Loading -->
      <div v-if="store.isLoading && !store.scheduleStats" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.scheduleStats">
        <!-- Header -->
        <h1 class="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

        <!-- Stats Cards -->
        <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="每日任務總打卡次數"
            :value="store.scheduleStats.totalCheckins"
            unit="次"
            color="blue"
            icon="check"
          />
          <StatCard
            title="參與打卡人數"
            :value="store.scheduleStats.uniqueUsers"
            unit="人"
            color="cyan"
            icon="users"
          />
          <StatCard
            title="每日任務已經累積"
            :value="store.scheduleStats.dailyTasks"
            unit="天"
            color="yellow"
            icon="calendar"
          />
          <a
            :href="store.scheduleStats.channelInfo?.channelId ? `https://discord.com/channels/${store.scheduleStats.channelInfo.guildId}/${store.scheduleStats.channelInfo.channelId}` : '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="block"
          >
            <StatCard
              title="查看每日任務打卡回報區"
              value="點此前往 Discord"
              color="green"
              icon="arrow"
            />
          </a>
        </div>

        <!-- Chart & Today Task Section -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Chart -->
          <div class="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
            <h2 class="mb-4 text-lg font-semibold text-slate-700">每日任務完成累積數量</h2>
            <div class="h-80">
              <DailyCheckinChart :daily-stats="store.scheduleStats.dailyStats" />
            </div>
          </div>

          <!-- Today Task -->
          <div class="rounded-lg bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-slate-700">今日任務</h2>
            <div class="flex flex-col items-center justify-center py-8">
              <img
                src="https://illustrations.popsy.co/blue/woman-with-a-checked-list.svg"
                alt="Task illustration"
                class="mb-4 h-40 w-40 object-contain"
              />
              <p class="text-center text-blue-600">
                今日無任務，前往
                <a
                  :href="store.scheduleStats.channelInfo?.channelId ? `https://discord.com/channels/${store.scheduleStats.channelInfo.guildId}/${store.scheduleStats.channelInfo.channelId}` : '#'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium underline hover:text-blue-800"
                >
                  Discord
                </a>
                查看歷史任務
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </MainLayout>
</template>
