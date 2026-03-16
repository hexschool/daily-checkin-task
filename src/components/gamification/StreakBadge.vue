<script setup lang="ts">
defineProps<{
  streak: number
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    v-if="streak > 0"
    class="inline-flex items-center gap-1 font-bold"
    :class="{
      'text-sm': size === 'sm',
      'text-base': !size || size === 'md',
      'text-xl': size === 'lg',
    }"
  >
    <i
      class="bi bi-fire streak-fire"
      :class="{
        'text-orange-400': streak < 7,
        'text-orange-500 streak-fire--hot': streak >= 7 && streak < 14,
        'text-red-500 streak-fire--blazing': streak >= 14,
      }"
    ></i>
    <span
      :class="{
        'text-orange-600 dark:text-orange-400': streak < 7,
        'text-orange-600 dark:text-orange-300': streak >= 7 && streak < 14,
        'text-red-600 dark:text-red-400': streak >= 14,
      }"
    >
      {{ streak }}
    </span>
  </div>
</template>

<style scoped>
.streak-fire {
  display: inline-block;
}

.streak-fire--hot {
  animation: fire-pulse 1.5s ease-in-out infinite;
}

.streak-fire--blazing {
  animation: fire-blaze 1s ease-in-out infinite;
}

@keyframes fire-pulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.15);
    filter: brightness(1.2);
  }
}

@keyframes fire-blaze {
  0%, 100% {
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
