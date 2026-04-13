<script setup lang="ts">
/**
 * Shared Workflow Step Summary Card
 *
 * Renders a collapsible card for a single workflow step with:
 *   - Numbered step badge + title + optional status badge in header
 *   - Optional summary items shown as inline cards (non-expandable)
 *   - Expandable slot content toggled by a chevron button
 *
 * Props:
 *   - stepNumber      : number
 *   - title           : string
 *   - badge?          : { label: string, variant: 'success' | 'warning' | 'error' | 'info' }
 *   - summaryItems?   : Array<{ label: string, value: string | number, colorClass?: string }>
 *   - defaultExpanded?: boolean (default false)
 *
 * Slots:
 *   - default        — expandable area content
 *   - header-right   — extra content on the right side of the header (before badge)
 */
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'

export interface SummaryItem {
  label: string
  value: string | number
  colorClass?: string
}

export interface StepBadge {
  label: string
  variant: 'success' | 'warning' | 'error' | 'info'
}

const props = withDefaults(
  defineProps<{
    stepNumber: number
    title: string
    badge?: StepBadge
    summaryItems?: SummaryItem[]
    defaultExpanded?: boolean
  }>(),
  {
    badge: undefined,
    summaryItems: () => [],
    defaultExpanded: false,
  }
)

const isExpanded = ref(props.defaultExpanded)

const stepBgClass = computed(() => {
  // Cycle through some colours by step number
  const classes = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-indigo-100 text-indigo-700',
    'bg-yellow-100 text-yellow-700',
    'bg-purple-100 text-purple-700',
  ]
  return classes[(props.stepNumber - 1) % classes.length]
})

const badgeVariantMap: Record<StepBadge['variant'], 'success' | 'warning' | 'error' | 'info'> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
}

const hasSummaryItems = computed(() => (props.summaryItems?.length ?? 0) > 0)
const hasExpandable = computed(() => !!useSlots().default)
</script>

<template>
  <section class="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
      <span
        class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
        :class="stepBgClass"
      >
        {{ stepNumber }}
      </span>
      <h3 class="font-semibold text-gray-900">{{ title }}</h3>

      <!-- header-right slot -->
      <div class="ml-auto flex items-center gap-2">
        <slot name="header-right" />
        <BaseBadge v-if="badge" :variant="badge.variant" size="sm">
          {{ badge.label }}
        </BaseBadge>
      </div>
    </div>

    <!-- Summary items row -->
    <div v-if="hasSummaryItems" class="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div
        v-for="(item, idx) in summaryItems"
        :key="idx"
        class="rounded-lg p-3 text-center"
        :class="item.colorClass ?? 'bg-gray-50'"
      >
        <p class="text-xs text-gray-500 mb-1">{{ item.label }}</p>
        <p class="font-semibold text-gray-900">{{ item.value }}</p>
      </div>
    </div>

    <!-- Expandable area (only rendered when default slot is provided) -->
    <template v-if="hasExpandable">
      <div :class="hasSummaryItems ? 'border-t border-gray-100' : ''">
        <button
          class="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
          @click="isExpanded = !isExpanded"
        >
          <span class="text-sm font-medium text-gray-700">รายละเอียด</span>
          <ChevronUpIcon v-if="isExpanded" class="w-4 h-4 text-gray-500" />
          <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
        </button>
        <div v-if="isExpanded" class="px-6 pb-4">
          <slot />
        </div>
      </div>
    </template>
  </section>
</template>
