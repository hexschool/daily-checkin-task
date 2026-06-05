<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

// 掛載時初始化主題（套用 localStorage / 系統偏好並維持反應式）
useThemeStore()
</script>

<template>
  <RouterView />
</template>
