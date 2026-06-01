<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="arcade-panel p-6">
    <div class="flex items-start gap-4">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center border border-edge bg-surface text-acc"
      >
        <i class="bi bi-exclamation-triangle text-lg"></i>
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="font-bold text-ink">發生錯誤</h3>
        <p class="mt-1 text-[15px] text-muted">{{ message }}</p>
        <button class="arcade-btn mt-4" @click="emit('retry')">
          <i class="bi bi-arrow-clockwise"></i>
          重試
        </button>
      </div>
    </div>
  </div>
</template>
