/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useBillPaymentStore } from '~/stores/bill-payment'
import CashVerificationSection from '~/components/bill-payment/CashVerificationSection.vue'

// ── Stub module imports ───────────────────────────────────────────────────────
vi.mock('~/composables/useLogger', () => ({
  useLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}))
vi.mock('~/composables/usePermissions', () => ({
  usePermissions: () => ({ can: vi.fn().mockReturnValue(true) }),
}))

const mockCalcExpected = vi.fn(() => ({ billPaymentCash: 1000, serviceFeeCash: 50 }))
const mockDiffCalc = vi.fn(() => ({ hasDiscrepancy: false, diff: 0 }))
vi.mock('~/composables/useBillPaymentHelpers', () => ({
  useBillPaymentHelpers: () => ({
    formatAmount: (v) => `${v} ฿`,
    calculateExpectedCash: mockCalcExpected,
    diffExpectedVsActual: mockDiffCalc,
  }),
}))

// ── Component stubs ───────────────────────────────────────────────────────────
const CashVerificationTableStub = {
  name: 'CashVerificationTable',
  template: '<div class="cash-verification-table" :data-mode="mode" :data-rows="JSON.stringify(rows)" />',
  props: ['rows', 'mode', 'verificationNotes', 'showTotal'],
  emits: ['update:managerActual'],
}
const ActionButtonStub = {
  name: 'ActionButton',
  template: '<button class="action-btn" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
  props: ['permission', 'variant', 'loading', 'disabled', 'size'],
  emits: ['click'],
}
const BaseBadgeStub = {
  name: 'BaseBadge',
  template: '<span class="badge"><slot /></span>',
  props: ['variant', 'size'],
}
const BaseAlertStub = {
  name: 'BaseAlert',
  template: '<div class="base-alert" :data-variant="variant">{{ message }}</div>',
  props: ['variant', 'message'],
  emits: ['close'],
}
const FormFieldStub = {
  name: 'FormField',
  template: '<div class="form-field"><slot /></div>',
  props: ['label', 'hint', 'required'],
}
const BaseTextareaStub = {
  name: 'BaseTextarea',
  template: '<textarea class="base-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'rows'],
  emits: ['update:modelValue'],
}

const globalConfig = {
  stubs: {
    CashVerificationTable: CashVerificationTableStub,
    ActionButton: ActionButtonStub,
    BaseBadge: BaseBadgeStub,
    BaseAlert: BaseAlertStub,
    FormField: FormFieldStub,
    BaseTextarea: BaseTextareaStub,
    ClipboardDocumentCheckIcon: { template: '<span />' },
    CheckCircleIcon: { template: '<span />' },
  },
}

const DEFAULT_PROPS = {
  date: '2026-04-14',
  currentUser: { uid: 'user-001', displayName: 'Manager Test' },
}

describe('CashVerificationSection', () => {
  beforeEach(() => {
    mockCalcExpected.mockReturnValue({ billPaymentCash: 1000, serviceFeeCash: 50 })
    mockDiffCalc.mockReturnValue({ hasDiscrepancy: false, diff: 0 })
  })

  // ─── Input mode (isStep2Active) ─────────────────────────────────────────────

  describe('input mode (step2 active)', () => {
    function mountActive() {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(CashVerificationSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      // isStep2Active: getCurrentWorkflowStatus === 'step1_in_progress' && step1CompletedAt set
      store.currentSummary = {
        workflowStatus: 'step1_in_progress',
        step1CompletedAt: '2026-04-14T10:00:00Z',
        step2CompletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return { wrapper, store }
    }

    it('renders CashVerificationTable with manager-input mode when step2 is active', async () => {
      const { wrapper } = mountActive()
      await nextTick()
      const table = wrapper.find('.cash-verification-table')
      expect(table.exists()).toBe(true)
      expect(table.attributes('data-mode')).toBe('manager-input')
    })

    it('shows step 2 section heading when active', async () => {
      const { wrapper } = mountActive()
      await nextTick()
      expect(wrapper.text()).toContain('ขั้นตอนที่ 2')
    })

    it('shows the verification notes textarea', async () => {
      const { wrapper } = mountActive()
      await nextTick()
      expect(wrapper.find('.base-textarea').exists()).toBe(true)
    })

    it('shows the submit ActionButton when step2 is active', async () => {
      const { wrapper } = mountActive()
      await nextTick()
      const btn = wrapper.find('.action-btn')
      expect(btn.exists()).toBe(true)
    })

    it('enables submit button when no discrepancy (form valid by default)', async () => {
      const { wrapper } = mountActive()
      await nextTick()
      const btn = wrapper.find('.action-btn')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('disables submit button when there is a discrepancy but notes are empty', async () => {
      // Make diffCalc return hasDiscrepancy: true
      mockDiffCalc.mockReturnValue({ hasDiscrepancy: true, diff: -100 })
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(CashVerificationSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'step1_in_progress',
        step1CompletedAt: '2026-04-14T10:00:00Z',
        step2CompletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      const btn = wrapper.find('.action-btn')
      // hasAnyDiscrepancy = true, notes = '' → isStep2FormValid = false → button disabled
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('enables submit button when discrepancy exists AND notes are provided', async () => {
      mockDiffCalc.mockReturnValue({ hasDiscrepancy: true, diff: -100 })
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(CashVerificationSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'step1_in_progress',
        step1CompletedAt: '2026-04-14T10:00:00Z',
        step2CompletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      // Type notes into textarea
      const textarea = wrapper.find('.base-textarea')
      await textarea.setValue('เงินสดขาด 100 บาท')
      await nextTick()
      const btn = wrapper.find('.action-btn')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('calls store.completeStep2 when submit button is clicked', async () => {
      const { wrapper, store } = mountActive()
      await nextTick()
      const btn = wrapper.find('.action-btn')
      await btn.trigger('click')
      expect(store.completeStep2).toHaveBeenCalledWith('2026-04-14', expect.any(Object))
    })

    it('emits step2-completed after successful submission', async () => {
      const { wrapper } = mountActive()
      await nextTick()
      const btn = wrapper.find('.action-btn')
      await btn.trigger('click')
      await nextTick()
      expect(wrapper.emitted('step2-completed')).toBeTruthy()
    })
  })

  // ─── Read-only mode (isStep2ReadOnly) ───────────────────────────────────────

  describe('read-only mode (step2 submitted)', () => {
    function mountReadOnly() {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(CashVerificationSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'step2_completed',
        step1CompletedAt: '2026-04-14T10:00:00Z',
        step2CompletedAt: '2026-04-14T11:00:00Z',
        step2ActualBillPaymentCash: 1000,
        step2ActualServiceFeeCash: 50,
        step2HasDiscrepancies: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return { wrapper, store }
    }

    it('renders CashVerificationTable with manager-readonly mode when step2 is done', async () => {
      const { wrapper } = mountReadOnly()
      await nextTick()
      const table = wrapper.find('.cash-verification-table')
      expect(table.exists()).toBe(true)
      expect(table.attributes('data-mode')).toBe('manager-readonly')
    })

    it('does not show the submit ActionButton in read-only mode', async () => {
      const { wrapper } = mountReadOnly()
      await nextTick()
      expect(wrapper.find('.action-btn').exists()).toBe(false)
    })

    it('shows "ตรงกัน" badge when step2 has no discrepancies', async () => {
      const { wrapper } = mountReadOnly()
      await nextTick()
      expect(wrapper.text()).toContain('ตรงกัน')
    })

    it('shows "มีส่วนต่าง" badge when step2 has discrepancies', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(CashVerificationSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'step2_completed',
        step2CompletedAt: '2026-04-14T11:00:00Z',
        step2HasDiscrepancies: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('มีส่วนต่าง')
    })
  })

  // ─── Neither active nor read-only ───────────────────────────────────────────

  describe('when step2 is neither active nor read-only', () => {
    it('does not render CashVerificationTable when step1 not completed and step2 not done', () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(CashVerificationSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      // currentSummary = null → step1CompletedAt = undefined → isStep2Active = false
      // step2CompletedAt = undefined → isStep2ReadOnly = false
      expect(wrapper.find('.cash-verification-table').exists()).toBe(false)
    })
  })
})
