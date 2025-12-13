# 202512 - Discord 每日打卡前端介面開發指南

## 目錄

1. [專案概述](#專案概述)
2. [系統架構](#系統架構)
3. [環境配置](#環境配置)
4. [路由設計](#路由設計)
5. [API 規格](#api-規格)
6. [TypeScript 型別定義](#typescript-型別定義)
7. [資料流設計](#資料流設計)
8. [頁面與元件規劃](#頁面與元件規劃)
9. [專案目錄結構](#專案目錄結構)
10. [設計原則](#設計原則)

---

## 專案概述

本專案為 Discord 每日打卡系統的前端介面，提供用戶檢視特定排程下的打卡狀況。系統會每日檢視 Discord 特定頻道並搜集討論串資訊，前端負責將這些資料以可視化方式呈現給用戶。

### 核心功能

1. **全局打卡統計** - 檢視特定排程的總體打卡概況
2. **用戶打卡列表** - 瀏覽所有參與者的打卡狀況
3. **個人打卡詳情** - 查看特定用戶的打卡記錄
4. **單日打卡明細** - 查看特定天的打卡狀況
5. **用戶搜尋** - 透過暱稱或 Discord ID 搜尋用戶

### 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.x | 前端框架 |
| TypeScript | 5.9.x | 型別安全 |
| Vite | 7.x | 建置工具 |
| Pinia | 3.x | 狀態管理 |
| Vue Router | 4.x | 路由管理 |
| Tailwind CSS | 4.x | 樣式框架 |

---

## 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                        前端應用程式                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Views     │  │  Components │  │   Stores    │          │
│  │  (頁面)     │  │  (元件)      │  │  (狀態)     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         └────────────────┴────────────────┘                  │
│                          │                                   │
│                  ┌───────┴───────┐                           │
│                  │   API Service │                           │
│                  └───────┬───────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    後端 API 伺服器      │
              │  (VITE_API_BASE_URL)   │
              └────────────────────────┘
```

---

## 環境配置

### 環境變數

建立 `.env` 檔案：

```env
# API 伺服器位置
VITE_API_BASE_URL=http://localhost:3000
```

### 環境變數說明

| 變數名稱 | 說明 | 預設值 | 必填 |
|----------|------|--------|------|
| `VITE_API_BASE_URL` | API 伺服器位置 | `http://localhost:3000` | 是 |

### 多環境配置

```
.env                # 所有環境共用
.env.local          # 本地開發（不納入版控）
.env.development    # 開發環境
.env.production     # 正式環境
```

---

## 路由設計

| 路由路徑 | 頁面名稱 | 說明 |
|----------|----------|------|
| `/:scheduleId` | ScheduleDashboard | 排程儀表板首頁 |
| `/:scheduleId/users` | UserList | 用戶列表頁 |
| `/:scheduleId/users/:discordUserId` | UserDetail | 用戶打卡詳情頁 |
| `/:scheduleId/days/:dayLabel` | DayDetail | 單日打卡詳情頁 |

### 路由參數

- `scheduleId`: 排程 UUID（由系統預先帶入）
- `discordUserId`: Discord 用戶 ID
- `dayLabel`: 天數標籤（如 Day1, Day2）

### 路由設定範例

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:scheduleId',
      name: 'dashboard',
      component: () => import('@/views/ScheduleDashboard.vue'),
    },
    {
      path: '/:scheduleId/users',
      name: 'users',
      component: () => import('@/views/UserList.vue'),
    },
    {
      path: '/:scheduleId/users/:discordUserId',
      name: 'user-detail',
      component: () => import('@/views/UserDetail.vue'),
    },
    {
      path: '/:scheduleId/days/:dayLabel',
      name: 'day-detail',
      component: () => import('@/views/DayDetail.vue'),
    },
  ],
})

export default router
```

---

## API 規格

### 基礎設定

所有 API 皆為公開端點，不需要認證即可存取。

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
```

### API 端點總覽

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/checkin/{scheduleId}/stats` | 取得排程全局統計 |
| GET | `/api/checkin/{scheduleId}/users` | 取得排程用戶列表 |
| GET | `/api/checkin/{scheduleId}/users/{discordUserId}` | 取得用戶打卡詳情 |
| GET | `/api/checkin/{scheduleId}/days/{dayLabel}` | 取得單日打卡詳情 |
| GET | `/api/checkin/{scheduleId}/search` | 搜尋用戶 |
| GET | `/api/checkin/{scheduleId}/threads` | 取得討論串列表 |

---

### 1. 取得排程全局統計

**端點**: `GET /api/checkin/{scheduleId}/stats`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `scheduleId` | `string (uuid)` | 是 | 排程 ID |

**回應範例**:

```json
{
  "success": true,
  "data": {
    "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
    "scheduleName": "2024 冬季挑戰賽",
    "totalCheckins": 1250,
    "dailyTasks": 30,
    "expectedTasks": 30,
    "progress": 100,
    "uniqueUsers": 42,
    "channelInfo": {
      "channelId": "123456789012345678",
      "channelName": "每日打卡",
      "guildId": "987654321098765432",
      "guildName": "六角學院"
    },
    "dailyStats": [
      {
        "dayLabel": "Day1",
        "date": "2024-12-01T00:00:00.000Z",
        "checkinCount": 42,
        "threadId": "111222333444555666"
      }
    ]
  }
}
```

---

### 2. 取得排程用戶列表

**端點**: `GET /api/checkin/{scheduleId}/users`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `scheduleId` | `string (uuid)` | 是 | 排程 ID |

**查詢參數**:

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `page` | `integer` | 否 | `1` | 頁碼 |
| `limit` | `integer` | 否 | `50` | 每頁數量（最大 100） |
| `search` | `string` | 否 | - | 搜尋關鍵字（暱稱或 Discord ID） |

**回應範例**:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "discordUserId": "123456789012345678",
        "username": "user#1234",
        "displayName": "小明",
        "avatarUrl": "https://cdn.discordapp.com/avatars/...",
        "totalCheckinDays": 28,
        "checkinStatus": {
          "Day1": true,
          "Day2": true,
          "Day3": false
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 42,
      "limit": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3. 取得用戶打卡詳情

**端點**: `GET /api/checkin/{scheduleId}/users/{discordUserId}`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `scheduleId` | `string (uuid)` | 是 | 排程 ID |
| `discordUserId` | `string` | 是 | Discord 用戶 ID |

**回應範例**:

```json
{
  "success": true,
  "data": {
    "discordUserId": "123456789012345678",
    "username": "user#1234",
    "displayName": "小明",
    "avatarUrl": "https://cdn.discordapp.com/avatars/...",
    "totalCheckinDays": 28,
    "checkinDetails": [
      {
        "dayLabel": "Day1",
        "date": "2024-12-01T00:00:00.000Z",
        "checkedIn": true,
        "checkinTime": "2024-12-01T08:30:00.000Z",
        "messageId": "111222333444555666",
        "threadId": "999888777666555444"
      }
    ]
  }
}
```

---

### 4. 取得單日打卡詳情

**端點**: `GET /api/checkin/{scheduleId}/days/{dayLabel}`

**路徑參數**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `scheduleId` | `string (uuid)` | 是 | 排程 ID |
| `dayLabel` | `string` | 是 | Day 標籤（如 Day1、Day2） |

**回應範例**:

```json
{
  "success": true,
  "data": {
    "dayLabel": "Day1",
    "date": "2024-12-01T00:00:00.000Z",
    "threadInfo": {
      "threadId": "999888777666555444",
      "threadName": "Day1 - 12/1 每日打卡",
      "threadUrl": "https://discord.com/channels/..."
    },
    "checkinCount": 42,
    "checkinUsers": [
      {
        "discordUserId": "123456789012345678",
        "username": "user#1234",
        "displayName": "小明",
        "avatarUrl": "https://cdn.discordapp.com/avatars/...",
        "checkinTime": "2024-12-01T08:30:00.000Z"
      }
    ]
  }
}
```

---

### 5. 搜尋用戶

**端點**: `GET /api/checkin/{scheduleId}/search`

**查詢參數**:

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `q` | `string` | 是 | - | 搜尋關鍵字 |
| `limit` | `integer` | 否 | `10` | 結果數量限制 |

**回應範例**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "discordUserId": "123456789012345678",
        "username": "user#1234",
        "displayName": "小明",
        "avatarUrl": "https://cdn.discordapp.com/avatars/...",
        "totalCheckinDays": 28
      }
    ],
    "query": "小明",
    "count": 1
  }
}
```

---

### 6. 取得討論串列表

**端點**: `GET /api/checkin/{scheduleId}/threads`

**回應範例**:

```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "threadId": "999888777666555444",
        "dayLabel": "Day1",
        "threadName": "Day1 - 12/1 每日打卡",
        "threadUrl": "https://discord.com/channels/...",
        "date": "2024-12-01T00:00:00.000Z",
        "checkinCount": 42
      }
    ],
    "count": 30
  }
}
```

---

### 錯誤處理

**標準錯誤回應格式**:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "排程不存在"
  }
}
```

**HTTP 狀態碼**:

| 狀態碼 | 說明 |
|--------|------|
| `200` | 成功 |
| `400` | 請求參數錯誤 |
| `404` | 資源不存在 |
| `500` | 伺服器錯誤 |

---

## TypeScript 型別定義

```typescript
// types/checkin.ts

// ===== 排程統計 =====
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
}

export interface ChannelInfo {
  channelId: string
  channelName: string
  guildId: string
  guildName: string
}

export interface DailyStat {
  dayLabel: string
  date: string
  checkinCount: number
  threadId: string
}

// ===== 用戶列表 =====
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

// ===== 用戶詳情 =====
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
  date: string
  checkedIn: boolean
  checkinTime: string | null
  messageId: string | null
  threadId: string
}

// ===== 單日詳情 =====
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

// ===== 搜尋 =====
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

// ===== 討論串列表 =====
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

// ===== API 回應 =====
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

---

## 資料流設計

### 主要 Store

```typescript
// stores/checkin.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkinApi } from '@/api/checkin'
import type {
  ScheduleStats,
  UserCheckinItem,
  UserDetail,
  DayDetail,
  Pagination,
} from '@/types/checkin'

export const useCheckinStore = defineStore('checkin', () => {
  // 狀態
  const scheduleStats = ref<ScheduleStats | null>(null)
  const users = ref<UserCheckinItem[]>([])
  const currentUser = ref<UserDetail | null>(null)
  const currentDayDetail = ref<DayDetail | null>(null)
  const pagination = ref<Pagination | null>(null)

  // 載入狀態
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchScheduleStats(scheduleId: string) {
    isLoading.value = true
    error.value = null
    try {
      scheduleStats.value = await checkinApi.getStats(scheduleId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得統計資料失敗'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUsers(
    scheduleId: string,
    params?: { page?: number; limit?: number; search?: string }
  ) {
    isLoading.value = true
    error.value = null
    try {
      const response = await checkinApi.getUsers(scheduleId, params)
      users.value = response.users
      pagination.value = response.pagination
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得用戶列表失敗'
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
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    scheduleStats,
    users,
    currentUser,
    currentDayDetail,
    pagination,
    isLoading,
    error,

    // Actions
    fetchScheduleStats,
    fetchUsers,
    fetchUserDetail,
    fetchDayDetail,
    clearError,
  }
})
```

### API 服務層

```typescript
// api/checkin.ts
import type {
  ScheduleStats,
  UserListResponse,
  UserDetail,
  DayDetail,
  SearchResponse,
  ThreadListResponse,
} from '@/types/checkin'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP ${response.status}`)
  }
  const data = await response.json()
  return data.data
}

export const checkinApi = {
  getStats(scheduleId: string): Promise<ScheduleStats> {
    return fetchApi(`/api/checkin/${scheduleId}/stats`)
  },

  getUsers(
    scheduleId: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<UserListResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    const queryString = query.toString()
    return fetchApi(`/api/checkin/${scheduleId}/users${queryString ? `?${queryString}` : ''}`)
  },

  getUserDetail(scheduleId: string, discordUserId: string): Promise<UserDetail> {
    return fetchApi(`/api/checkin/${scheduleId}/users/${discordUserId}`)
  },

  getDayDetail(scheduleId: string, dayLabel: string): Promise<DayDetail> {
    return fetchApi(`/api/checkin/${scheduleId}/days/${dayLabel}`)
  },

  searchUsers(scheduleId: string, query: string, limit?: number): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query })
    if (limit) params.set('limit', String(limit))
    return fetchApi(`/api/checkin/${scheduleId}/search?${params}`)
  },

  getThreads(scheduleId: string): Promise<ThreadListResponse> {
    return fetchApi(`/api/checkin/${scheduleId}/threads`)
  },
}
```

---

## 頁面與元件規劃

### 1. 排程儀表板 (ScheduleDashboard)

**路徑**: `/:scheduleId`

**功能**:
- 顯示排程基本資訊
- 總打卡次數統計
- 每日任務進度
- 每日打卡人數圖表/列表

**子元件**:
- `StatsOverview` - 統計概覽卡片
- `DailyProgressList` - 每日打卡進度列表
- `ChannelInfoCard` - Discord 頻道資訊

### 2. 用戶列表頁 (UserList)

**路徑**: `/:scheduleId/users`

**功能**:
- 顯示所有參與打卡的用戶
- 用戶搜尋功能
- 分頁瀏覽
- 每位用戶的累計打卡天數

**子元件**:
- `SearchBar` - 搜尋列
- `UserCard` - 用戶卡片
- `PaginationNav` - 分頁元件

### 3. 用戶詳情頁 (UserDetail)

**路徑**: `/:scheduleId/users/:discordUserId`

**功能**:
- 用戶基本資訊（頭像、暱稱）
- 打卡日曆/列表
- 每日打卡狀態視覺化

**子元件**:
- `UserProfile` - 用戶檔案
- `CheckinCalendar` - 打卡日曆
- `CheckinStatusList` - 打卡記錄列表

### 4. 單日詳情頁 (DayDetail)

**路徑**: `/:scheduleId/days/:dayLabel`

**功能**:
- 該日打卡人數統計
- 打卡用戶列表
- Discord 討論串連結

**子元件**:
- `DayHeader` - 日期標題與統計
- `CheckinUserGrid` - 打卡用戶網格
- `ThreadLinkButton` - 討論串連結

---

## 專案目錄結構

```
src/
├── api/                    # API 服務層
│   ├── index.ts           # API 基礎設定
│   └── checkin.ts         # 打卡相關 API
├── assets/
│   └── all.css            # 全域樣式
├── components/            # 共用元件
│   ├── common/            # 通用元件
│   │   ├── LoadingSpinner.vue
│   │   ├── ErrorMessage.vue
│   │   ├── PaginationNav.vue
│   │   └── SearchBar.vue
│   ├── stats/             # 統計相關元件
│   │   ├── StatsOverview.vue
│   │   ├── DailyProgressList.vue
│   │   └── ChannelInfoCard.vue
│   ├── user/              # 用戶相關元件
│   │   ├── UserCard.vue
│   │   ├── UserProfile.vue
│   │   ├── CheckinCalendar.vue
│   │   └── CheckinStatusList.vue
│   └── day/               # 單日相關元件
│       ├── DayHeader.vue
│       ├── CheckinUserGrid.vue
│       └── ThreadLinkButton.vue
├── composables/           # 組合式函式
│   ├── useCheckinStats.ts
│   ├── useUserSearch.ts
│   └── usePagination.ts
├── router/
│   └── index.ts           # 路由設定
├── stores/
│   └── checkin.ts         # 打卡狀態管理
├── types/                 # TypeScript 型別
│   ├── api.ts             # API 通用型別
│   └── checkin.ts         # 打卡相關型別
├── views/                 # 頁面元件
│   ├── ScheduleDashboard.vue
│   ├── UserList.vue
│   ├── UserDetail.vue
│   └── DayDetail.vue
├── App.vue
└── main.ts
```

---

## 設計原則

### 1. 單一排程原則

- 每位用戶只會看到特定的排程（由 URL 參數 `scheduleId` 決定）
- 不顯示排程列表或切換功能
- 排程 ID 由外部系統帶入

### 2. 公開 API

- 所有打卡相關 API 不需要認證
- 任何人都可以存取打卡統計資訊

### 3. 響應式設計

- 支援桌面與行動裝置
- 使用 Tailwind CSS 實現響應式布局

### 4. 效能考量

- 使用分頁載入用戶列表
- 實作搜尋防抖（debounce）
- 適當使用 `computed` 快取計算結果

### 5. 使用者體驗

- 載入狀態顯示
- 錯誤訊息友善呈現
- 空狀態處理

---

## 常用指令

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 型別檢查 + 正式環境建置
pnpm build

# 僅執行型別檢查
pnpm type-check

# ESLint 檢查並自動修復
pnpm lint
```
