<script setup lang="ts">
import type { Pagination } from '@/types/checkin'

defineProps<{
  pagination: Pagination
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

function goToPage(page: number) {
  emit('page-change', page)
}
</script>

<template>
  <div class="flex items-center justify-between">
    <p class="text-sm text-slate-500 dark:text-slate-400">
      共 <span class="font-medium text-slate-800 dark:text-white">{{ pagination.totalCount }}</span> 人，第
      <span class="font-medium text-slate-800 dark:text-white">{{ pagination.currentPage }}</span> /
      <span class="font-medium text-slate-800 dark:text-white">{{ pagination.totalPages }}</span> 頁
    </p>
    <div class="flex gap-2">
      <button
        :disabled="!pagination.hasPrevPage"
        class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        @click="goToPage(pagination.currentPage - 1)"
      >
        <i class="bi bi-chevron-left"></i>
        上一頁
      </button>
      <button
        :disabled="!pagination.hasNextPage"
        class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        @click="goToPage(pagination.currentPage + 1)"
      >
        下一頁
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  </div>
</template>
