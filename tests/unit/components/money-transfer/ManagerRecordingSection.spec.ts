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

async function mountSection({ transactions = [], openingSet = true, summary = null } = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useMoneyTransferStore(pinia)
  store.transactions = transactions
  store.currentSummary = summary
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
  describe('detail modal before → after (BUG-056)', () => {
    // MT 17/10/2569 from the manual test: opening 7,500; transfer completed after the deposit, then cancelled
    const day = (transferStatus = 'cancelled') => [
      { id: 'transfer', date: DATE, transactionType: 'transfer', status: transferStatus, amount: 800, commission: 10, commissionType: 'cash',
        createdAt: '2026-11-02T13:26:49Z', completedAt: '2026-11-02T13:33:12Z',
        balanceImpact: { bankAccountBefore: 8500, bankAccountAfter: 7700, transferCashBefore: 0, transferCashAfter: 800 } },
      { id: 'withdrawal', date: DATE, transactionType: 'withdrawal', status: 'completed', amount: 300, commission: 10, commissionType: 'cash',
        createdAt: '2026-11-02T13:28:04Z', completedAt: '2026-11-02T13:34:05Z',
        balanceImpact: { bankAccountBefore: 7700, bankAccountAfter: 8000, transferCashBefore: 800, transferCashAfter: 500 } },
      { id: 'deposit', date: DATE, transactionType: 'owner_deposit', status: 'completed', amount: 1000, commission: 0,
        createdAt: '2026-11-02T13:28:37Z',
        balanceImpact: { bankAccountBefore: 7500, bankAccountAfter: 8500 } },
    ]

    async function openDetail(id, { transactions = day(), openingBalance = 7500 } = {}) {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const store = useMoneyTransferStore(pinia)
      store.transactions = transactions
      store.currentBalance = { openingBalanceSource: 'carryover', openingBalance, bankAccount: 8800, transferCash: -300 }
      const wrapper = mount(ManagerRecordingSection, {
        props: { date: DATE, currentUser: { uid: 'u1', displayName: 'Manager' } },
        global: {
          plugins: [pinia],
          stubs: { ...stubs, BaseModal: { template: '<div v-if="open" class="base-modal"><slot /><slot name="footer" /></div>', props: ['open', 'title', 'size'] } },
        },
      })
      wrapper.vm.openDetailModal(transactions.find(t => t.id === id))
      await nextTick()
      return wrapper
    }

    it('recomputes the withdrawal after the earlier transfer was cancelled (8,500 → 8,800, not 7,700 → 8,000)', async () => {
      const text = (await openDetail('withdrawal')).find('[data-testid="balance-impact"]').text()
      expect(text).toMatch(/8500 ฿\s*8800 ฿/)
      expect(text).not.toContain('7700 ฿')
    })

    it('says a cancelled transaction does not count instead of showing its old -800', async () => {
      const wrapper = await openDetail('transfer')
      expect(wrapper.find('[data-testid="balance-impact"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="balance-not-counted"]').text()).toContain('ไม่นับยอด (ยกเลิก)')
    })

    it('falls back to the stored snapshot when the day has no opening balance (old data)', async () => {
      const text = (await openDetail('withdrawal', { openingBalance: null })).find('[data-testid="balance-impact"]').text()
      expect(text).toMatch(/7700 ฿\s*8000 ฿/)
    })
  })

  describe('carry-over option in the opening balance modal (BUG-046)', () => {
    async function openModal(previousDayBalance) {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const store = useMoneyTransferStore(pinia)
      store.transactions = []
      store.currentBalance = null
      store.previousDayBalance = previousDayBalance
      const wrapper = mount(ManagerRecordingSection, {
        props: { date: DATE, currentUser: { uid: 'u1', displayName: 'Manager' } },
        global: {
          plugins: [pinia],
          stubs: { ...stubs, BaseModal: { template: '<div v-if="open" class="base-modal"><slot /></div>', props: ['open', 'title', 'size'] } },
        },
      })
      wrapper.vm.openOpeningBalanceModal()
      await nextTick()
      return wrapper.find('.base-modal').text()
    }

    it('names the day the balance comes from instead of "yesterday"', async () => {
      const text = await openModal({ date: '2026-10-18', bankAccount: 1000, openingBalanceSource: 'manual' })
      expect(text).toContain('ยอดคงเหลือ ณ สิ้นวัน 18/10/2569')
      expect(text).not.toContain('เมื่อวาน')
    })

    it('shows "ไม่พบข้อมูลวันก่อนหน้า" and no date when there is no earlier balance', async () => {
      const text = await openModal(null)
      expect(text).toContain('ไม่พบข้อมูลวันก่อนหน้า')
      expect(text).not.toContain('ณ สิ้นวัน')
    })
  })

  describe('sent back for correction (BUG-035)', () => {
    const sentBack = (needsCorrectionFrom) => ({
      date: DATE,
      workflowStatus: 'needs_correction',
      needsCorrectionFrom,
      correctionNotes: 'นับเงินถอนใหม่',
      step1: { status: 'completed' },
    })

    it('shows who sent it back and why', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed')], summary: sentBack('audited') })
      expect(wrapper.text()).toContain('ส่งกลับให้แก้ไข — Owner ส่งคืน')
      expect(wrapper.text()).toContain('นับเงินถอนใหม่')
    })

    it('names the Auditor when sent back from Step 2', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed')], summary: sentBack('step2_completed') })
      expect(wrapper.text()).toContain('ส่งกลับให้แก้ไข — Auditor ส่งคืน')
    })

    it('lets the Manager re-confirm Step 1', async () => {
      const wrapper = await mountSection({ transactions: [txn('a', 'completed')], summary: sentBack('audited') })
      expect(completeButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('hides the Step 1 button once Step 1 is confirmed again', async () => {
      const wrapper = await mountSection({
        transactions: [txn('a', 'completed')],
        summary: { date: DATE, workflowStatus: 'step1_completed', step1: { status: 'completed' } },
      })
      expect(completeButton(wrapper)).toBeUndefined()
    })
  })

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
