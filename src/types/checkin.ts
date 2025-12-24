// 打卡計算模式
export type CheckinMode = 'standard' | 'extended' | 'all_period'

// 排程統計
export interface ScheduleStats {
  scheduleId: string
  scheduleName: string
  totalCheckins: number
  dailyTasks: number
  expectedTasks: number
  progress: number
  uniqueUsers: number
  channelInfo: ChannelInfo
  dailyStats: DailyStat[]
  checkinMode: CheckinMode
  extendedHours?: number
}

export interface ChannelInfo {
  channelId: string
  channelName: string
  guildId: string
  guildName: string
}

export interface DailyStat {
  dayLabel: string
  dayNumber: number
  date: string
  threadTitle: string
  threadUrl: string
  checkinCount: number
}

// 用戶列表
export interface UserCheckinItem {
  discordUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalCheckinDays: number
  checkinStatus: Record<string, boolean>
}

export interface UserListResponse {
  users: UserCheckinItem[]
  pagination: Pagination
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// 用戶詳情
export interface UserDetail {
  discordUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalCheckinDays: number
  checkinDetails: CheckinDetailItem[]
}

export interface CheckinDetailItem {
  dayLabel: string
  dayNumber: number
  date: string
  checkedIn: boolean
  checkinTime: string | null
  messageId: string | null
  threadId: string
  threadTitle: string
  threadUrl: string
}

// 單日詳情
export interface DayDetail {
  dayLabel: string
  date: string
  threadInfo: ThreadInfo
  checkinCount: number
  checkinUsers: DayCheckinUser[]
}

export interface ThreadInfo {
  threadId: string
  threadName: string
  threadUrl: string
}

export interface DayCheckinUser {
  discordUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  checkinTime: string
}

// 搜尋
export interface SearchResponse {
  results: SearchResult[]
  query: string
  count: number
}

export interface SearchResult {
  discordUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalCheckinDays: number
}

// 討論串列表
export interface ThreadListResponse {
  threads: ThreadListItem[]
  count: number
}

export interface ThreadListItem {
  threadId: string
  dayLabel: string
  threadName: string
  threadUrl: string
  date: string
  checkinCount: number
}

// API 回應
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// 查詢參數
export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
}
