/* eslint-disable */
// @ts-nocheck
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import OwnerDecisionCard from '~/components/shared/OwnerDecisionCard.vue'

// Stub design-system components that pull in extra dependencies
const BaseTextareaStub = {
  name: 'BaseTextarea',
  template: '<textarea class="base-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'rows'],
  emits: ['update:modelValue'],
}

const ActionButtonStub = {
  name: 'ActionButton',
  template: '<button class="action-btn" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
  props: ['permission', 'variant', 'loading', 'disabled'],
  emits: ['click'],
}

function mountCard(overrides = {}) {
  return mount(OwnerDecisionCard, {
    props: {
      modelValue: null,
      ...overrides,
    },
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        BaseTextarea: BaseTextareaStub,
        ActionButton: ActionButtonStub,
        CheckCircleIcon: { template: '<span />' },
      },
    },
  })
}

describe('OwnerDecisionCard', () => {
  describe('radio options rendering', () => {
    it('renders three decision radio options', () => {
      const wrapper = mountCard()
      const radios = wrapper.findAll('input[type="radio"]')
      expect(radios).toHaveLength(3)
    })

    it('renders "อนุมัติ ✅" option', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('อนุมัติ ✅')
    })

    it('renders "อนุมัติพร้อมหมายเหตุ" option', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('อนุมัติพร้อมหมายเหตุ')
    })

    it('renders "ขอให้แก้ไข" option', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('ขอให้แก้ไข')
    })
  })

  describe('modelValue binding', () => {
    it('pre-selects the radio matching modelValue', () => {
      const wrapper = mountCard({ modelValue: 'approved' })
      const radios = wrapper.findAll('input[type="radio"]')
      const approvedRadio = radios.find(r => r.element.value === 'approved')
      expect(approvedRadio.element.checked).toBe(true)
    })

    it('emits update:modelValue when a radio is selected', async () => {
      const wrapper = mountCard()
      const radios = wrapper.findAll('input[type="radio"]')
      await radios.find(r => r.element.value === 'approved').trigger('change')
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
    })
  })

  describe('notes textarea visibility', () => {
    it('does not show textarea when "approved" is selected (no notes needed)', () => {
      const wrapper = mountCard({ modelValue: 'approved' })
      expect(wrapper.find('.base-textarea').exists()).toBe(false)
    })

    it('shows textarea when "approved_with_notes" is selected', () => {
      const wrapper = mountCard({ modelValue: 'approved_with_notes' })
      expect(wrapper.find('.base-textarea').exists()).toBe(true)
    })

    it('shows textarea when "needs_correction" is selected', () => {
      const wrapper = mountCard({ modelValue: 'needs_correction' })
      expect(wrapper.find('.base-textarea').exists()).toBe(true)
    })
  })

  describe('submit button state', () => {
    it('disables submit button when no decision is selected', () => {
      const wrapper = mountCard({ modelValue: null })
      expect(wrapper.find('.action-btn').attributes('disabled')).toBeDefined()
    })

    it('enables submit button when "approved" is selected', () => {
      const wrapper = mountCard({ modelValue: 'approved' })
      expect(wrapper.find('.action-btn').attributes('disabled')).toBeUndefined()
    })

    it('disables submit when "approved_with_notes" is selected but notes are empty', () => {
      const wrapper = mountCard({ modelValue: 'approved_with_notes' })
      expect(wrapper.find('.action-btn').attributes('disabled')).toBeDefined()
    })
  })

  describe('submit button label', () => {
    it('shows "อนุมัติ ✅" label when approved is selected', () => {
      const wrapper = mountCard({ modelValue: 'approved' })
      expect(wrapper.find('.action-btn').text()).toContain('อนุมัติ ✅')
    })

    it('shows "ส่งคืนแก้ไข" label when needs_correction is selected', () => {
      const wrapper = mountCard({ modelValue: 'needs_correction' })
      expect(wrapper.find('.action-btn').text()).toContain('ส่งคืนแก้ไข')
    })

    it('shows "อนุมัติพร้อมหมายเหตุ ✅" label when approved_with_notes is selected', () => {
      const wrapper = mountCard({ modelValue: 'approved_with_notes' })
      expect(wrapper.find('.action-btn').text()).toContain('อนุมัติพร้อมหมายเหตุ ✅')
    })
  })

  describe('submit emit', () => {
    it('emits submit event with decision and notes when button is clicked', async () => {
      const wrapper = mountCard({ modelValue: 'approved' })
      await wrapper.find('.action-btn').trigger('click')
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0]).toEqual(['approved', ''])
    })

    it('does not emit submit when canSubmit is false', async () => {
      const wrapper = mountCard({ modelValue: null })
      await wrapper.find('.action-btn').trigger('click')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('disableCorrection prop', () => {
    it('disables the needs_correction radio when disableCorrection is true', () => {
      const wrapper = mountCard({ disableCorrection: true })
      const radios = wrapper.findAll('input[type="radio"]')
      const correctionRadio = radios.find(r => r.element.value === 'needs_correction')
      expect(correctionRadio.element.disabled).toBe(true)
    })

    it('renders explanation text when disableCorrection is true', () => {
      const wrapper = mountCard({ disableCorrection: true })
      expect(wrapper.text()).toContain('ใช้ได้เฉพาะเมื่อ Audit พบปัญหา')
    })

    it('shows normal label when disableCorrection is false', () => {
      const wrapper = mountCard({ disableCorrection: false })
      expect(wrapper.text()).toContain('ส่งกลับแก้ไข')
    })
  })

  describe('isSubmitting prop', () => {
    it('passes loading=true to ActionButton when isSubmitting is true', () => {
      const wrapper = mountCard({ modelValue: 'approved', isSubmitting: true })
      // ActionButton stub disables when loading=true
      expect(wrapper.find('.action-btn').attributes('disabled')).toBeDefined()
    })
  })
})
