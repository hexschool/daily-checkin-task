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

// 所有天數的標籤（從 dailyStats 獲取）
const dayLabels = computed(() => {
  if (!store.scheduleStats?.dailyStats) return []
  return store.scheduleStats.dailyStats.map((stat) => stat.dayLabel)
})

// 載入初始資料
async function loadData() {
  // 先載入統計資料以獲取所有天數
  if (!store.scheduleStats) {
    await store.fetchScheduleStats(scheduleId.value)
  }
  // 載入所有用戶（需要較大的 limit 以獲取完整的打卡狀態）
  await store.fetchUsers(scheduleId.value, { limit: 50 })
}

// 載入更多用戶
async function loadMore() {
  if (isLoadingMore.value || !store.hasMorePages) return
  isLoadingMore.value = true
  await store.fetchMoreUsers(scheduleId.value, { limit: 50 })
  isLoadingMore.value = false
}

// 點擊用戶跳轉到詳情頁
function goToUserDetail(discordUserId: string) {
  router.push({
    name: 'user-detail',
    params: { scheduleId: scheduleId.value, discordUserId },
  })
}

// 生成預設頭像
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
    <div class="p-6 lg:p-8">
      <!-- Header -->
      <h1 class="mb-6 text-2xl font-bold text-slate-800">打卡進度追蹤</h1>

      <!-- Loading -->
      <div v-if="store.isLoading && store.users.length === 0" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="loadData" />

      <!-- Content -->
      <template v-else>
        <!-- Stats Summary -->
        <div v-if="store.scheduleStats" class="mb-6 flex flex-wrap gap-4 text-sm text-slate-600">
          <span>共 <strong class="text-slate-800">{{ store.scheduleStats.uniqueUsers }}</strong> 位參與者</span>
          <span>|</span>
          <span>累計 <strong class="text-slate-800">{{ store.scheduleStats.dailyTasks }}</strong> 天</span>
          <span>|</span>
          <span>總打卡 <strong class="text-slate-800">{{ store.scheduleStats.totalCheckins }}</strong> 次</span>
        </div>

        <!-- Table Container -->
        <div class="overflow-hidden rounded-lg bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full min-w-max">
              <!-- Table Header -->
              <thead class="bg-slate-50">
                <tr>
                  <th class="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                    用戶
                  </th>
                  <th
                    v-for="day in dayLabels"
                    :key="day"
                    class="px-3 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap"
                  >
                    {{ day }}
                  </th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="user in store.users"
                  :key="user.discordUserId"
                  class="cursor-pointer transition-colors hover:bg-blue-50"
                  @click="goToUserDetail(user.discordUserId)"
                >
                  <!-- User Info (Sticky Column) -->
                  <td class="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-blue-50">
                    <div class="flex items-center gap-3">
                      <img
                        :src="user.avatarUrl || getDefaultAvatar(user.discordUserId)"
                        :alt="user.displayName"
                        class="h-8 w-8 rounded-full object-cover"
                        loading="lazy"
                      />
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-slate-800">
                          {{ user.displayName }}
                        </p>
                        <p class="truncate text-xs text-slate-500">
                          {{ user.totalCheckinDays }} / {{ dayLabels.length }} 天
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- Check-in Status Cells -->
                  <td
                    v-for="day in dayLabels"
                    :key="day"
                    class="px-3 py-3 text-center"
                  >
                    <span
                      v-if="user.checkinStatus[day]"
                      class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600"
                    >
                      <i class="bi bi-check-lg"></i>
                    </span>
                    <span
                      v-else
                      class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    >
                      <i class="bi bi-dash"></i>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Load More -->
          <div v-if="store.hasMorePages" class="border-t border-slate-100 p-4 text-center">
            <button
              class="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
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
          class="rounded-lg bg-white py-12 text-center shadow-sm"
        >
          <p class="text-slate-500">尚無參與者資料</p>
        </div>
      </template>
    </div>
  </MainLayout>
</template>
