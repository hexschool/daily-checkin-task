<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div class="flex items-center justify-center">
    <div
      class="arcade-loader"
      :class="{
        'arcade-loader--sm': size === 'sm',
        'arcade-loader--md': size === 'md' || !size,
        'arcade-loader--lg': size === 'lg',
      }"
    >
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<style scoped>
/* 街機像素載入：四個方塊輪流點亮（掃描感） */
.arcade-loader {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.arcade-loader span {
  background: color-mix(in srgb, var(--color-acc) 16%, transparent);
  animation: arcade-loader-blink 0.9s steps(1, jump-none) infinite;
}

.arcade-loader span:nth-child(1) {
  animation-delay: 0s;
}
.arcade-loader span:nth-child(2) {
  animation-delay: 0.1125s;
}
.arcade-loader span:nth-child(4) {
  animation-delay: 0.225s;
}
.arcade-loader span:nth-child(3) {
  animation-delay: 0.3375s;
}

@keyframes arcade-loader-blink {
  0%,
  60% {
    background: color-mix(in srgb, var(--color-acc) 16%, transparent);
    box-shadow: none;
  }
  20%,
  40% {
    background: var(--color-acc);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-acc) 60%, transparent);
  }
}

.arcade-loader--sm {
  width: 16px;
  height: 16px;
  gap: 2px;
}
.arcade-loader--md {
  width: 32px;
  height: 32px;
  gap: 3px;
}
.arcade-loader--lg {
  width: 48px;
  height: 48px;
  gap: 4px;
}
</style>
