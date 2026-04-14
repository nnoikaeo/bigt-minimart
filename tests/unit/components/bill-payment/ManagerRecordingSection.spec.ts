/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useBillPaymentStore } from '~/stores/bill-payment'
import ManagerRecordingSection from '~/components/bill-payment/ManagerRecordingSection.vue'

// ── Stub module imports ───────────────────────────────────────────────────────
vi.mock('~/composables/useLogger', () => ({
  useLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}))
vi.mock('~/composables/usePermissions', () => ({
  usePermissions: () => ({ can: vi.fn().mockReturnValue(true) }),
}))
vi.mock('~/composables/useBillPaymentHelpers', () => ({
  useBillPaymentHelpers: () => ({
    formatAmount: (v) => `${v} ฿`,
    formatTime: (v) => v ?? '-',
    formatBillType: (v) => v ?? '-',
    formatTransactionType: (v) => v ?? '-',
    getStatusLabel: (v) => v ?? '-',
    getStatusBadgeVariant: () => 'default',
  }),
}))

// ── Component stubs ───────────────────────────────────────────────────────────
const ActionButtonStub = {
  name: 'ActionButton',
  template: '<button class="action-btn" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /><slot name="icon" /></button>',
  props: ['permission', 'variant', 'loading', 'disabled', 'size', 'title'],
  emits: ['click'],
}
const BaseBadgeStub = {
  name: 'BaseBadge',
  template: '<span class="badge"><slot /></span>',
  props: ['variant', 'size', 'dot'],
}
const BaseAlertStub = {
  name: 'BaseAlert',
  template: '<div class="base-alert" :data-variant="variant">{{ message }}</div>',
  props: ['variant', 'message', 'autoClose'],
  emits: ['close'],
}
const BaseButtonStub = {
  name: 'BaseButton',
  template: '<button class="base-btn" :variant="variant" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'disabled', 'loading'],
  emits: ['click'],
}
const BaseModalStub = {
  name: 'BaseModal',
  template: '<div v-if="open" class="base-modal"><slot /><slot name="footer" /></div>',
  props: ['open', 'title', 'size'],
  emits: ['close'],
}
const BaseInputStub = {
  name: 'BaseInput',
  template: '<input class="base-input" :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'type', 'placeholder', 'min'],
  emits: ['update:modelValue'],
}
const TransactionTableStub = {
  name: 'TransactionTable',
  template: '<div class="transaction-table" :data-count="transactions ? transactions.length : 0" />',
  props: ['transactions', 'columns', 'showFilterTabs', 'filterTabs', 'activeFilter', 'showPagination', 'pageSize', 'emptyMessage'],
  emits: ['update:activeFilter'],
}
const CompactBalanceSummaryStub = {
  name: 'CompactBalanceSummary',
  template: '<div class="compact-balance-summary" />',
  props: ['primaryCards', 'secondaryCards', 'collapsible', 'defaultExpanded', 'title'],
}
const BillPaymentTransactionFormStub = {
  name: 'BillPaymentTransactionForm',
  template: '<div class="bp-transaction-form" />',
  props: ['editingData', 'presetType'],
  emits: ['submit', 'cancel'],
}
const ConfirmDialogStub = {
  name: 'ConfirmDialog',
  template: '<div v-if="open" class="confirm-dialog" />',
  props: ['open', 'title', 'message'],
  emits: ['confirm', 'cancel'],
}

const globalConfig = {
  stubs: {
    ActionButton: ActionButtonStub,
    BaseBadge: BaseBadgeStub,
    BaseAlert: BaseAlertStub,
    BaseButton: BaseButtonStub,
    BaseModal: BaseModalStub,
    BaseInput: BaseInputStub,
    TransactionTable: TransactionTableStub,
    CompactBalanceSummary: CompactBalanceSummaryStub,
    BillPaymentTransactionForm: BillPaymentTransactionFormStub,
    ConfirmDialog: ConfirmDialogStub,
    EmptyState: { template: '<div class="empty-state" />', props: ['title', 'description'] },
    PlusIcon: { template: '<span />' },
    PencilIcon: { template: '<span />' },
    TrashIcon: { template: '<span />' },
    ExclamationTriangleIcon: { template: '<span />' },
    CheckCircleIcon: { template: '<span />' },
    EllipsisVerticalIcon: { template: '<span />' },
    StarIcon: { template: '<span />' },
    DocumentTextIcon: { template: '<span />' },
    BanknotesIcon: { template: '<span />' },
    Cog6ToothIcon: { template: '<span />' },
    BaseTextarea: { template: '<textarea class="base-textarea" />', props: ['modelValue', 'placeholder', 'rows'], emits: ['update:modelValue'] },
    BaseSelect: { template: '<select class="base-select" />', props: ['modelValue', 'placeholder', 'options'], emits: ['update:modelValue'] },
    FormField: { template: '<div class="form-field"><slot /></div>', props: ['label', 'required', 'hint'] },
  },
}

const DEFAULT_PROPS = {
  date: '2026-04-14',
  currentUser: { uid: 'user-001', displayName: 'Manager Test' },
}

function mountSection(initialState = {}, propsOverrides = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  return mount(ManagerRecordingSection, {
    props: { ...DEFAULT_PROPS, ...propsOverrides },
    global: {
      plugins: [pinia],
      ...globalConfig,
    },
  })
}

describe('ManagerRecordingSection', () => {
  // ─── Opening Balance prompt ─────────────────────────────────────────────────

  describe('opening balance prompt', () => {
    it('shows the opening balance prompt when currentBalance is null', () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      // currentBalance = null → openingBalanceSource = undefined → isOpeningSet = false
      expect(store.currentBalance).toBeNull()
      expect(wrapper.text()).toContain('กำหนดยอดเงินเริ่มต้น')
    })

    it('hides the opening balance prompt when balance source is set', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentBalance = { openingBalanceSource: 'manual', bankAccount: 5000, billPaymentCash: 0, serviceFeeCash: 0 }
      await nextTick()
      expect(wrapper.text()).not.toContain('กำหนดยอดเงินในบัญชีเริ่มต้น')
    })
  })

  // ─── Draft / On-Hold alert ──────────────────────────────────────────────────

  describe('draft / on-hold alert', () => {
    it('shows the pending-transactions alert when there are draft transactions', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.transactions = [
        { id: 'txn-1', date: '2026-04-14', status: 'draft', amount: 100, commission: 5, transactionType: 'bill_payment', recordedBy: 'u1', recordedAt: new Date().toISOString(), timestamp: new Date().toISOString() },
      ]
      await nextTick()
      expect(wrapper.text()).toContain('มีรายการที่รอดำเนินการ')
    })

    it('shows the pending-transactions alert when there are on_hold transactions', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.transactions = [
        { id: 'txn-2', date: '2026-04-14', status: 'on_hold', amount: 200, commission: 10, transactionType: 'bill_payment', recordedBy: 'u1', recordedAt: new Date().toISOString(), timestamp: new Date().toISOString() },
      ]
      await nextTick()
      expect(wrapper.text()).toContain('มีรายการที่รอดำเนินการ')
    })

    it('hides the pending-transactions alert when all transactions are completed', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.transactions = [
        { id: 'txn-3', date: '2026-04-14', status: 'completed', amount: 500, commission: 20, transactionType: 'bill_payment', recordedBy: 'u1', recordedAt: new Date().toISOString(), timestamp: new Date().toISOString() },
      ]
      await nextTick()
      expect(wrapper.text()).not.toContain('มีรายการที่รอดำเนินการ')
    })
  })

  // ─── Checklist items ────────────────────────────────────────────────────────

  describe('checklist items', () => {
    it('shows "ตั้ง Opening Balance แล้ว" checklist item', () => {
      const wrapper = mountSection()
      expect(wrapper.text()).toContain('ตั้ง Opening Balance แล้ว')
    })

    it('shows "มีรายการอย่างน้อย 1 รายการ" checklist item', () => {
      const wrapper = mountSection()
      expect(wrapper.text()).toContain('มีรายการอย่างน้อย 1 รายการ')
    })

    it('shows "ไม่มีรายการ Draft ค้าง" checklist item', () => {
      const wrapper = mountSection()
      expect(wrapper.text()).toContain('ไม่มีรายการ Draft ค้าง')
    })

    it('shows "ไม่มีรายการ On Hold ค้าง" checklist item', () => {
      const wrapper = mountSection()
      expect(wrapper.text()).toContain('ไม่มีรายการ On Hold ค้าง')
    })

    it('shows "พร้อมยืนยัน" header when all conditions are met', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentBalance = { openingBalanceSource: 'manual', bankAccount: 5000, billPaymentCash: 0, serviceFeeCash: 0 }
      store.transactions = [
        { id: 'txn-4', date: '2026-04-14', status: 'completed', amount: 500, commission: 20, transactionType: 'bill_payment', recordedBy: 'u1', recordedAt: new Date().toISOString(), timestamp: new Date().toISOString() },
      ]
      await nextTick()
      expect(wrapper.text()).toContain('พร้อมยืนยันบันทึกรายการแล้ว')
    })
  })

  // ─── Step 1 completion button ───────────────────────────────────────────────

  describe('step 1 completion button', () => {
    it('renders the step 1 completion ActionButton', () => {
      const wrapper = mountSection()
      const buttons = wrapper.findAll('.action-btn')
      const step1Btn = buttons.find(b => b.text().includes('ยืนยันบันทึกรายการ'))
      expect(step1Btn).toBeTruthy()
    })

    it('disables the step 1 button when canCompleteStep1 is false (no balance + no transactions)', () => {
      const wrapper = mountSection()
      const buttons = wrapper.findAll('.action-btn')
      const step1Btn = buttons.find(b => b.text().includes('ยืนยันบันทึกรายการ'))
      expect(step1Btn.attributes('disabled')).toBeDefined()
    })

    it('enables the step 1 button when all conditions are satisfied', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentBalance = { openingBalanceSource: 'manual', bankAccount: 5000, billPaymentCash: 0, serviceFeeCash: 0 }
      store.transactions = [
        { id: 'txn-5', date: '2026-04-14', status: 'completed', amount: 500, commission: 20, transactionType: 'bill_payment', recordedBy: 'u1', recordedAt: new Date().toISOString(), timestamp: new Date().toISOString() },
      ]
      await nextTick()
      const buttons = wrapper.findAll('.action-btn')
      const step1Btn = buttons.find(b => b.text().includes('ยืนยันบันทึกรายการ'))
      expect(step1Btn.attributes('disabled')).toBeUndefined()
    })

    it('calls store.completeStep1 when button is clicked and conditions met', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentBalance = { openingBalanceSource: 'manual', bankAccount: 5000, billPaymentCash: 0, serviceFeeCash: 0 }
      store.transactions = [
        { id: 'txn-6', date: '2026-04-14', status: 'completed', amount: 500, commission: 20, transactionType: 'bill_payment', recordedBy: 'u1', recordedAt: new Date().toISOString(), timestamp: new Date().toISOString() },
      ]
      await nextTick()
      const buttons = wrapper.findAll('.action-btn')
      const step1Btn = buttons.find(b => b.text().includes('ยืนยันบันทึกรายการ'))
      await step1Btn.trigger('click')
      expect(store.completeStep1).toHaveBeenCalledWith('2026-04-14')
    })
  })

  // ─── Quick actions section ──────────────────────────────────────────────────

  describe('quick actions section', () => {
    it('shows quick actions section when workflow is step1_in_progress', () => {
      // Default state: no currentSummary → workflowStatus = 'step1_in_progress'
      const wrapper = mountSection()
      expect(wrapper.text()).toContain('รายการด่วน')
    })

    it('renders 3 quick action buttons', () => {
      const wrapper = mountSection()
      expect(wrapper.text()).toContain('รายการโปรด')
      expect(wrapper.text()).toContain('รับชำระบิล')
      expect(wrapper.text()).toContain('ฝากเงิน')
    })

    it('disables quick action buttons when opening balance is not set', () => {
      const wrapper = mountSection()
      // canAddTransaction = isOpeningSet && isStep1InProgress
      // With no currentBalance, isOpeningSet = false, so quick action buttons should be disabled
      const quickActionBtns = wrapper.findAll('button[disabled]')
      expect(quickActionBtns.length).toBeGreaterThan(0)
    })
  })

  // ─── Needs correction banner ────────────────────────────────────────────────

  describe('needs correction banner', () => {
    it('shows needs correction banner when workflow is needs_correction with correction notes', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(ManagerRecordingSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'needs_correction',
        correctionNotes: 'ยอดเงินขาด 200 บาท',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('ส่งกลับให้แก้ไข')
      expect(wrapper.text()).toContain('ยอดเงินขาด 200 บาท')
    })
  })
})
