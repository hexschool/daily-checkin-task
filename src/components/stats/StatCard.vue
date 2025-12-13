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
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-400',
    glow: 'shadow-rose-500/20',
  },
}
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/10"
  >
    <!-- Background Glow -->
    <div
      class="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-30"
      :class="colorStyles[color || 'violet'].bg"
    ></div>

    <div class="relative flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-slate-400">{{ title }}</p>
        <p class="mt-2 text-3xl font-bold text-white">
          {{ value }}
          <span v-if="unit" class="text-lg font-normal text-slate-500">{{ unit }}</span>
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
