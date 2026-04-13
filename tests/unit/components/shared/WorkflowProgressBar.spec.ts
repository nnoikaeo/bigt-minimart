/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkflowProgressBar from '~/components/shared/WorkflowProgressBar.vue'
import type { WorkflowStep } from '~/components/shared/WorkflowProgressBar.vue'

const STEPS: WorkflowStep[] = [
  { label: 'บันทึกรายการ', shortLabel: 'บันทึก', key: 'step1' },
  { label: 'ตรวจนับเงิน', shortLabel: 'ตรวจนับ', key: 'step2' },
  { label: 'ตรวจสอบ', shortLabel: 'ตรวจสอบ', key: 'audit' },
  { label: 'อนุมัติ', shortLabel: 'อนุมัติ', key: 'approve' },
]

const STATUS_MAP: Record<string, number> = {
  step1_in_progress: 0,
  step1_completed: 1,
  step2_completed: 2,
  audited: 3,
  approved: 3,
  needs_correction: 0,
}

function mountBar(currentStatus: string) {
  return mount(WorkflowProgressBar, {
    props: { steps: STEPS, currentStatus, statusToStepMap: STATUS_MAP },
  })
}

describe('WorkflowProgressBar', () => {
  it('renders all step labels', () => {
    const wrapper = mountBar('step1_in_progress')
    expect(wrapper.text()).toContain('บันทึกรายการ')
    expect(wrapper.text()).toContain('ตรวจนับเงิน')
    expect(wrapper.text()).toContain('ตรวจสอบ')
    expect(wrapper.text()).toContain('อนุมัติ')
  })

  it('shows active dot with amber pulse class for the current step', () => {
    const wrapper = mountBar('step1_in_progress')
    const dots = wrapper.findAll('.rounded-full')
    // first dot should be active (amber)
    expect(dots[0].classes()).toContain('bg-amber-500')
    expect(dots[0].classes()).toContain('animate-pulse')
  })

  it('shows completed dots (green) for steps before the active step', () => {
    const wrapper = mountBar('step2_completed')
    const dots = wrapper.findAll('.rounded-full')
    // steps 0 and 1 completed, step 2 is active
    expect(dots[0].classes()).toContain('bg-green-500')
    expect(dots[1].classes()).toContain('bg-green-500')
    expect(dots[2].classes()).toContain('bg-amber-500')
  })

  it('shows pending dots (gray) for steps after the active step', () => {
    const wrapper = mountBar('step1_in_progress')
    const dots = wrapper.findAll('.rounded-full')
    // steps 1, 2, 3 are pending
    expect(dots[1].classes()).toContain('bg-gray-300')
    expect(dots[2].classes()).toContain('bg-gray-300')
    expect(dots[3].classes()).toContain('bg-gray-300')
  })

  it('shows error (red) dot for needs_correction status', () => {
    const wrapper = mountBar('needs_correction')
    const dots = wrapper.findAll('.rounded-full')
    expect(dots[0].classes()).toContain('bg-red-500')
  })

  it('renders connecting lines between steps (N-1 lines)', () => {
    const wrapper = mountBar('step1_in_progress')
    // lines have h-0.5 class
    const lines = wrapper.findAll('.h-0\\.5')
    expect(lines).toHaveLength(STEPS.length - 1)
  })

  it('renders short labels inside sm:hidden spans', () => {
    const wrapper = mountBar('step1_in_progress')
    const shortLabels = wrapper.findAll('.sm\\:hidden')
    expect(shortLabels[0].text()).toBe('บันทึก')
  })
})
