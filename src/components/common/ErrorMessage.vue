<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-800 dark:bg-rose-900/30">
    <div class="flex items-start gap-4">
      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50">
        <i class="bi bi-exclamation-triangle text-lg text-rose-600 dark:text-rose-400"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-rose-800 dark:text-rose-200">發生錯誤</h3>
        <p class="mt-1 text-sm text-rose-600 dark:text-rose-300">{{ message }}</p>
        <button
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-800"
          @click="emit('retry')"
        >
          <i class="bi bi-arrow-clockwise"></i>
          重試
        </button>
      </div>
    </div>
  </div>
</template>
