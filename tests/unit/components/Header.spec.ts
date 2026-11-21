/* eslint-disable */
// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import Header from '~/components/Header.vue'

const push = vi.fn()
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push }),
}))

const logout = vi.fn()
vi.stubGlobal('useAuth', () => ({ logout }))

async function clickLogout() {
  const wrapper = mount(Header, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: { NuxtLink: { template: '<a><slot /></a>' }, Transition: false },
    },
  })
  wrapper.vm.isDropdownOpen = true
  await nextTick()
  await wrapper.findAll('button').find(b => b.text().includes('ออกจากระบบ')).trigger('click')
  await flushPromises()
  return wrapper
}

describe('Header logout (BUG-055)', () => {
  beforeEach(() => {
    push.mockClear()
    logout.mockReset()
  })

  it('signs out of Firebase through useAuth().logout, then goes to /login', async () => {
    logout.mockResolvedValue({ success: true })
    await clickLogout()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/login')
  })

  it('stays on the page when sign-out fails', async () => {
    logout.mockResolvedValue({ success: false, error: 'network' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await clickLogout()
    expect(push).not.toHaveBeenCalled()
  })
})
