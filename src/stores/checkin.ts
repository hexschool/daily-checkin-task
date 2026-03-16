import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { checkinApi } from '@/api/checkin'
import type {
  ScheduleStats,
  UserCheckinItem,
  UserDetail,
  DayDetail,
  Pagination,
  SearchResult,
  UserQueryParams,
} from '@/types/checkin'

export const useCheckinStore = defineStore('checkin', () => {
  // 狀態
  const scheduleStats = ref<ScheduleStats | null>(null)
  const users = ref<UserCheckinItem[]>([])
  const currentUser = ref<UserDetail | null>(null)
  const myUserDetail = ref<UserDetail | null>(null)
  const currentDayDetail = ref<DayDetail | null>(null)
  const pagination = ref<Pagination | null>(null)
  const searchResults = ref<SearchResult[]>([])

  // 載入狀態
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const hasUsers = computed(() => users.value.length > 0)
  const hasMorePages = computed(() => pagination.value?.hasNextPage ?? false)

  // Actions
  async function fetchScheduleStats(scheduleId: string) {
    isLoading.value = true
    error.value = null
    try {
      scheduleStats.value = await checkinApi.getStats(scheduleId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得統計資料失敗'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUsers(scheduleId: string, params?: UserQueryParams) {
    isLoading.value = true
    error.value = null
    try {
      const response = await checkinApi.getUsers(scheduleId, params)
      users.value = response.users
      pagination.value = response.pagination
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得用戶列表失敗'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMoreUsers(scheduleId: string, params?: UserQueryParams) {
    if (!pagination.value?.hasNextPage) return

    isLoading.value = true
    error.value = null
    try {
      const nextPage = (pagination.value?.currentPage ?? 0) + 1
      const response = await checkinApi.getUsers(scheduleId, {
        ...params,
        page: nextPage,
      })
      users.value = [...users.value, ...response.users]
      pagination.value = response.pagination
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入更多用戶失敗'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserDetail(scheduleId: string, discordUserId: string) {
    isLoading.value = true
    error.value = null
    try {
      currentUser.value = await checkinApi.getUserDetail(scheduleId, discordUserId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得用戶詳情失敗'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDayDetail(scheduleId: string, dayLabel: string) {
    isLoading.value = true
    error.value = null
    try {
      currentDayDetail.value = await checkinApi.getDayDetail(scheduleId, dayLabel)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得單日詳情失敗'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function searchUsers(scheduleId: string, query: string, limit?: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await checkinApi.searchUsers(scheduleId, query, limit)
      searchResults.value = response.results
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : '搜尋用戶失敗'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyUserDetail(scheduleId: string, discordUserId: string) {
    try {
      myUserDetail.value = await checkinApi.getUserDetail(scheduleId, discordUserId)
    } catch (e) {
      console.error('Failed to fetch my user detail:', e)
    }
  }

  function clearError() {
    error.value = null
  }

  function clearSearchResults() {
    searchResults.value = []
  }

  function $reset() {
    scheduleStats.value = null
    users.value = []
    currentUser.value = null
    myUserDetail.value = null
    currentDayDetail.value = null
    pagination.value = null
    searchResults.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    scheduleStats,
    users,
    currentUser,
    myUserDetail,
    currentDayDetail,
    pagination,
    searchResults,
    isLoading,
    error,

    // Computed
    hasUsers,
    hasMorePages,

    // Actions
    fetchScheduleStats,
    fetchUsers,
    fetchMoreUsers,
    fetchUserDetail,
    fetchMyUserDetail,
    fetchDayDetail,
    searchUsers,
    clearError,
    clearSearchResults,
    $reset,
  }
})
