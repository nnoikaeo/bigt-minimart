/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DateInput from '~/components/ui/form/DateInput.vue'

describe('DateInput', () => {
  it('shows the value in dd/mm/Buddhist year while keeping ISO in the input', () => {
    const wrapper = mount(DateInput, { props: { modelValue: '2026-04-01' } })
    expect(wrapper.text()).toContain('01/04/2569')
    expect(wrapper.find('input[type="date"]').element.value).toBe('2026-04-01')
  })

  it('shows a placeholder when empty', () => {
    const wrapper = mount(DateInput, { props: { modelValue: '' } })
    expect(wrapper.text()).toContain('วว/ดด/ปปปป')
  })

  it('emits the ISO value on input and change', async () => {
    const wrapper = mount(DateInput, { props: { modelValue: '2026-04-01' } })
    const input = wrapper.find('input[type="date"]')
    await input.setValue('2026-04-02')
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['2026-04-02'])
    expect(wrapper.emitted('change')[0]).toEqual(['2026-04-02'])
  })

  it('disables the native input', () => {
    const wrapper = mount(DateInput, { props: { modelValue: '2026-04-01', disabled: true } })
    expect(wrapper.find('input[type="date"]').element.disabled).toBe(true)
  })
})
