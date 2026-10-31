/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useBillPaymentStore } from '~/stores/bill-payment'
import AuditorReviewSection from '~/components/bill-payment/AuditorReviewSection.vue'

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
    formatDiff: (v) => `${v}`,
  }),
}))

// ── Component stubs ───────────────────────────────────────────────────────────
const ActionButtonStub = {
  name: 'ActionButton',
  template: '<button class="action-btn" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /><slot name="icon" /></button>',
  props: ['permission', 'variant', 'loading', 'disabled', 'size'],
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
  props: ['variant', 'message'],
  emits: ['close'],
}
const CashVerificationTableStub = {
  name: 'CashVerificationTable',
  template: '<div class="cash-verification-table" :data-mode="mode" />',
  props: ['rows', 'mode', 'verificationNotes'],
  emits: ['update:auditorActual'],
}
const BalanceSnapshotStub = {
  name: 'BalanceSnapshot',
  template: '<div class="balance-snapshot"><slot /></div>',
  props: ['openingBalance', 'closingBalance', 'netChangeLabel'],
}
const TransactionTableStub = {
  name: 'TransactionTable',
  template: '<div class="transaction-table"><slot /><slot name="actions" v-bind="{ txn: { id: \'txn-stub\' } }" /></div>',
  props: ['transactions', 'columns', 'issuedIds', 'emptyMessage'],
  emits: ['row-click'],
}
const FormFieldStub = {
  name: 'FormField',
  template: '<div class="form-field"><slot /></div>',
  props: ['label', 'hint'],
}
const BaseInputStub = {
  name: 'BaseInput',
  template: '<input class="base-input" :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'type', 'placeholder'],
  emits: ['update:modelValue'],
}
const BaseTextareaStub = {
  name: 'BaseTextarea',
  template: '<textarea class="base-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'rows'],
  emits: ['update:modelValue'],
}
const BaseModalStub = {
  name: 'BaseModal',
  template: '<div v-if="open" class="base-modal"><slot /></div>',
  props: ['open', 'title'],
  emits: ['close'],
}

const ConfirmDialogStub = {
  name: 'ConfirmDialog',
  template: '<div v-if="open" class="confirm-dialog"><button class="confirm-ok" @click="$emit(\'confirm\')">{{ confirmText }}</button></div>',
  props: ['open', 'title', 'message', 'confirmText', 'variant'],
  emits: ['confirm', 'cancel'],
}
const CollapsibleSectionStub = {
  name: 'CollapsibleSection',
  template: '<div class="collapsible-section">{{ title }} {{ badge?.label }} {{ summary }}<slot /></div>',
  props: ['icon', 'title', 'badge', 'summary', 'expanded'],
}

const globalConfig = {
  stubs: {
    ConfirmDialog: ConfirmDialogStub,
    CollapsibleSection: CollapsibleSectionStub,
    ActionButton: ActionButtonStub,
    BaseBadge: BaseBadgeStub,
    BaseAlert: BaseAlertStub,
    CashVerificationTable: CashVerificationTableStub,
    BalanceSnapshot: BalanceSnapshotStub,
    TransactionTable: TransactionTableStub,
    FormField: FormFieldStub,
    BaseInput: BaseInputStub,
    BaseTextarea: BaseTextareaStub,
    BaseModal: BaseModalStub,
    EmptyState: { template: '<div class="empty-state" />', props: ['title', 'description'] },
    CheckCircleIcon: { template: '<span />' },
    ExclamationTriangleIcon: { template: '<span />' },
    XCircleIcon: { template: '<span />' },
    EyeIcon: { template: '<span />' },
    ChevronDownIcon: { template: '<span />' },
    ChevronRightIcon: { template: '<span />' },
    BaseButton: {
      name: 'BaseButton',
      template: '<button class="base-btn" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
      props: ['variant', 'disabled', 'loading', 'type'],
      emits: ['click'],
    },
  },
}

const DEFAULT_PROPS = { date: '2026-04-14' }

/**
 * Builds a summary seeded for the "needs_correction re-audit" scenario:
 * - step2 is complete
 * - previously audited
 * - auditor cash values are set (triggers the watch to pre-fill component refs)
 * - workflowStatus = 'needs_correction'
 *
 * The pre-filled counts make canSubmitAudit true, so the submit buttons are enabled.
 */
function buildNeedsCorrectionSummary(overrides = {}) {
  return {
    workflowStatus: 'needs_correction',
    step2CompletedAt: '2026-04-14T11:00:00Z',
    step2ExpectedBillPaymentCash: 1000,
    step2ActualBillPaymentCash: 1000,
    step2ExpectedServiceFeeCash: 50,
    step2ActualServiceFeeCash: 50,
    auditedAt: '2026-04-14T12:00:00Z',
    auditorActualBillPaymentCash: 1000,
    auditorActualServiceFeeCash: 50,
    auditBankStatementAmount: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('AuditorReviewSection', () => {
  // ─── Not-ready warning ──────────────────────────────────────────────────────

  describe('not-ready warning', () => {
    it('shows warning when step2 is not complete', () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      // Default: currentSummary null → step2CompletedAt undefined → isStep2Complete = false
      expect(wrapper.text()).toContain('Manager ยังไม่ได้ตรวจนับเงินสด')
    })

    it('hides the not-ready warning when step2 is complete', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'step2_completed',
        step2CompletedAt: '2026-04-14T11:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).not.toContain('Manager ยังไม่ได้ตรวจนับเงินสด')
    })
  })

  // ─── Already audited banner ─────────────────────────────────────────────────

  describe('already audited banner', () => {
    it('shows already-audited banner when workflow is audited', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'audited',
        step2CompletedAt: '2026-04-14T11:00:00Z',
        auditedAt: '2026-04-14T12:00:00Z',
        auditedByName: 'Auditor A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('ตรวจสอบแล้ว')
    })

    it('shows auditor name in the already-audited banner', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'audited',
        step2CompletedAt: '2026-04-14T11:00:00Z',
        auditedAt: '2026-04-14T12:00:00Z',
        auditedByName: 'Auditor A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('Auditor A')
    })
  })

  // ─── Auditor form visibility (regression: form was gated on the counts it collects) ──

  describe('auditor form visibility', () => {
    it('shows the form for step2_completed before any count is entered, with submit disabled', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'step2_completed',
        step2CompletedAt: '2026-04-14T11:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('ตรวจสอบบริการรับชำระบิล')
      expect(wrapper.find('.cash-verification-table[data-mode="auditor-input"]').exists()).toBe(true)
      const confirmBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ยืนยันการตรวจสอบ'))
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })
  })

  // ─── Auditor form section ──────────────────────────────────

  describe('auditor form section', () => {
    async function mountWithActiveAudit() {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = buildNeedsCorrectionSummary()
      store.currentBalance = { openingBalance: 500 }
      store.transactions = []
      await nextTick()
      return { wrapper, store }
    }

    it('shows the auditor form section when counts are pre-filled', async () => {
      const { wrapper } = await mountWithActiveAudit()
      expect(wrapper.text()).toContain('ตรวจสอบบริการรับชำระบิล')
    })

    it('renders CashVerificationTable in auditor-input mode', async () => {
      const { wrapper } = await mountWithActiveAudit()
      const table = wrapper.find('.cash-verification-table[data-mode="auditor-input"]')
      expect(table.exists()).toBe(true)
    })

    it('renders 3 action buttons in the auditor form section', async () => {
      const { wrapper } = await mountWithActiveAudit()
      expect(wrapper.text()).toContain('ส่งคืนแก้ไข')
      expect(wrapper.text()).toContain('ยืนยันพร้อมหมายเหตุ')
    })

    it('calls store.submitAudit with "audited" outcome when confirm button is clicked', async () => {
      const { wrapper, store } = await mountWithActiveAudit()
      const confirmBtn = wrapper.findAll('.action-btn').find(b =>
        b.text().includes('ส่งตรวจสอบใหม่') || b.text().includes('ยืนยันการตรวจสอบ'),
      )
      await confirmBtn.trigger('click')
      expect(store.submitAudit).not.toHaveBeenCalled()
      await wrapper.find('.confirm-ok').trigger('click')
      expect(store.submitAudit).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({ outcome: 'audited' }))
    })

    it('disables send-back until issue details are entered', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = buildNeedsCorrectionSummary({ correctionNotes: undefined })
      await nextTick()
      const sendBackBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ส่งคืนแก้ไข'))
      expect(sendBackBtn.attributes('disabled')).toBeDefined()
    })

    it('sends needs_correction with the issue details as correctionNotes', async () => {
      const { wrapper, store } = await mountWithActiveAudit()
      await wrapper.find('.base-textarea').setValue('แก้ไขรายการที่ 1 ด้วย')
      await nextTick()
      const sendBackBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ส่งคืนแก้ไข'))
      await sendBackBtn.trigger('click')
      await wrapper.find('.confirm-ok').trigger('click')
      expect(store.submitAudit).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({
        outcome: 'needs_correction',
        correctionNotes: 'แก้ไขรายการที่ 1 ด้วย',
      }))
    })

    it('sends audited_with_issues and blocks the clean confirm once details are entered', async () => {
      const { wrapper, store } = await mountWithActiveAudit()
      await wrapper.find('.base-textarea').setValue('ยอดไม่ตรงเล็กน้อย')
      await nextTick()
      const confirmBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ยืนยันการตรวจสอบ'))
      expect(confirmBtn.attributes('disabled')).toBeDefined()
      const withNotesBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ยืนยันพร้อมหมายเหตุ'))
      await withNotesBtn.trigger('click')
      await wrapper.find('.confirm-ok').trigger('click')
      expect(store.submitAudit).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({ outcome: 'audited_with_issues' }))
    })

    it('blocks the clean confirm when Manager count differs from expected', async () => {
      const { wrapper, store } = await mountWithActiveAudit()
      store.currentSummary = buildNeedsCorrectionSummary({ step2HasDiscrepancies: true })
      await nextTick()
      const confirmBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ยืนยันการตรวจสอบ'))
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })

    it('disables confirm-with-notes until issue details are entered', async () => {
      const { wrapper } = await mountWithActiveAudit()
      await wrapper.find('.base-textarea').setValue('')
      await nextTick()
      const withNotesBtn = wrapper.findAll('.action-btn').find(b => b.text().includes('ยืนยันพร้อมหมายเหตุ'))
      expect(withNotesBtn.attributes('disabled')).toBeDefined()
    })

    it('emits audit-submitted with the outcome when store action succeeds', async () => {
      const { wrapper } = await mountWithActiveAudit()
      const confirmBtn = wrapper.findAll('.action-btn').find(b =>
        b.text().includes('ส่งตรวจสอบใหม่') || b.text().includes('ยืนยันการตรวจสอบ'),
      )
      await confirmBtn.trigger('click')
      await wrapper.find('.confirm-ok').trigger('click')
      await nextTick()
      expect(wrapper.emitted('audit-submitted')).toBeTruthy()
    })
  })

  // ─── needs_correction context banner ───────────────────────────────────────

  describe('needs_correction context banner', () => {
    it('says the day is waiting for Manager while Step 2 is cleared', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = buildNeedsCorrectionSummary({
        step2CompletedAt: undefined,
        correctionNotes: 'ยอดเงินขาด 100',
      })
      await nextTick()
      expect(wrapper.text()).toContain('รอ Manager ตรวจนับเงินสดใหม่')
      expect(wrapper.text()).toContain('ยอดเงินขาด 100')
      expect(wrapper.text()).not.toContain('ตรวจสอบซ้ำ')
      expect(wrapper.text()).not.toContain('Manager ยังไม่ได้ตรวจนับเงินสด')
    })

    it('shows the old note on the re-audit after Manager re-counted', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = buildNeedsCorrectionSummary({
        workflowStatus: 'step2_completed',
        auditedAt: undefined,
        correctionNotes: 'ยอดเงินขาด 100',
      })
      await nextTick()
      expect(wrapper.text()).toContain('ตรวจสอบซ้ำ — Manager แก้ไขแล้ว')
      expect(wrapper.text()).toContain('ยอดเงินขาด 100')
    })
  })
})
