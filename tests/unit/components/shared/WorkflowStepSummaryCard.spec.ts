/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkflowStepSummaryCard from '~/components/shared/WorkflowStepSummaryCard.vue'
import type { StepBadge, SummaryItem } from '~/components/shared/WorkflowStepSummaryCard.vue'

const BaseBadgeStub = {
  name: 'BaseBadge',
  template: '<span class="base-badge"><slot /></span>',
  props: ['variant', 'size'],
}

const ChevronDownStub = { template: '<span class="chevron-down" />' }
const ChevronUpStub = { template: '<span class="chevron-up" />' }

const BADGE: StepBadge = { label: 'สำเร็จ', variant: 'success' }
const SUMMARY_ITEMS: SummaryItem[] = [
  { label: 'รายการ', value: 5 },
  { label: 'ยอดรวม', value: '1,000 ฿', colorClass: 'bg-green-50' },
]

function mountCard(overrides = {}, slots = {}) {
  return mount(WorkflowStepSummaryCard, {
    props: {
      stepNumber: 1,
      title: 'บันทึกรายการ',
      ...overrides,
    },
    slots,
    global: {
      stubs: {
        BaseBadge: BaseBadgeStub,
        ChevronDownIcon: ChevronDownStub,
        ChevronUpIcon: ChevronUpStub,
      },
    },
  })
}

describe('WorkflowStepSummaryCard', () => {
  describe('header rendering', () => {
    it('renders the step number', () => {
      const wrapper = mountCard({ stepNumber: 2 })
      expect(wrapper.text()).toContain('2')
    })

    it('renders the title', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('บันทึกรายการ')
    })

    it('renders badge when badge prop is provided', () => {
      const wrapper = mountCard({ badge: BADGE })
      expect(wrapper.find('.base-badge').exists()).toBe(true)
      expect(wrapper.find('.base-badge').text()).toBe('สำเร็จ')
    })

    it('does not render badge when badge prop is omitted', () => {
      const wrapper = mountCard()
      expect(wrapper.find('.base-badge').exists()).toBe(false)
    })

    it('renders header-right slot content in the header', () => {
      const wrapper = mountCard({}, { 'header-right': '<span id="hr">ปุ่มพิเศษ</span>' })
      expect(wrapper.find('#hr').exists()).toBe(true)
    })
  })

  describe('step number badge color', () => {
    it('applies blue bg class for step 1', () => {
      const wrapper = mountCard({ stepNumber: 1 })
      const badge = wrapper.find('.rounded-full')
      expect(badge.classes()).toContain('bg-blue-100')
    })

    it('applies green bg class for step 2', () => {
      const wrapper = mountCard({ stepNumber: 2 })
      const badge = wrapper.find('.rounded-full')
      expect(badge.classes()).toContain('bg-green-100')
    })

    it('cycles colors for step 6 (same as step 1)', () => {
      const wrapper = mountCard({ stepNumber: 6 })
      const badge = wrapper.find('.rounded-full')
      expect(badge.classes()).toContain('bg-blue-100')
    })
  })

  describe('summary items', () => {
    it('does not render summary items section when summaryItems is empty', () => {
      // Use a title that does not contain summary item labels to avoid false match
      const wrapper = mountCard({ title: 'ขั้นตอน', summaryItems: [] })
      // Summary items are rendered inside .rounded-lg.p-3.text-center divs
      expect(wrapper.findAll('.rounded-lg.p-3.text-center')).toHaveLength(0)
    })

    it('renders summary item labels and values', () => {
      const wrapper = mountCard({ summaryItems: SUMMARY_ITEMS })
      expect(wrapper.text()).toContain('รายการ')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('ยอดรวม')
      expect(wrapper.text()).toContain('1,000 ฿')
    })

    it('applies colorClass from summaryItem', () => {
      const wrapper = mountCard({ summaryItems: SUMMARY_ITEMS })
      const cards = wrapper.findAll('.rounded-lg.p-3.text-center')
      expect(cards[1].classes()).toContain('bg-green-50')
    })
  })

  describe('expandable area (default slot)', () => {
    it('does not render expand toggle when no default slot is provided', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).not.toContain('รายละเอียด')
    })

    it('renders expand toggle when default slot is provided', () => {
      const wrapper = mountCard({}, { default: '<p>เนื้อหาขยาย</p>' })
      expect(wrapper.text()).toContain('รายละเอียด')
    })

    it('hides slot content by default (defaultExpanded=false)', () => {
      const wrapper = mountCard({}, { default: '<p id="detail">รายละเอียด</p>' })
      expect(wrapper.find('#detail').exists()).toBe(false)
    })

    it('shows slot content when defaultExpanded is true', () => {
      const wrapper = mountCard({ defaultExpanded: true }, { default: '<p id="detail">รายละเอียด</p>' })
      expect(wrapper.find('#detail').exists()).toBe(true)
    })

    it('slot content is hidden when collapsed (ChevronDown state)', () => {
      const wrapper = mountCard({}, { default: '<p id="collapsed-content">content</p>' })
      // toggle button exists but content is not shown
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('#collapsed-content').exists()).toBe(false)
    })

    it('slot content is visible when expanded (ChevronUp state)', () => {
      const wrapper = mountCard({ defaultExpanded: true }, { default: '<p id="expanded-content">content</p>' })
      // toggle button exists and content is shown
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('#expanded-content').exists()).toBe(true)
    })

    it('expands slot content when toggle button is clicked', async () => {
      const wrapper = mountCard({}, { default: '<p id="detail">เนื้อหา</p>' })
      expect(wrapper.find('#detail').exists()).toBe(false)
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('#detail').exists()).toBe(true)
    })

    it('collapses slot content when toggle is clicked again', async () => {
      const wrapper = mountCard({ defaultExpanded: true }, { default: '<p id="detail">เนื้อหา</p>' })
      expect(wrapper.find('#detail').exists()).toBe(true)
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('#detail').exists()).toBe(false)
    })
  })
})
