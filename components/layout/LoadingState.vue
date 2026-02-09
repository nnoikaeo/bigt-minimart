<script setup lang="ts">
/**
 * LoadingState Component
 *
 * Displays an animated loading spinner with optional text
 * Used when data is being fetched or processing
 *
 * @example
 * <LoadingState />
 * <LoadingState text="กำลังโหลดข้อมูล..." />
 */

interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: 'กำลังโหลด...',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <!-- Spinner -->
    <div class="relative w-12 h-12">
      <div class="absolute inset-0 border-4 border-gray-200 rounded-full" />
      <div
        class="absolute inset-0 border-4 border-transparent border-t-red-600 rounded-full animate-spin"
      />
    </div>

    <!-- Loading text -->
    <p class="mt-4 text-center text-gray-600 font-medium">{{ text }}</p>
  </div>
</template>

<style scoped>
/* Ensure spinner animation is smooth */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
