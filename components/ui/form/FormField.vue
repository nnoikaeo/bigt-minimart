<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-600 ml-0.5">*</span>
    </label>

    <!-- Input Slot -->
    <div>
      <slot />
    </div>

    <!-- Error Message -->
    <p v-if="error" class="text-sm text-red-600 mt-1">
      {{ error }}
    </p>

    <!-- Hint -->
    <p v-else-if="hint" class="text-sm text-gray-500 mt-1">
      {{ hint }}
    </p>
  </div>
</template>
