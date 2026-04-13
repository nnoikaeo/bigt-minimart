/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import QuickGlanceSummary from '~/components/shared/QuickGlanceSummary.vue'

// BaseBadge uses auto-import — stub it so we can assert rendered text
const BaseBadgeStub = {
  name: 'BaseBadge',
  template: '<span><slot /></span>',
  props: ['variant', 'size', 'dot'],
}

function mountSummary(overrides = {}) {
  return mount(QuickGlanceSummary, {
    props: {
      date: '2026-01-29',
      totalTransactions: 10,
      successCount: 8,
      totalCommission: 500,
      workflowStatus: 'step1_in_progress',
      ...overrides,
    },
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: { BaseBadge: BaseBadgeStub },
    },
  })
}

describe('QuickGlanceSummary', () => {
  it('renders total transactions count', () => {
    const wrapper = mountSummary({ totalTransactions: 10 })
    expect(wrapper.text()).toContain('10 รายการ')
  })

  it('renders success count', () => {
    const wrapper = mountSummary({ successCount: 8 })
    expect(wrapper.text()).toContain('สำเร็จ 8')
  })

  it('renders commission amount formatted with ฿', () => {
    const wrapper = mountSummary({ totalCommission: 500 })
    expect(wrapper.text()).toContain('500 ฿')
  })

  it('renders default customLabel "ค่าบริการ" when not provided', () => {
    const wrapper = mountSummary()
    expect(wrapper.text()).toContain('ค่าบริการ')
  })

  it('renders custom label when customLabel prop is provided', () => {
    const wrapper = mountSummary({ customLabel: 'ค่าธรรมเนียม' })
    expect(wrapper.text()).toContain('ค่าธรรมเนียม')
  })

  it('renders status badge label for step1_in_progress', () => {
    const wrapper = mountSummary({ workflowStatus: 'step1_in_progress' })
    expect(wrapper.text()).toContain('กำลังบันทึก')
  })

  it('renders status badge label for approved', () => {
    const wrapper = mountSummary({ workflowStatus: 'approved' })
    expect(wrapper.text()).toContain('อนุมัติแล้ว')
  })

  it('renders status badge label for needs_correction', () => {
    const wrapper = mountSummary({ workflowStatus: 'needs_correction' })
    expect(wrapper.text()).toContain('ส่งกลับแก้ไข')
  })

  it('renders formatted date with Thai locale pattern', () => {
    const wrapper = mountSummary({ date: '2026-01-29' })
    // Thai locale date contains the year 2569 (BE) or just ensure date is shown
    const text = wrapper.text()
    // The formatted date should have at least two slashes as separator
    expect(text).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})
