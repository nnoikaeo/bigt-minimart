<script setup lang="ts">
import { computed } from 'vue'

type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'search'

interface Props {
  modelValue: string | number
  type?: InputType
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  error?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  error: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
}>()

const inputClasses = computed(() => {
  const base = 'w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2'
  const normal = 'border-gray-300 focus:border-red-500 focus:ring-red-100'
  const errorState = 'border-red-300 focus:border-red-500 focus:ring-red-100'
  const disabled = 'bg-gray-100 cursor-not-allowed text-gray-500'

  return `${base} ${props.error ? errorState : normal} ${props.disabled ? disabled : ''} ${props.class || ''}`
})
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :class="inputClasses"
    @input="emit('update:modelValue', type === 'number' ? Number(($event.target as HTMLInputElement).value) : ($event.target as HTMLInputElement).value)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
