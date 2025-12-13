<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import DayHeader from '@/components/day/DayHeader.vue'
import CheckinUserGrid from '@/components/day/CheckinUserGrid.vue'

const route = useRoute()
const store = useCheckinStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const dayLabel = computed(() => route.params.dayLabel as string)

async function loadData() {
  await store.fetchDayDetail(scheduleId.value, dayLabel.value)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <MainLayout>
    <div class="p-8">
      <!-- Back Link -->
      <RouterLink
        :to="{ name: 'dashboard', params: { scheduleId } }"
        class="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <i class="bi bi-arrow-left"></i>
        返回 Dashboard
      </RouterLink>

      <!-- Loading -->
      <div v-if="store.isLoading && !store.currentDayDetail" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else-if="store.currentDayDetail">
        <!-- Day Header -->
        <div class="mb-8">
          <DayHeader :day-detail="store.currentDayDetail" />
        </div>

        <!-- Checkin User Grid -->
        <CheckinUserGrid
          :users="store.currentDayDetail.checkinUsers"
          :schedule-id="scheduleId"
        />
      </template>
    </div>
  </MainLayout>
</template>
