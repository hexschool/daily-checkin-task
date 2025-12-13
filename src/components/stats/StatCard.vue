<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  unit?: string
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'violet' | 'emerald' | 'amber' | 'rose'
}>()

const colorStyles = {
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/50',
    icon: 'text-violet-600 dark:text-violet-400',
    value: 'text-violet-600 dark:text-violet-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    icon: 'text-rose-600 dark:text-rose-400',
    value: 'text-rose-600 dark:text-rose-400',
  },
}
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
  >
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ title }}</p>
        <p class="mt-2 text-3xl font-bold" :class="colorStyles[color || 'violet'].value">
          {{ value }}
          <span v-if="unit" class="text-lg font-normal text-slate-400">{{ unit }}</span>
        </p>
      </div>
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl"
        :class="colorStyles[color || 'violet'].bg"
      >
        <i :class="['bi', icon, 'text-xl', colorStyles[color || 'violet'].icon]"></i>
      </div>
    </div>
  </div>
</template>
