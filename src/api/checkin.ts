import type {
  ScheduleStats,
  UserListResponse,
  UserDetail,
  DayDetail,
  SearchResponse,
  ThreadListResponse,
  UserQueryParams,
} from '@/types/checkin'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function fetchApi<T>(url: string): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`

  let response: Response
  try {
    response = await fetch(fullUrl)
  } catch (e) {
    throw new Error(`無法連接到 API 伺服器 (${API_BASE_URL})`)
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`API 回應格式錯誤，請確認 API 伺服器是否正確運行`)
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || `HTTP ${response.status}`)
  }

  return data.data
}

export const checkinApi = {
  /**
   * 取得排程全局統計
   */
  getStats(scheduleId: string): Promise<ScheduleStats> {
    return fetchApi(`/api/checkin/${scheduleId}/stats`)
  },

  /**
   * 取得排程用戶列表
   */
  getUsers(scheduleId: string, params?: UserQueryParams): Promise<UserListResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    const queryString = query.toString()
    return fetchApi(`/api/checkin/${scheduleId}/users${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 取得用戶打卡詳情
   */
  getUserDetail(scheduleId: string, discordUserId: string): Promise<UserDetail> {
    return fetchApi(`/api/checkin/${scheduleId}/users/${discordUserId}`)
  },

  /**
   * 取得單日打卡詳情
   */
  getDayDetail(scheduleId: string, dayLabel: string): Promise<DayDetail> {
    return fetchApi(`/api/checkin/${scheduleId}/days/${dayLabel}`)
  },

  /**
   * 搜尋用戶
   */
  searchUsers(scheduleId: string, query: string, limit?: number): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query })
    if (limit) params.set('limit', String(limit))
    return fetchApi(`/api/checkin/${scheduleId}/search?${params}`)
  },

  /**
   * 取得討論串列表
   */
  getThreads(scheduleId: string): Promise<ThreadListResponse> {
    return fetchApi(`/api/checkin/${scheduleId}/threads`)
  },
}
