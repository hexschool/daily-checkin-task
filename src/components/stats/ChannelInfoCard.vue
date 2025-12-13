<script setup lang="ts">
import type { ChannelInfo } from '@/types/checkin'

defineProps<{
  channelInfo: ChannelInfo
}>()
</script>

<template>
  <div class="rounded-lg bg-white p-4 shadow">
    <h3 class="mb-3 text-lg font-semibold">Discord 頻道</h3>
    <div class="space-y-2 text-sm">
      <div class="flex items-center gap-2">
        <i class="bi bi-hash text-gray-400"></i>
        <span class="text-gray-600">{{ channelInfo.channelName }}</span>
      </div>
      <div class="flex items-center gap-2">
        <i class="bi bi-people text-gray-400"></i>
        <span class="text-gray-600">{{ channelInfo.guildName }}</span>
      </div>
    </div>
  </div>
</template>
