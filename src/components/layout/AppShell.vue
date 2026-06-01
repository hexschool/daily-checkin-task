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
  <div class="min-h-screen">
    <TopNavBar />
    <main class="mx-auto max-w-5xl px-5 pb-24 pt-24 sm:px-6">
      <slot />
    </main>
  </div>
</template>
