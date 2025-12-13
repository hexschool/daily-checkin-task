<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

// Initialize theme store to apply theme class on app load
useThemeStore()
</script>

<template>
  <RouterView />
</template>
