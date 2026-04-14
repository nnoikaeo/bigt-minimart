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

const globalConfig = {
  stubs: {
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
    ClipboardDocumentCheckIcon: { template: '<span />' },
    XCircleIcon: { template: '<span />' },
    ArrowUturnLeftIcon: { template: '<span />' },
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
 * This is the only state in which the AUDITOR FORM section (canSubmitAudit) is visible,
 * because canSubmitAudit also requires auditorCashBillPayment !== null, which is
 * populated by the watch when workflowStatus === 'needs_correction'.
 */
function buildNeedsCorrectionSummary(overrides = {}) {
  return {
    workflowStatus: 'needs_correction',
    step2CompletedAt: '2026-04-14T11:00:00Z',
    step2ExpectedBillPaymentCash: 1000,
    step2ActualBillPaymentCash: 950,
    step2ExpectedServiceFeeCash: 50,
    step2ActualServiceFeeCash: 45,
    auditedAt: '2026-04-14T12:00:00Z',
    auditorActualBillPaymentCash: 950,
    auditorActualServiceFeeCash: 45,
    correctionNotes: 'ต้องแก้ไขรายการที่ 2',
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

  // ─── Auditor form section (canSubmitAudit) ──────────────────────────────────

  describe('auditor form section', () => {
    async function mountWithActiveAudit() {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = buildNeedsCorrectionSummary()
      store.transactions = []
      await nextTick()
      return { wrapper, store }
    }

    it('shows the auditor form section when canSubmitAudit is true', async () => {
      const { wrapper } = await mountWithActiveAudit()
      expect(wrapper.text()).toContain('ตรวจสอบโดย Auditor')
    })

    it('renders CashVerificationTable in auditor-input mode', async () => {
      const { wrapper } = await mountWithActiveAudit()
      const table = wrapper.find('.cash-verification-table[data-mode="auditor-input"]')
      expect(table.exists()).toBe(true)
    })

    it('renders 3 action buttons in the auditor form section', async () => {
      const { wrapper } = await mountWithActiveAudit()
      expect(wrapper.text()).toContain('ส่งกลับให้ Manager ปรับแก้')
      expect(wrapper.text()).toContain('ยืนยันพร้อมหมายเหตุ')
    })

    it('calls store.submitAudit with "audited" outcome when confirm button is clicked', async () => {
      const { wrapper, store } = await mountWithActiveAudit()
      const confirmBtn = wrapper.findAll('.action-btn').find(b =>
        b.text().includes('ส่งตรวจสอบใหม่') || b.text().includes('ยืนยันการตรวจสอบ'),
      )
      await confirmBtn.trigger('click')
      expect(store.submitAudit).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({ outcome: 'audited' }))
    })

    it('shows error when needs_correction submitted without correctionNotes', async () => {
      // Start with a summary that has NO correctionNotes in the component ref
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      // Use summary without correctionNotes so the component ref starts empty after watch re-fill
      store.currentSummary = buildNeedsCorrectionSummary({ correctionNotes: undefined })
      await nextTick()
      const sendBackBtn = wrapper.findAll('.action-btn').find(b =>
        b.text().includes('ส่งกลับให้ Manager ปรับแก้'),
      )
      await sendBackBtn.trigger('click')
      await nextTick()
      // Error message should appear (correctionNotes empty)
      expect(wrapper.find('.base-alert[data-variant="error"]').exists()).toBe(true)
    })

    it('calls store.submitAudit with "needs_correction" outcome when correctionNotes filled', async () => {
      const { wrapper, store } = await mountWithActiveAudit()
      // Fill correction notes in the textarea
      const textareas = wrapper.findAll('.base-textarea')
      const correctionTextarea = textareas[textareas.length - 1]
      await correctionTextarea.setValue('แก้ไขรายการที่ 1 ด้วย')
      await nextTick()
      const sendBackBtn = wrapper.findAll('.action-btn').find(b =>
        b.text().includes('ส่งกลับให้ Manager ปรับแก้'),
      )
      await sendBackBtn.trigger('click')
      expect(store.submitAudit).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({ outcome: 'needs_correction' }))
    })

    it('emits audit-submitted with the outcome when store action succeeds', async () => {
      const { wrapper } = await mountWithActiveAudit()
      const confirmBtn = wrapper.findAll('.action-btn').find(b =>
        b.text().includes('ส่งตรวจสอบใหม่') || b.text().includes('ยืนยันการตรวจสอบ'),
      )
      await confirmBtn.trigger('click')
      await nextTick()
      expect(wrapper.emitted('audit-submitted')).toBeTruthy()
    })
  })

  // ─── needs_correction context banner ───────────────────────────────────────

  describe('needs_correction context banner', () => {
    it('shows the needs-correction banner with correction notes', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(AuditorReviewSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = buildNeedsCorrectionSummary({ correctionNotes: 'ยอดเงินขาด 100' })
      await nextTick()
      expect(wrapper.text()).toContain('ตรวจสอบซ้ำ — Manager แก้ไขแล้ว')
      expect(wrapper.text()).toContain('ยอดเงินขาด 100')
    })
  })
})
