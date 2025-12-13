<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  debounceMs?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const inputValue = ref(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (newValue) => {
    inputValue.value = newValue
  }
)

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  inputValue.value = value
  emit('update:modelValue', value)

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    emit('search', value)
  }, props.debounceMs ?? 300)
}

function handleClear() {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="relative">
    <input
      type="text"
      :value="inputValue"
      :placeholder="placeholder || '搜尋...'"
      class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-white placeholder-slate-500 backdrop-blur-sm transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
      @input="handleInput"
    />
    <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
    <button
      v-if="inputValue"
      class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
      @click="handleClear"
    >
      <i class="bi bi-x-lg"></i>
    </button>
  </div>
</template>
