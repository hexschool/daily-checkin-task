<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import StatsOverview from '@/components/stats/StatsOverview.vue'
import DailyProgressList from '@/components/stats/DailyProgressList.vue'
import ChannelInfoCard from '@/components/stats/ChannelInfoCard.vue'

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
  <div class="min-h-screen bg-gray-100">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Loading -->
      <div v-if="store.isLoading && !store.scheduleStats" class="py-20">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.scheduleStats">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold">{{ store.scheduleStats.scheduleName }}</h1>
          <p class="text-gray-500">每日打卡統計</p>
        </div>

        <!-- Stats Overview -->
        <div class="mb-6">
          <StatsOverview :stats="store.scheduleStats" />
        </div>

        <!-- Quick Links -->
        <div class="mb-6">
          <RouterLink
            :to="{ name: 'users', params: { scheduleId } }"
            class="flex items-center justify-between rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
          >
            <div>
              <p class="font-medium">查看所有參與者</p>
              <p class="text-sm text-gray-500">共 {{ store.scheduleStats.uniqueUsers }} 人參與</p>
            </div>
            <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </RouterLink>
        </div>

        <!-- Channel Info & Daily Progress -->
        <div class="grid gap-6 md:grid-cols-3">
          <div class="md:col-span-1">
            <ChannelInfoCard :channel-info="store.scheduleStats.channelInfo" />
          </div>
          <div class="md:col-span-2">
            <DailyProgressList
              :daily-stats="store.scheduleStats.dailyStats"
              :schedule-id="scheduleId"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
