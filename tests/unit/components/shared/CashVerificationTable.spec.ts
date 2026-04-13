/* eslint-disable */
// @ts-nocheck
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CashVerificationTable from '~/components/shared/CashVerificationTable.vue'
import type { CashVerificationRow } from '~/components/shared/CashVerificationTable.vue'

const BaseBadgeStub = {
  name: 'BaseBadge',
  template: '<span><slot /></span>',
  props: ['variant', 'size'],
}

const BASE_ROWS: CashVerificationRow[] = [
  { label: 'เงินสด', expected: 1000, managerActual: 1000 },
  { label: 'ธนาณัติ', expected: 500, managerActual: 480 },
]

function mountTable(mode: string, overrides = {}) {
  return mount(CashVerificationTable, {
    props: {
      rows: BASE_ROWS,
      mode,
      ...overrides,
    },
    global: { stubs: { BaseBadge: BaseBadgeStub } },
  })
}

describe('CashVerificationTable', () => {
  describe('manager-readonly mode', () => {
    it('renders row labels', () => {
      const wrapper = mountTable('manager-readonly')
      expect(wrapper.text()).toContain('เงินสด')
      expect(wrapper.text()).toContain('ธนาณัติ')
    })

    it('renders expected amounts formatted with ฿', () => {
      const wrapper = mountTable('manager-readonly')
      expect(wrapper.text()).toContain('1,000 ฿')
      expect(wrapper.text()).toContain('500 ฿')
    })

    it('does not show Auditor column header', () => {
      const wrapper = mountTable('manager-readonly')
      expect(wrapper.text()).not.toContain('Auditor นับ')
    })

    it('shows total row by default', () => {
      const wrapper = mountTable('manager-readonly')
      expect(wrapper.text()).toContain('รวมเงินสดทั้งหมด')
    })

    it('hides total row when showTotal is false', () => {
      const wrapper = mountTable('manager-readonly', { showTotal: false })
      expect(wrapper.text()).not.toContain('รวมเงินสดทั้งหมด')
    })

    it('shows "⚠️ มีผลต่าง" badge when totals differ', () => {
      const wrapper = mountTable('manager-readonly')
      expect(wrapper.text()).toContain('⚠️ มีผลต่าง')
    })

    it('shows "✅ ตรงกัน" badge when totals match', () => {
      const matchingRows = [{ label: 'เงินสด', expected: 1000, managerActual: 1000 }]
      const wrapper = mountTable('manager-readonly', { rows: matchingRows })
      expect(wrapper.text()).toContain('✅ ตรงกัน')
    })
  })

  describe('manager-input mode', () => {
    it('renders number inputs for manager actual values', () => {
      const rows = [{ label: 'เงินสด', expected: 1000, managerActual: null }]
      const wrapper = mountTable('manager-input', { rows })
      const input = wrapper.find('input[type="number"]')
      expect(input.exists()).toBe(true)
    })

    it('emits update:managerActual with index and value on input', async () => {
      const rows = [{ label: 'เงินสด', expected: 1000, managerActual: null }]
      const wrapper = mountTable('manager-input', { rows })
      const input = wrapper.find('input[type="number"]')
      Object.defineProperty(input.element, 'value', { value: '900', writable: true })
      await input.trigger('input')
      expect(wrapper.emitted('update:managerActual')).toBeTruthy()
      expect(wrapper.emitted('update:managerActual')[0]).toEqual([0, 900])
    })

    it('renders read-only span (not input) for readOnly rows', () => {
      const rows = [{ label: 'เงินสด', expected: 1000, managerActual: 1000, readOnly: true }]
      const wrapper = mountTable('manager-input', { rows })
      expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    })
  })

  describe('auditor-input mode', () => {
    it('renders Auditor column header', () => {
      const wrapper = mountTable('auditor-input')
      expect(wrapper.text()).toContain('Auditor นับ')
    })

    it('renders auditor input fields', () => {
      const rows = [{ label: 'เงินสด', expected: 1000, managerActual: 1000, auditorActual: null }]
      const wrapper = mountTable('auditor-input', { rows })
      const inputs = wrapper.findAll('input[type="number"]')
      // auditor input should exist (at least 1)
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('emits update:auditorActual with index and value on input', async () => {
      const rows = [{ label: 'เงินสด', expected: 1000, managerActual: 1000, auditorActual: null }]
      const wrapper = mountTable('auditor-input', { rows })
      // The auditor input is the second input (first is manager-readonly in this mode)
      const inputs = wrapper.findAll('input[type="number"]')
      const auditorInput = inputs[inputs.length - 1]
      Object.defineProperty(auditorInput.element, 'value', { value: '950', writable: true })
      await auditorInput.trigger('input')
      expect(wrapper.emitted('update:auditorActual')).toBeTruthy()
      expect(wrapper.emitted('update:auditorActual')[0][1]).toBe(950)
    })
  })

  describe('auditor-readonly mode', () => {
    it('shows auditor column without inputs', () => {
      const wrapper = mountTable('auditor-readonly')
      expect(wrapper.text()).toContain('Auditor นับ')
      expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    })
  })

  describe('verification notes', () => {
    it('does not render notes section when verificationNotes is not provided', () => {
      const wrapper = mountTable('manager-readonly')
      expect(wrapper.text()).not.toContain('หมายเหตุ:')
    })

    it('renders verificationNotes when provided', () => {
      const wrapper = mountTable('manager-readonly', { verificationNotes: 'พบความผิดปกติ' })
      expect(wrapper.text()).toContain('หมายเหตุ:')
      expect(wrapper.text()).toContain('พบความผิดปกติ')
    })
  })
})
