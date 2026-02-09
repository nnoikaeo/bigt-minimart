<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  icon?: boolean
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  icon: false,
  iconPosition: 'left',
  fullWidth: false,
  type: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 disabled:bg-red-50 disabled:cursor-not-allowed',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const width = props.fullWidth ? 'w-full' : ''
  const opacity = props.loading ? 'opacity-60' : ''

  return `${base} ${variants[props.variant]} ${sizes[props.size]} ${width} ${opacity} ${props.class || ''}`
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />

    <!-- Content -->
    <slot />
  </button>
</template>
