/* eslint-disable */
// @ts-nocheck
/**
 * BUG-026 (MT): "ยืนยันการตรวจสอบ" only when there is nothing to report and
 * Bank Statement + both counts are filled — same rule as BP.
 */
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useMoneyTransferStore } from '~/stores/money-transfer'
import AuditorReviewSection from '~/components/money-transfer/AuditorReviewSection.vue'

vi.stubGlobal('useMoneyTransferHelpers', () => ({
  formatCurrency: (v) => `${v} ฿`,
  formatTime: (v) => v ?? '-',
  formatDatetime: (v) => v ?? '-',
  getTransactionTypeLabel: (v) => v ?? '-',
  getStatusBadgeVariant: () => 'default',
  getStatusLabel: (v) => v ?? '-',
  getAccountName: (t) => t?.accountName ?? '-',
  getChannelSubtitle: () => '',
  formatDiff: (v) => `${v}`,
}))
vi.mock('~/composables/useLogger', () => ({
  useLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}))
vi.mock('~/composables/usePermissions', () => ({
  usePermissions: () => ({ can: vi.fn().mockReturnValue(true), hasAnyRole: vi.fn().mockReturnValue(true) }),
}))
vi.stubGlobal('IntersectionObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})

const stubs = {
  BaseButton: {
    template: '<button class="btn" :disabled="disabled" :title="title" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size', 'disabled', 'title'],
    emits: ['click'],
  },
  BaseInput: {
    template: '<input class="base-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value === \'\' ? \'\' : Number($event.target.value))" />',
    props: ['modelValue', 'type', 'placeholder'],
    emits: ['update:modelValue'],
  },
  BaseTextarea: {
    template: '<textarea class="base-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows'],
    emits: ['update:modelValue'],
  },
  BaseAlert: true,
  BaseBadge: { template: '<span><slot /></span>' },
  BaseModal: true,
  BalanceSnapshot: { template: '<div><slot /></div>' },
  CashVerificationTable: true,
  CollapsibleSection: true,
  ConfirmDialog: true,
  FormField: { template: '<div><slot /></div>' },
  TransactionTable: true,
  teleport: true,
}

const DATE = '2026-03-09'
// Expected cash: transfer 1,000 + fee 10 (cash); closing bank 5,000
const transactions = [
  { id: 't1', date: DATE, status: 'completed', transactionType: 'transfer', amount: 1000, commission: 10, commissionType: 'cash' },
]
const summary = (hasDiscrepancies = false) => ({
  date: DATE,
  workflowStatus: hasDiscrepancies ? 'step2_completed_with_notes' : 'step2_completed',
  step1: { status: 'completed', finalBalances: { bankAccount: 5000 } },
  step2: { status: 'completed', hasDiscrepancies, actualCash: { transferWithdrawal: 1000, serviceFee: 10, total: 1010 } },
})

async function mountSection({ hasDiscrepancies = false } = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useMoneyTransferStore(pinia)
  store.transactions = transactions
  store.currentBalance = { openingBalance: 6000, bankAccount: 5000 }
  store.currentSummary = summary(hasDiscrepancies)
  const wrapper = mount(AuditorReviewSection, {
    props: { date: DATE, isNeedsCorrection: false },
    global: { plugins: [pinia], stubs },
  })
  await nextTick()
  return wrapper
}

const button = (wrapper, label) => wrapper.findAll('button.btn').find(b => b.text() === label)
const greenButton = (w) => button(w, 'ยืนยันการตรวจสอบ')
const notedButton = (w) => button(w, 'ยืนยันพร้อมหมายเหตุ')
const rawInputs = (w) => w.findAll('input').filter(i => !i.classes('base-input'))

async function fill(wrapper, { bank = 5000, cash = 1000, fee = 10, notes = '' } = {}) {
  if (bank !== null) await wrapper.find('.base-input').setValue(String(bank))
  const [cashInput, feeInput] = rawInputs(wrapper)
  if (cash !== null) await cashInput.setValue(String(cash))
  if (fee !== null) await feeInput.setValue(String(fee))
  if (notes) await wrapper.find('.base-textarea').setValue(notes)
}

describe('money-transfer AuditorReviewSection — confirm buttons (BUG-026)', () => {
  it('enables "ยืนยันการตรวจสอบ" when everything matches and nothing is reported', async () => {
    const wrapper = await mountSection()
    await fill(wrapper)
    expect(greenButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(notedButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('requires the Bank Statement', async () => {
    const wrapper = await mountSection()
    await fill(wrapper, { bank: null })
    expect(greenButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('requires both cash counts', async () => {
    const wrapper = await mountSection()
    await fill(wrapper, { fee: null })
    expect(greenButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('sends a Bank Statement difference to "ยืนยันพร้อมหมายเหตุ"', async () => {
    const wrapper = await mountSection()
    await fill(wrapper, { bank: 4900 })
    expect(greenButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('ใช้ปุ่ม "ยืนยันพร้อมหมายเหตุ"')
  })

  it('sends an Auditor count difference to "ยืนยันพร้อมหมายเหตุ"', async () => {
    const wrapper = await mountSection()
    await fill(wrapper, { cash: 900 })
    expect(greenButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('sends a Manager count difference (Step 2 with notes) to "ยืนยันพร้อมหมายเหตุ"', async () => {
    const wrapper = await mountSection({ hasDiscrepancies: true })
    await fill(wrapper)
    expect(greenButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('issue details: green off, noted on', async () => {
    const wrapper = await mountSection()
    await fill(wrapper, { notes: 'เงินสดขาด 100' })
    expect(greenButton(wrapper).attributes('disabled')).toBeDefined()
    expect(notedButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('"ยืนยันพร้อมหมายเหตุ" also needs the Bank Statement', async () => {
    const wrapper = await mountSection()
    await fill(wrapper, { bank: null, notes: 'เงินสดขาด 100' })
    expect(notedButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
