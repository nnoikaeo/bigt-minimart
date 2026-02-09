<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  dot: false,
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-full'

  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-300',
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-orange-100 text-orange-800 border border-orange-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return `${base} ${variants[props.variant]} ${sizes[props.size]}`
})

const dotClasses = computed(() => {
  const variants = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return `w-2 h-2 rounded-full ${variants[props.variant]}`
})
</script>

<template>
  <span :class="badgeClasses">
    <span v-if="dot" :class="dotClasses" />
    <slot />
  </span>
</template>
