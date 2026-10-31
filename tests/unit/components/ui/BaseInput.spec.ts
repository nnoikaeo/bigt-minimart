/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import BaseInput from '~/components/ui/form/BaseInput.vue'

describe('BaseInput', () => {
  it('emits a number when a number input is filled', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', type: 'number' } })
    await wrapper.find('input').setValue('2300')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2300])
  })

  it('emits an empty string (not 0) when a number input is cleared', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: 2300, type: 'number' } })
    await wrapper.find('input').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('keeps an entered 0 as the number 0', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', type: 'number' } })
    await wrapper.find('input').setValue('0')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0])
  })
})
