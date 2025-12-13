<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { UserCheckinItem } from '@/types/checkin'
import { usePinnedStore } from '@/stores/pinned'

const props = defineProps<{
  user: UserCheckinItem
  scheduleId: string
  totalDays?: number
}>()

const emit = defineEmits<{
  pinChanged: [discordUserId: string, isPinned: boolean]
}>()

const pinnedStore = usePinnedStore()

const defaultAvatar = computed(() => {
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(props.user.discordUserId) % 5}.png`
})

const isPinned = computed(() => pinnedStore.isPinned(props.scheduleId, props.user.discordUserId))
const canPin = computed(() => pinnedStore.canPin(props.scheduleId))

function handleTogglePin(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  const success = pinnedStore.togglePin(props.scheduleId, props.user.discordUserId)
  emit('pinChanged', props.user.discordUserId, !isPinned.value && success)
}
</script>

<template>
  <RouterLink
    :to="{ name: 'user-detail', params: { scheduleId, discordUserId: user.discordUserId } }"
    class="group flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800"
    :class="
      isPinned
        ? 'border-violet-200 dark:border-violet-700'
        : 'border-slate-200 hover:border-violet-200 dark:border-slate-700 dark:hover:border-violet-600'
    "
  >
    <!-- Pin Button -->
    <button
      class="flex-shrink-0 rounded-lg p-1.5 transition-colors"
      :class="
        isPinned
          ? 'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50'
          : canPin
            ? 'text-slate-400 hover:bg-slate-100 hover:text-violet-500 dark:hover:bg-slate-700'
            : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
      "
      :title="isPinned ? '取消釘選' : canPin ? '釘選用戶' : '已達釘選上限'"
      :disabled="!isPinned && !canPin"
      @click="handleTogglePin"
    >
      <i :class="['bi text-base', isPinned ? 'bi-pin-fill' : 'bi-pin']"></i>
    </button>

    <img
      :src="user.avatarUrl || defaultAvatar"
      :alt="user.displayName"
      class="h-12 w-12 rounded-full object-cover ring-2 transition-all"
      :class="
        isPinned
          ? 'ring-violet-200 dark:ring-violet-700'
          : 'ring-slate-100 group-hover:ring-violet-200 dark:ring-slate-700 dark:group-hover:ring-violet-500'
      "
      loading="lazy"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-slate-800 dark:text-white">{{ user.displayName }}</p>
      <p class="truncate text-sm text-slate-500 dark:text-slate-400">@{{ user.username }}</p>
    </div>
    <div class="text-right">
      <p class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ user.totalCheckinDays }}</p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        {{ totalDays ? `/ ${totalDays} 天` : '天' }}
      </p>
    </div>
  </RouterLink>
</template>
