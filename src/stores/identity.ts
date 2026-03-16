import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'my-identity'

interface IdentityStorage {
  [scheduleId: string]: string // discordUserId
}

export const useIdentityStore = defineStore('identity', () => {
  const identityMap = ref<IdentityStorage>(loadFromStorage())

  function loadFromStorage(): IdentityStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  watch(identityMap, () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identityMap.value))
  }, { deep: true })

  function getMyUserId(scheduleId: string): string | null {
    return identityMap.value[scheduleId] || null
  }

  function setMyIdentity(scheduleId: string, discordUserId: string) {
    identityMap.value[scheduleId] = discordUserId
  }

  function clearMyIdentity(scheduleId: string) {
    delete identityMap.value[scheduleId]
  }

  function isMe(scheduleId: string, discordUserId: string): boolean {
    return identityMap.value[scheduleId] === discordUserId
  }

  return {
    identityMap,
    getMyUserId,
    setMyIdentity,
    clearMyIdentity,
    isMe,
  }
})
