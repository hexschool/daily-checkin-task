<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-5">
    <div class="arcade-panel w-full max-w-md p-8 text-center [animation:arcade-pop_.5s_cubic-bezier(.2,.9,.3,1.2)_both]">
      <div class="arcade-eyebrow justify-center">404 · NOT FOUND</div>

      <h1
        class="my-5 font-pixel text-7xl tracking-tight text-acc [text-shadow:0_0_24px_color-mix(in_srgb,var(--color-acc)_45%,transparent)] [animation:arcade-blink_1.4s_steps(2,jump-none)_infinite]"
      >404</h1>

      <p class="text-lg font-bold text-ink">頁面不存在</p>
      <p class="mt-2 text-[15px] text-muted">您所查找的頁面可能已被移除或不存在</p>

      <button
        type="button"
        class="arcade-btn mx-auto mt-7 cursor-pointer"
        aria-label="返回上一頁"
        @click="goBack"
      >
        <i class="bi bi-arrow-left"></i> 返回上一頁
      </button>
    </div>
  </div>
</template>
