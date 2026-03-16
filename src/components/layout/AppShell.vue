<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import TopNavBar from './TopNavBar.vue'

const route = useRoute()

// 路由變化時滾動到頂部
watch(
  () => route.path,
  () => {
    window.scrollTo(0, 0)
  },
)
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <TopNavBar />
    <main class="mx-auto max-w-6xl px-4 pt-20 pb-8 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>
