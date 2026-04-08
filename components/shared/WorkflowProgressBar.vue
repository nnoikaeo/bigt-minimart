<script setup lang="ts">
import { computed } from 'vue'
import type { UnifiedWorkflowStatus } from '~/types/shared-workflow'

type StepState = 'completed' | 'active' | 'pending' | 'error'

export interface WorkflowStep {
  label: string
  shortLabel?: string
  key: string
}

interface Props {
  steps: WorkflowStep[]
  currentStatus: UnifiedWorkflowStatus
  /** Maps each workflow status to the 0-based active step index */
  statusToStepMap: Record<string, number>
}

const props = defineProps<Props>()

/**
 * Determine each step's state based on the current status.
 *
 * - Steps before the active index → completed
 * - The step at the active index → active (or error for needs_correction)
 * - Steps after the active index → pending
 */
const stepStates = computed<StepState[]>(() => {
  const activeIndex = props.statusToStepMap[props.currentStatus] ?? 0
  const isError = props.currentStatus === 'needs_correction'

  return props.steps.map((_, index) => {
    if (index < activeIndex) return 'completed'
    if (index === activeIndex) return isError ? 'error' : 'active'
    return 'pending'
  })
})

function dotClasses(state: StepState): string {
  const base = 'w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-200'
  const stateStyles: Record<StepState, string> = {
    completed: 'bg-green-500',
    active: 'bg-amber-500 animate-pulse ring-4 ring-amber-100',
    pending: 'bg-gray-300',
    error: 'bg-red-500',
  }
  return `${base} ${stateStyles[state]}`
}

function lineClasses(state: StepState): string {
  const base = 'flex-1 h-0.5 mx-1 transition-colors duration-200'
  const stateStyles: Record<StepState, string> = {
    completed: 'bg-green-500',
    active: 'bg-amber-300',
    pending: 'bg-gray-300',
    error: 'bg-red-300',
  }
  return `${base} ${stateStyles[state]}`
}

function labelClasses(state: StepState): string {
  const base = 'text-xs mt-1 transition-colors duration-200'
  const stateStyles: Record<StepState, string> = {
    completed: 'text-green-600 font-medium',
    active: 'text-amber-600 font-medium',
    pending: 'text-gray-400',
    error: 'text-red-600 font-medium',
  }
  return `${base} ${stateStyles[state]}`
}

/**
 * Line color between two steps:
 * - If left step is completed → green (completed)
 * - Otherwise → follows the right step's state
 */
function getLineState(leftIndex: number, rightIndex: number): StepState {
  const left = stepStates.value[leftIndex]!
  if (left === 'completed') return 'completed'
  return stepStates.value[rightIndex]!
}
</script>

<template>
  <div class="flex items-center px-4 py-2">
    <template v-for="(step, index) in steps" :key="step.key">
      <!-- Step: dot + label -->
      <div class="flex flex-col items-center min-w-0">
        <div :class="dotClasses(stepStates[index]!)" />
        <span :class="labelClasses(stepStates[index]!)">
          <span class="hidden sm:inline">{{ step.label }}</span>
          <span class="sm:hidden">{{ step.shortLabel ?? step.label }}</span>
        </span>
      </div>

      <!-- Connecting line (not after last step) -->
      <div
        v-if="index < steps.length - 1"
        :class="lineClasses(getLineState(index, index + 1))"
      />
    </template>
  </div>
</template>
