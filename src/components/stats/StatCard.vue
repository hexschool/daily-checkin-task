<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  unit?: string
  icon: string
}>()
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
  >
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ title }}</p>
        <p class="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
          {{ value }}
          <span v-if="unit" class="text-lg font-normal text-slate-400">{{ unit }}</span>
        </p>
      </div>
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
        <i :class="['bi', icon, 'text-xl text-slate-600 dark:text-slate-300']"></i>
      </div>
    </div>
  </div>
</template>
