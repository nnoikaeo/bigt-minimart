/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CompactBalanceSummary from '~/components/shared/CompactBalanceSummary.vue'
import type { BalanceCardItem } from '~/components/shared/CompactBalanceSummary.vue'

const BaseCardStub = {
  name: 'BaseCard',
  template: '<div><slot /></div>',
}

const PRIMARY_CARDS: BalanceCardItem[] = [
  { label: 'ยอดเปิด', value: 1000 },
  { label: 'ยอดปิด', value: 2000 },
]
const SECONDARY_CARDS: BalanceCardItem[] = [
  { label: 'เพิ่มเติม', value: 500 },
]

function mountCard(overrides = {}) {
  return mount(CompactBalanceSummary, {
    props: {
      primaryCards: PRIMARY_CARDS,
      ...overrides,
    },
    global: { stubs: { BaseCard: BaseCardStub } },
  })
}

describe('CompactBalanceSummary', () => {
  it('renders primary card labels and values', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('ยอดเปิด')
    expect(wrapper.text()).toContain('1,000 ฿')
    expect(wrapper.text()).toContain('ยอดปิด')
    expect(wrapper.text()).toContain('2,000 ฿')
  })

  it('renders default title "📊 ยอดเงิน"', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('📊 ยอดเงิน')
  })

  it('renders custom title when provided', () => {
    const wrapper = mountCard({ title: '💵 สรุปยอด' })
    expect(wrapper.text()).toContain('💵 สรุปยอด')
  })

  it('does not show toggle button when no secondary cards', () => {
    const wrapper = mountCard({ secondaryCards: [] })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows toggle button when secondary cards exist and collapsible is true', () => {
    const wrapper = mountCard({ secondaryCards: SECONDARY_CARDS, collapsible: true })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('button').text()).toBe('▼ ดูเพิ่ม')
  })

  it('secondary cards are hidden by default (defaultExpanded=false)', () => {
    const wrapper = mountCard({ secondaryCards: SECONDARY_CARDS })
    expect(wrapper.text()).not.toContain('เพิ่มเติม')
  })

  it('shows secondary cards when defaultExpanded is true', () => {
    const wrapper = mountCard({ secondaryCards: SECONDARY_CARDS, defaultExpanded: true })
    expect(wrapper.text()).toContain('เพิ่มเติม')
  })

  it('toggles secondary cards when button is clicked', async () => {
    const wrapper = mountCard({ secondaryCards: SECONDARY_CARDS, collapsible: true })
    expect(wrapper.text()).not.toContain('เพิ่มเติม')
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('เพิ่มเติม')
    expect(wrapper.find('button').text()).toBe('▲ ย่อ')
  })

  it('collapses secondary cards when button is clicked again', async () => {
    const wrapper = mountCard({ secondaryCards: SECONDARY_CARDS, defaultExpanded: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).not.toContain('เพิ่มเติม')
  })

  it('renders subtitle when card has subtitle', () => {
    const cards = [{ label: 'ยอด', value: 100, subtitle: 'ข้อมูลเพิ่มเติม' }]
    const wrapper = mountCard({ primaryCards: cards })
    expect(wrapper.text()).toContain('ข้อมูลเพิ่มเติม')
  })

  it('does not show toggle when collapsible is false', () => {
    const wrapper = mountCard({ secondaryCards: SECONDARY_CARDS, collapsible: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
