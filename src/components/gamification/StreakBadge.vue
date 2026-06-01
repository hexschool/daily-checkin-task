<script setup lang="ts">
defineProps<{
  streak: number
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    v-if="streak > 0"
    class="inline-flex items-center gap-1 font-bold text-acc"
    :class="{
      'text-[15px]': size === 'sm',
      'text-base': !size || size === 'md',
      'text-xl': size === 'lg',
    }"
  >
    <i
      class="bi bi-fire streak-fire"
      :class="{
        'streak-fire--hot': streak >= 7 && streak < 14,
        'streak-fire--blazing': streak >= 14,
      }"
    ></i>
    <span class="font-pixel">
      {{ streak }}
    </span>
  </div>
</template>

<style scoped>
.streak-fire {
  display: inline-block;
}

/* 7 天起：脈動 */
.streak-fire--hot {
  animation: fire-pulse 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--color-acc) 55%, transparent));
}

/* 14 天起：燃燒搖擺 + 更強發光 */
.streak-fire--blazing {
  animation: fire-blaze 1s ease-in-out infinite;
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--color-acc) 75%, transparent));
}

@keyframes fire-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.15);
    filter: brightness(1.2);
  }
}

@keyframes fire-blaze {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
  25% {
    transform: scale(1.1) rotate(-3deg);
  }
  50% {
    transform: scale(1.2) rotate(0deg);
    filter: brightness(1.3);
  }
  75% {
    transform: scale(1.1) rotate(3deg);
  }
}
</style>
