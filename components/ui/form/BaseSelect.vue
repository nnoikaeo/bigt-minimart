<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: string | number
  disabled?: boolean
}

interface Props {
  modelValue: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  error: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [event: Event]
}>()

const selectClasses = computed(() => {
  const base = 'w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2'
  const normal = 'border-gray-300 focus:border-red-500 focus:ring-red-100 bg-white'
  const errorState = 'border-red-300 focus:border-red-500 focus:ring-red-100'
  const disabled = 'bg-gray-100 cursor-not-allowed text-gray-500'

  return `${base} ${props.error ? errorState : normal} ${props.disabled ? disabled : ''} ${props.class || ''}`
})
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    :class="selectClasses"
    @change="emit('change', $event)"
    @input="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <!-- Placeholder option -->
    <option v-if="placeholder" value="" disabled selected>
      {{ placeholder }}
    </option>

    <!-- Options -->
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>
