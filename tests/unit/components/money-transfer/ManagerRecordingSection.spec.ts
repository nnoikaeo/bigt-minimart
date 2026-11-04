/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useMoneyTransferStore } from '~/stores/money-transfer'
import ManagerRecordingSection from '~/components/money-transfer/ManagerRecordingSection.vue'

// ── Stub Nuxt auto-imports ────────────────────────────────────────────────────
vi.stubGlobal('useCommission', () => ({
  isManual: ref(false),
  manualValue: ref(0),
  effectiveCommission: computed(() => 10),
  reset: vi.fn(),
}))
vi.stubGlobal('useMoneyTransferHelpers', () => ({
  formatCurrency: (v) => `${v} ฿`,
  formatTime: (v) => v ?? '-',
  formatDatetime: (v) => v ?? '-',
  getTransactionTypeLabel: (v) => v ?? '-',
  getChannelLabel: (v) => v ?? '-',
  getStatusBadgeVariant: () => 'default',
  getStatusLabel: (v) => v ?? '-',
  getAccountName: (t) => t?.accountName ?? '-',
  getChannelSubtitle: () => '',
}))

// ── Stub module imports ───────────────────────────────────────────────────────
vi.mock('~/composables/useLogger', () => ({
  useLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}))
vi.mock('~/composables/usePermissions', () => ({
  usePermissions: () => ({ can: vi.fn().mockReturnValue(true), hasAnyRole: vi.fn().mockReturnValue(true) }),
}))

// ── Component stubs ───────────────────────────────────────────────────────────
const stubs = {
  ActionButton: {
    name: 'ActionButton',
    template: '<button class="action-btn" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['permission', 'variant', 'loading', 'disabled', 'size'],
    emits: ['click'],
  },
  BaseAlert: { template: '<div class="base-alert">{{ message }}</div>', props: ['variant', 'message', 'autoClose', 'dismissible'] },
  BaseBadge: { template: '<span><slot /></span>' },
  BaseButton: { template: '<button><slot /></button>' },
  BaseInput: true,
  BaseModal: true,
  CompactBalanceSummary: true,
  ConfirmDialog: true,
  NuxtLink: { template: '<a><slot /></a>' },
  TransactionTable: true,
  MoneyTransferTransactionForm: true,
}

const DATE = '2026-03-11'
const txn = (id, status) => ({ id, date: DATE, status, transactionType: 'withdrawal', amount: 500, commission: 10 })

async function mountSection({ transactions = [], openingSet = true } = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useMoneyTransferStore(pinia)
  store.transactions = transactions
  store.currentBalance = { openingBalanceSource: openingSet ? 'manual' : null, bankAccount: 7000, transferCash: 750 }
  const wrapper = mount(ManagerRecordingSection, {
    props: { date: DATE, currentUser: { uid: 'u1', displayName: 'Manager' } },
    global: { plugins: [pinia], stubs },
  })
  await nextTick()
  return wrapper
}

const completeButton = (wrapper) =>
  wrapper.findAll('.action-btn').find(b => b.text().includes('ยืนยันบันทึกรายการ'))

describe('money-transfer ManagerRecordingSection', () => {
  describe('"ยืนยันบันทึกรายการ" button', () => {
    it('is enabled when the checklist is complete', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed')] })
      expect(completeButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('is disabled while a record is on hold', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed'), txn('b', 'on_hold')] })
      expect(completeButton(wrapper).attributes('disabled')).toBeDefined()
    })

    it('is disabled while a draft is queued', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed'), txn('b', 'draft')] })
      expect(completeButton(wrapper).attributes('disabled')).toBeDefined()
    })

    it('is disabled when the day has no records', async () => {
      const wrapper = await mountSection()
      expect(completeButton(wrapper).attributes('disabled')).toBeDefined()
    })

    it('is disabled before the opening balance is set', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed')], openingSet: false })
      expect(completeButton(wrapper).attributes('disabled')).toBeDefined()
    })
  })
})
