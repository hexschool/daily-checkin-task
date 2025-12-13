<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  unit?: string
  color: 'blue' | 'cyan' | 'yellow' | 'green'
  icon?: 'check' | 'users' | 'calendar' | 'arrow'
}>()

const colorClasses = {
  blue: 'border-l-blue-500',
  cyan: 'border-l-cyan-500',
  yellow: 'border-l-yellow-500',
  green: 'border-l-green-500',
}

const iconColors = {
  blue: 'text-blue-500',
  cyan: 'text-cyan-500',
  yellow: 'text-yellow-500',
  green: 'text-green-500',
}

const iconMap = {
  check: 'bi-check-lg',
  users: 'bi-people',
  calendar: 'bi-calendar-check',
  arrow: 'bi-arrow-right',
}
</script>

<template>
  <div
    class="rounded-lg bg-white p-5 shadow-sm border-l-4 flex items-center justify-between"
    :class="colorClasses[color]"
  >
    <div>
      <p class="text-sm font-medium" :class="iconColors[color]">{{ title }}</p>
      <p class="mt-1 text-3xl font-bold text-slate-700">
        {{ value }}
        <span v-if="unit" class="text-lg font-normal text-slate-500">{{ unit }}</span>
      </p>
    </div>
    <div v-if="icon" :class="iconColors[color]">
      <i :class="['bi', iconMap[icon], 'text-4xl opacity-70']"></i>
    </div>
  </div>
</template>
