<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import type { DailyStat } from '@/types/checkin'
import { useThemeStore } from '@/stores/theme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  dailyStats: DailyStat[]
}>()

const themeStore = useThemeStore()

const chartData = computed(() => ({
  labels: props.dailyStats.map((stat) => stat.dayLabel),
  datasets: [
    {
      label: '打卡人數',
      data: props.dailyStats.map((stat) => stat.checkinCount),
      borderColor: '#8B5CF6',
      backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 300)
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)')
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')
        return gradient
      },
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: '#8B5CF6',
      pointBorderColor: themeStore.theme === 'dark' ? '#1E293B' : '#FFFFFF',
      pointBorderWidth: 3,
      borderWidth: 3,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#1E293B',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      borderWidth: 1,
      padding: 12,
      titleFont: {
        size: 14,
        weight: 600 as const,
      },
      bodyFont: {
        size: 13,
      },
      titleColor: '#F1F5F9',
      bodyColor: '#94A3B8',
      displayColors: false,
      callbacks: {
        label: (context: TooltipItem<'line'>) => `${context.parsed.y ?? 0} 人打卡`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: themeStore.theme === 'dark' ? '#94A3B8' : '#64748B',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: themeStore.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      },
      border: {
        display: false,
      },
      ticks: {
        color: themeStore.theme === 'dark' ? '#94A3B8' : '#64748B',
        font: {
          size: 11,
        },
        padding: 10,
      },
      min: 0,
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
}))
</script>

<template>
  <div class="h-full w-full">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
