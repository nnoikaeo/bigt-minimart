<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  rows?: number
  error?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  rows: 4,
  error: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
}>()

const textareaClasses = computed(() => {
  const base = 'w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 resize-none'
  const normal = 'border-gray-300 focus:border-red-500 focus:ring-red-100'
  const errorState = 'border-red-300 focus:border-red-500 focus:ring-red-100'
  const disabled = 'bg-gray-100 cursor-not-allowed text-gray-500'

  return `${base} ${props.error ? errorState : normal} ${props.disabled ? disabled : ''} ${props.class || ''}`
})
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :rows="rows"
    :class="textareaClasses"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
