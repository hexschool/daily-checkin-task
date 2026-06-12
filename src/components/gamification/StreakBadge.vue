<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  streak: number
  size?: 'sm' | 'md' | 'lg'
  // 是否播放火焰動畫；長列表可由父層挑選少數開啟以控制效能（預設開啟）
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  animated: true,
})

type FireTier = 'ember' | 'warm' | 'hot' | 'blazing' | 'inferno'

// 依連續天數決定火焰旺度階級
const tier = computed<FireTier>(() => {
  if (props.streak >= 30) return 'inferno' // 地獄火
  if (props.streak >= 14) return 'blazing' // 烈火
  if (props.streak >= 7) return 'hot' // 旺火
  if (props.streak >= 3) return 'warm' // 小火
  return 'ember' // 火苗（1～2 天）
})

// 動畫只開放給 hot 以上階級，且需父層允許（animated）
// 低階級僅靠靜態光暈區分，零動畫成本
const animationClass = computed(() => {
  if (!props.animated) return ''
  if (tier.value === 'hot' || tier.value === 'blazing' || tier.value === 'inferno') {
    return `streak-anim--${tier.value}`
  }
  return ''
})
</script>

<template>
  <div
    v-if="streak > 0"
    class="inline-flex items-center gap-1 font-bold text-acc"
    :class="{
      'text-[15px]': size === 'sm',
      'text-base': size === 'md',
      'text-xl': size === 'lg',
    }"
  >
    <i class="bi bi-fire streak-fire" :class="[`streak-fire--${tier}`, animationClass]"></i>
    <span class="font-pixel">
      {{ streak }}
    </span>
  </div>
</template>

<style scoped>
.streak-fire {
  display: inline-block;
  transform-origin: center bottom;
}

/* ── 靜態光暈：依階級遞增（所有火焰都套用，只繪製一次、零動畫成本） ── */
.streak-fire--ember {
  filter: drop-shadow(0 0 2px color-mix(in srgb, var(--color-acc) 35%, transparent));
}
.streak-fire--warm {
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--color-acc) 48%, transparent));
}
.streak-fire--hot {
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--color-acc) 62%, transparent));
}
.streak-fire--blazing {
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--color-acc) 78%, transparent));
}
.streak-fire--inferno {
  filter: drop-shadow(0 0 11px color-mix(in srgb, var(--color-acc) 92%, transparent));
}

/* ── 動態：僅由父層挑中的少數播放，且只動 transform（GPU 合成，避免 repaint） ── */
.streak-anim--hot {
  animation: fire-sway 1.6s ease-in-out infinite;
}
.streak-anim--blazing {
  animation: fire-blaze 1.05s ease-in-out infinite;
}
.streak-anim--inferno {
  animation: fire-inferno 0.75s ease-in-out infinite;
}

/* 旺火：單純脈動 */
@keyframes fire-sway {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.14);
  }
}

/* 烈火：脈動 + 左右搖擺 */
@keyframes fire-blaze {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.1) rotate(-4deg);
  }
  50% {
    transform: scale(1.22) rotate(0deg);
  }
  75% {
    transform: scale(1.1) rotate(4deg);
  }
}

/* 地獄火：更大幅度、更快速的劇烈燃燒 */
@keyframes fire-inferno {
  0%,
  100% {
    transform: scale(1.06) rotate(0deg);
  }
  20% {
    transform: scale(1.22) rotate(-7deg);
  }
  50% {
    transform: scale(1.34) rotate(0deg);
  }
  80% {
    transform: scale(1.22) rotate(7deg);
  }
}

/* 尊重系統「減少動態效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .streak-fire {
    animation: none !important;
  }
}
</style>
