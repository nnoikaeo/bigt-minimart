<script setup lang="ts">
import { ref, computed } from 'vue'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  label: string
  variant: BadgeVariant
}

interface Props {
  icon?: string
  title: string
  badge?: BadgeProps | null
  summary?: string
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  badge: null,
  summary: '',
  expanded: false,
})

const isExpanded = ref(props.expanded)

function toggle() {
  isExpanded.value = !isExpanded.value
}

const badgeClasses = computed(() => {
  if (!props.badge) return ''

  const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-800 border-gray-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-orange-100 text-orange-800 border-orange-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  }

  return `inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variants[props.badge.variant]}`
})

const chevronStyle = computed(() => ({
  transform: isExpanded.value ? 'rotate(90deg)' : 'rotate(0deg)',
}))
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Header (clickable) -->
    <div
      class="flex items-center gap-3 px-6 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
      @click="toggle"
    >
      <!-- Chevron -->
      <span
        class="text-gray-400 text-sm transition-transform duration-200 flex-shrink-0"
        :style="chevronStyle"
      >
        ▶
      </span>

      <!-- Icon -->
      <span v-if="icon" class="flex-shrink-0">{{ icon }}</span>

      <!-- Title -->
      <span class="font-semibold text-gray-900">{{ title }}</span>

      <!-- Badge -->
      <span v-if="badge" :class="badgeClasses">
        {{ badge.label }}
      </span>

      <!-- Summary (visible when collapsed) -->
      <span
        v-if="summary && !isExpanded"
        class="ml-auto text-sm text-gray-500 truncate"
      >
        {{ summary }}
      </span>

      <!-- Spacer when expanded (keeps layout consistent) -->
      <span v-else class="ml-auto" />
    </div>

    <!-- Expandable Content -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[2000px] opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-[2000px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isExpanded" class="border-t border-gray-200 overflow-hidden">
        <div class="px-6 py-4">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>
