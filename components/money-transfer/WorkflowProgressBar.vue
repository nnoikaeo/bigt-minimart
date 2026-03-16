<script setup lang="ts">
import { computed } from 'vue'

type WorkflowStatus =
  | 'step1_in_progress'
  | 'step1_completed'
  | 'step2_completed'
  | 'audited'
  | 'approved'
  | 'needs_correction'

type StepState = 'completed' | 'active' | 'pending' | 'error'

interface Props {
  status: WorkflowStatus
}

const props = defineProps<Props>()

const steps = [
  { key: 'step1', label: 'บันทึก' },
  { key: 'step2', label: 'ตรวจนับ' },
  { key: 'auditor', label: 'Auditor' },
  { key: 'owner', label: 'Owner' },
] as const

const stepStates = computed<Record<(typeof steps)[number]['key'], StepState>>(() => {
  const s = props.status
  return {
    step1:
      s === 'step1_in_progress'
        ? 'active'
        : s === 'needs_correction'
          ? 'error'
          : 'completed',
    step2:
      s === 'step1_in_progress' || s === 'needs_correction'
        ? 'pending'
        : s === 'step1_completed'
          ? 'active'
          : 'completed',
    auditor: (['step1_in_progress', 'step1_completed', 'needs_correction'] as string[]).includes(s)
      ? 'pending'
      : s === 'step2_completed'
        ? 'active'
        : 'completed',
    owner:
      s === 'approved'
        ? 'completed'
        : s === 'audited'
          ? 'active'
          : 'pending',
  }
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
 * Line color between two steps is based on the left step's state:
 * - If left step is completed, line is green (completed)
 * - Otherwise, line follows the right step's state
 */
function getLineState(leftKey: (typeof steps)[number]['key'], rightKey: (typeof steps)[number]['key']): StepState {
  const left = stepStates.value[leftKey]
  if (left === 'completed') return 'completed'
  return stepStates.value[rightKey]
}
</script>

<template>
  <div class="flex items-center px-4 py-2">
    <template v-for="(step, index) in steps" :key="step.key">
      <!-- Step: dot + label -->
      <div class="flex flex-col items-center">
        <div :class="dotClasses(stepStates[step.key])" />
        <span :class="labelClasses(stepStates[step.key])">
          {{ step.label }}
        </span>
      </div>

      <!-- Connecting line (not after last step) -->
      <div
        v-if="index < steps.length - 1"
        :class="lineClasses(getLineState(step.key, steps[index + 1]!.key))"
      />
    </template>
  </div>
</template>
