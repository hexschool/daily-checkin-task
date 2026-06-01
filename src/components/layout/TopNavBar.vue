<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)

const scheduleId = computed(() => route.params.scheduleId as string)

const navItems = computed(() => [
  {
    name: '打卡日曆',
    icon: 'bi-calendar3',
    to: { name: 'calendar', params: { scheduleId: scheduleId.value } },
    routeNames: ['calendar', 'day-detail'],
  },
  {
    name: '我的旅程',
    icon: 'bi-rocket-takeoff-fill',
    to: { name: 'my-journey', params: { scheduleId: scheduleId.value } },
    routeNames: ['my-journey'],
  },
  {
    name: '我的追蹤',
    icon: 'bi-people-fill',
    to: { name: 'friends', params: { scheduleId: scheduleId.value } },
    routeNames: ['friends', 'user-detail'],
  },
  {
    name: '排行榜',
    icon: 'bi-trophy-fill',
    to: { name: 'leaderboard', params: { scheduleId: scheduleId.value } },
    routeNames: ['leaderboard'],
  },
])

function isActive(routeNames: string[]) {
  return routeNames.includes(route.name as string)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 border-b border-edge bg-base/90 backdrop-blur-sm">
    <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-6">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center bg-acc text-acc-ink shadow-[3px_3px_0_var(--color-acc-strong)]"
        >
          <i class="bi bi-calendar2-check text-lg"></i>
        </div>
        <span
          class="text-xl font-extrabold tracking-tight text-acc [text-shadow:0_0_16px_color-mix(in_srgb,var(--color-acc)_45%,transparent)]"
        >每日打卡</span>
      </div>

      <!-- Desktop Nav -->
      <nav class="hidden items-center gap-1.5 sm:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-2 border px-3.5 py-2 text-[15px] font-semibold transition-colors"
          :class="
            isActive(item.routeNames)
              ? 'border-ink bg-ink text-base'
              : 'border-transparent text-muted hover:border-edge hover:text-ink'
          "
        >
          <i :class="['bi', item.icon]"></i>
          {{ item.name }}
        </RouterLink>
      </nav>

      <!-- Mobile menu button -->
      <button
        class="flex h-9 w-9 items-center justify-center border border-edge text-muted transition-colors hover:border-acc hover:text-acc sm:hidden"
        @click="mobileMenuOpen = !mobileMenuOpen"
        aria-label="切換選單"
      >
        <i :class="['bi text-xl', mobileMenuOpen ? 'bi-x-lg' : 'bi-list']"></i>
      </button>
    </div>

    <!-- Mobile dropdown menu -->
    <Transition name="dropdown">
      <div
        v-if="mobileMenuOpen"
        class="border-t border-edge bg-surface px-5 pb-4 pt-2 sm:hidden"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 border px-4 py-3 text-[15px] font-semibold transition-colors"
          :class="
            isActive(item.routeNames)
              ? 'border-acc text-acc'
              : 'border-transparent text-muted hover:text-ink'
          "
          @click="closeMobileMenu"
        >
          <i :class="['bi text-lg', item.icon]"></i>
          {{ item.name }}
        </RouterLink>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
