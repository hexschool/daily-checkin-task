<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import PaginationNav from '@/components/common/PaginationNav.vue'
import UserCard from '@/components/user/UserCard.vue'

const route = useRoute()
const store = useCheckinStore()

const scheduleId = computed(() => route.params.scheduleId as string)
const searchQuery = ref('')

async function loadData(page = 1) {
  await store.fetchUsers(scheduleId.value, {
    page,
    limit: 20,
    search: searchQuery.value || undefined,
  })
}

async function handleSearch(query: string) {
  searchQuery.value = query
  await loadData(1)
}

async function handlePageChange(page: number) {
  await loadData(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">參與者列表</h1>
        <p v-if="store.scheduleStats" class="mt-1 text-slate-500 dark:text-slate-400">
          {{ store.scheduleStats.scheduleName }}
        </p>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <SearchBar
          v-model="searchQuery"
          placeholder="搜尋暱稱或 Discord ID..."
          @search="handleSearch"
        />
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading && store.users.length === 0" class="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <ErrorMessage v-else-if="store.error" :message="store.error" @retry="() => loadData()" />

      <!-- Content -->
      <template v-else>
        <!-- User Grid -->
        <div v-if="store.users.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UserCard
            v-for="user in store.users"
            :key="user.discordUserId"
            :user="user"
            :schedule-id="scheduleId"
            :total-days="store.scheduleStats?.dailyTasks"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-4 flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <i class="bi bi-search text-3xl text-slate-400"></i>
            </div>
          </div>
          <p class="text-slate-500 dark:text-slate-400">
            {{ searchQuery ? '找不到符合的用戶' : '尚無參與者' }}
          </p>
        </div>

        <!-- Pagination -->
        <div v-if="store.pagination && store.users.length > 0" class="mt-8">
          <PaginationNav :pagination="store.pagination" @page-change="handlePageChange" />
        </div>
      </template>
    </div>
  </MainLayout>
</template>
