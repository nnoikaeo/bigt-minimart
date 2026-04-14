/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BalanceSnapshot from '~/components/shared/BalanceSnapshot.vue'

function mountSnapshot(overrides = {}, slots = {}) {
  return mount(BalanceSnapshot, {
    props: {
      openingBalance: 1000,
      closingBalance: 1500,
      ...overrides,
    },
    slots,
  })
}

describe('BalanceSnapshot', () => {
  it('renders opening balance formatted with ฿', () => {
    const wrapper = mountSnapshot()
    expect(wrapper.text()).toContain('1,000 ฿')
  })

  it('renders closing balance formatted with ฿', () => {
    const wrapper = mountSnapshot()
    expect(wrapper.text()).toContain('1,500 ฿')
  })

  it('renders positive net change with + prefix', () => {
    const wrapper = mountSnapshot({ openingBalance: 1000, closingBalance: 1500 })
    expect(wrapper.text()).toContain('+500 ฿')
  })

  it('renders negative net change without + prefix', () => {
    const wrapper = mountSnapshot({ openingBalance: 2000, closingBalance: 1500 })
    // netChange = -500
    const text = wrapper.text()
    expect(text).toContain('500 ฿')
    // should not have + before negative values
    expect(text).not.toContain('+500 ฿')
  })

  it('uses default net change label "สุทธิระหว่างวัน"', () => {
    const wrapper = mountSnapshot()
    expect(wrapper.text()).toContain('สุทธิระหว่างวัน')
  })

  it('renders custom netChangeLabel when provided', () => {
    const wrapper = mountSnapshot({ netChangeLabel: 'กำไรสุทธิ' })
    expect(wrapper.text()).toContain('กำไรสุทธิ')
  })

  it('applies green background for positive net change', () => {
    const wrapper = mountSnapshot({ openingBalance: 1000, closingBalance: 1500 })
    expect(wrapper.html()).toContain('bg-green-50')
  })

  it('applies red background for negative net change', () => {
    const wrapper = mountSnapshot({ openingBalance: 2000, closingBalance: 1000 })
    expect(wrapper.html()).toContain('bg-red-50')
  })

  it('renders default slot content below the cards', () => {
    const wrapper = mountSnapshot({}, { default: '<p id="extra">ข้อมูลเพิ่มเติม</p>' })
    expect(wrapper.find('#extra').exists()).toBe(true)
    expect(wrapper.find('#extra').text()).toBe('ข้อมูลเพิ่มเติม')
  })

  it('renders correctly when opening equals closing (net zero)', () => {
    const wrapper = mountSnapshot({ openingBalance: 1000, closingBalance: 1000 })
    expect(wrapper.text()).toContain('0 ฿')
    // Should show green for zero (>= 0)
    expect(wrapper.html()).toContain('bg-green-50')
  })
})
