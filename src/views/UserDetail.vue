<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import MainLayout from '@/components/layout/MainLayout.vue'
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
  <MainLayout>
    <div class="p-8">
      <!-- Back Link -->
      <RouterLink
        :to="{ name: 'progress', params: { scheduleId } }"
        class="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <i class="bi bi-arrow-left"></i>
        返回進度追蹤
      </RouterLink>

      <!-- Loading -->
      <div v-if="store.isLoading && !store.currentUser" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.currentUser">
        <!-- User Profile -->
        <div class="mb-8">
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
  </MainLayout>
</template>
