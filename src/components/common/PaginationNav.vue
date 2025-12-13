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
    <p class="text-sm text-gray-600">
      共 {{ pagination.totalCount }} 人，第 {{ pagination.currentPage }} /
      {{ pagination.totalPages }} 頁
    </p>
    <div class="flex gap-2">
      <button
        :disabled="!pagination.hasPrevPage"
        class="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        @click="goToPage(pagination.currentPage - 1)"
      >
        上一頁
      </button>
      <button
        :disabled="!pagination.hasNextPage"
        class="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        @click="goToPage(pagination.currentPage + 1)"
      >
        下一頁
      </button>
    </div>
  </div>
</template>
