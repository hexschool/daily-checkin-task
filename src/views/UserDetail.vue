<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import UserProfile from '@/components/user/UserProfile.vue'
import CheckinStatusList from '@/components/user/CheckinStatusList.vue'

const route = useRoute()
const store = useCheckinStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const discordUserId = computed(() => route.params.discordUserId as string)

async function loadData() {
  await store.fetchUserDetail(scheduleId.value, discordUserId.value)
}

onMounted(() => {
  loadData()
  if (!store.scheduleStats) {
    store.fetchScheduleStats(scheduleId.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Back Link -->
      <RouterLink
        :to="{ name: 'users', params: { scheduleId } }"
        class="mb-4 inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        返回列表
      </RouterLink>

      <!-- Loading -->
      <div v-if="store.isLoading && !store.currentUser" class="py-20">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.currentUser">
        <!-- User Profile -->
        <div class="mb-6">
          <UserProfile
            :user="store.currentUser"
            :total-days="store.scheduleStats?.dailyTasks"
          />
        </div>

        <!-- Checkin Status List -->
        <CheckinStatusList
          :details="store.currentUser.checkinDetails"
          :schedule-id="scheduleId"
        />
      </template>
    </div>
  </div>
</template>
