import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// 各主題對應的手機瀏覽器網址列底色（與 all.css 的 --color-base 一致）
const META_COLORS: Record<Theme, string> = {
  light: '#edefe4',
  dark: '#0b0c11',
}

// 初始主題：優先採用上次選擇，否則跟隨系統偏好
function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(getInitialTheme())

  // 套用主題到 <html>：切換 .light class 並同步網址列底色
  function applyTheme(value: Theme) {
    document.documentElement.classList.toggle('light', value === 'light')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[value])
  }

  watch(
    theme,
    (value) => {
      localStorage.setItem(STORAGE_KEY, value)
      applyTheme(value)
    },
    { immediate: true },
  )

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(value: Theme) {
    theme.value = value
  }

  return { theme, toggle, setTheme }
})
