import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { checkinApi } from '@/api/checkin'
import type { UserCheckinItem } from '@/types/checkin'

const STORAGE_KEY = 'pinned-users'
const MAX_PINNED = 5

interface PinnedStorage {
  [scheduleId: string]: string[] // discordUserId array
}

export const usePinnedStore = defineStore('pinned', () => {
  // 從 localStorage 讀取釘選資料
  const pinnedMap = ref<PinnedStorage>(loadFromStorage())

  // 釘選用戶的完整資料 (用於顯示)
  const pinnedUserDetails = ref<Map<string, UserCheckinItem>>(new Map())

  // 載入狀態
  const isLoadingPinned = ref(false)

  function loadFromStorage(): PinnedStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedMap.value))
  }

  // 監聽變化自動儲存
  watch(pinnedMap, saveToStorage, { deep: true })

  // 取得特定排程的釘選用戶 IDs
  function getPinnedIds(scheduleId: string): string[] {
    return pinnedMap.value[scheduleId] || []
  }

  // 檢查用戶是否被釘選
  function isPinned(scheduleId: string, discordUserId: string): boolean {
    return getPinnedIds(scheduleId).includes(discordUserId)
  }

  // 取得釘選數量
  function getPinnedCount(scheduleId: string): number {
    return getPinnedIds(scheduleId).length
  }

  // 是否可以繼續釘選
  function canPin(scheduleId: string): boolean {
    return getPinnedCount(scheduleId) < MAX_PINNED
  }

  // 釘選用戶
  function pinUser(scheduleId: string, discordUserId: string): boolean {
    if (!canPin(scheduleId)) return false
    if (isPinned(scheduleId, discordUserId)) return true

    if (!pinnedMap.value[scheduleId]) {
      pinnedMap.value[scheduleId] = []
    }
    pinnedMap.value[scheduleId].push(discordUserId)
    return true
  }

  // 取消釘選
  function unpinUser(scheduleId: string, discordUserId: string) {
    const ids = pinnedMap.value[scheduleId]
    if (!ids) return

    const index = ids.indexOf(discordUserId)
    if (index !== -1) {
      ids.splice(index, 1)
      // 同時從詳細資料中移除
      pinnedUserDetails.value.delete(discordUserId)
    }
  }

  // 切換釘選狀態
  function togglePin(scheduleId: string, discordUserId: string): boolean {
    if (isPinned(scheduleId, discordUserId)) {
      unpinUser(scheduleId, discordUserId)
      return false
    } else {
      return pinUser(scheduleId, discordUserId)
    }
  }

  // 取得釘選用戶的詳細資料列表
  function getPinnedUserList(scheduleId: string): UserCheckinItem[] {
    const ids = getPinnedIds(scheduleId)
    return ids
      .map(id => pinnedUserDetails.value.get(id))
      .filter((user): user is UserCheckinItem => user !== undefined)
  }

  // 載入所有釘選用戶的詳細資料
  async function fetchPinnedUsers(scheduleId: string) {
    const ids = getPinnedIds(scheduleId)
    if (ids.length === 0) return

    isLoadingPinned.value = true
    try {
      // 並行請求所有釘選用戶的詳細資料
      const promises = ids.map(async (discordUserId) => {
        try {
          const detail = await checkinApi.getUserDetail(scheduleId, discordUserId)
          // 將 UserDetail 轉換為 UserCheckinItem 格式
          const checkinStatus: Record<string, boolean> = {}
          detail.checkinDetails.forEach(item => {
            checkinStatus[item.dayLabel] = item.checkedIn
          })

          const userItem: UserCheckinItem = {
            discordUserId: detail.discordUserId,
            username: detail.username,
            displayName: detail.displayName,
            avatarUrl: detail.avatarUrl,
            totalCheckinDays: detail.totalCheckinDays,
            checkinStatus,
          }
          pinnedUserDetails.value.set(discordUserId, userItem)
        } catch (e) {
          // 如果用戶資料取得失敗，從釘選中移除
          console.error(`Failed to fetch pinned user ${discordUserId}:`, e)
          unpinUser(scheduleId, discordUserId)
        }
      })
      await Promise.all(promises)
    } finally {
      isLoadingPinned.value = false
    }
  }

  // 清除特定排程的釘選
  function clearPinned(scheduleId: string) {
    delete pinnedMap.value[scheduleId]
    pinnedUserDetails.value.clear()
  }

  return {
    // State
    pinnedMap,
    pinnedUserDetails,
    isLoadingPinned,

    // Getters
    getPinnedIds,
    isPinned,
    getPinnedCount,
    canPin,
    getPinnedUserList,

    // Actions
    pinUser,
    unpinUser,
    togglePin,
    fetchPinnedUsers,
    clearPinned,

    // Constants
    MAX_PINNED,
  }
})
