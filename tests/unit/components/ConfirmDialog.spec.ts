/* eslint-disable */
// @ts-nocheck
/**
 * BUG-049: ConfirmDialog accepts the parent's `loading` state
 */
import { mount } from '@vue/test-utils'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

function mountDialog(props = {}) {
  return mount(ConfirmDialog, {
    props: { open: true, title: 'ยืนยัน?', message: 'ข้อความ', confirmText: 'ยืนยัน', ...props },
    global: { stubs: { teleport: true } },
  })
}

const buttons = (w) => w.findAll('button')

describe('ConfirmDialog', () => {
  it('shows confirmText and emits confirm', async () => {
    const wrapper = mountDialog()
    expect(buttons(wrapper)[1].text()).toBe('ยืนยัน')
    await buttons(wrapper)[1].trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('loading: disables both buttons and shows progress text', async () => {
    const wrapper = mountDialog({ loading: true })
    const [cancel, confirm] = buttons(wrapper)
    expect(confirm.attributes('disabled')).toBeDefined()
    expect(cancel.attributes('disabled')).toBeDefined()
    expect(confirm.text()).toBe('กำลังประมวลผล...')
    await confirm.trigger('click')
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('does not pass loading through as an HTML attribute', () => {
    const wrapper = mountDialog({ loading: false })
    expect(wrapper.html()).not.toContain('loading="false"')
  })
})
