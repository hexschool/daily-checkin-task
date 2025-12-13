<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="rounded-lg bg-red-50 p-4 text-center">
    <p class="text-red-600">{{ message }}</p>
    <button
      class="mt-2 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
      @click="emit('retry')"
    >
      重試
    </button>
  </div>
</template>
