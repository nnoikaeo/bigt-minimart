/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useBillPaymentStore } from '~/stores/bill-payment'
import OwnerApprovalSection from '~/components/bill-payment/OwnerApprovalSection.vue'

// ── Stub module imports ───────────────────────────────────────────────────────
vi.mock('~/composables/useLogger', () => ({
  useLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}))
vi.mock('~/composables/useBillPaymentHelpers', () => ({
  useBillPaymentHelpers: () => ({
    formatAmount: (v) => `${v} ฿`,
    formatTime: (v) => v ?? '-',
    formatDatetime: (v) => v ?? '-',
    formatBillType: (v) => v ?? '-',
    formatTransactionType: (v) => v ?? '-',
    getStatusLabel: (v) => v ?? '-',
    getStatusBadgeVariant: () => 'default',
    formatWorkflowStatus: () => ({ label: 'อนุมัติ' }),
    formatDiff: (v) => `${v}`,
  }),
}))

// ── Component stubs ───────────────────────────────────────────────────────────
const OwnerDecisionCardStub = {
  name: 'OwnerDecisionCard',
  template: '<div class="owner-decision-card"><button class="decision-submit" @click="$emit(\'submit\', modelValue, \'test notes\')">Submit Decision</button></div>',
  props: ['modelValue', 'isSubmitting', 'disableCorrection'],
  emits: ['update:modelValue', 'submit'],
}
const BaseBadgeStub = {
  name: 'BaseBadge',
  template: '<span class="badge"><slot /></span>',
  props: ['variant', 'size'],
}
const BaseAlertStub = {
  name: 'BaseAlert',
  template: '<div class="base-alert" :data-variant="variant">{{ message }}</div>',
  props: ['variant', 'message', 'autoClose'],
  emits: ['close'],
}
const EmptyStateStub = {
  name: 'EmptyState',
  template: '<div class="empty-state" />',
  props: ['title'],
}
const WorkflowStepSummaryCardStub = {
  name: 'WorkflowStepSummaryCard',
  template: '<div class="workflow-step-summary-card"><div class="wssc-header"><span>Step {{ stepNumber }} — {{ title }}</span><button class="wssc-toggle"><slot name="header-right" />รายการธุรกรรมทั้งหมด</button></div><div class="wssc-body"><slot /></div></div>',
  props: ['stepNumber', 'title', 'summaryItems', 'badge'],
}

const globalConfig = {
  stubs: {
    OwnerDecisionCard: OwnerDecisionCardStub,
    BaseBadge: BaseBadgeStub,
    BaseAlert: BaseAlertStub,
    EmptyState: EmptyStateStub,
    WorkflowStepSummaryCard: WorkflowStepSummaryCardStub,
    CheckCircleIcon: { template: '<span />' },
    ExclamationTriangleIcon: { template: '<span />' },
    BanknotesIcon: { template: '<span />' },
    DocumentTextIcon: { template: '<span />' },
    ShieldCheckIcon: { template: '<span />' },
    ChevronDownIcon: { template: '<span />' },
    ChevronUpIcon: { template: '<span />' },
  },
}

const DEFAULT_PROPS = { date: '2026-04-14' }

describe('OwnerApprovalSection', () => {
  // ─── Not-audited warning ────────────────────────────────────────────────────

  describe('not-audited warning', () => {
    it('shows warning when not yet audited', () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      // Default: currentSummary null → isAudited = false
      expect(wrapper.text()).toContain('ยังไม่ผ่านการตรวจสอบจาก Auditor')
    })

    it('hides the warning when already audited', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'audited',
        auditedAt: '2026-04-14T12:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).not.toContain('ยังไม่ผ่านการตรวจสอบจาก Auditor')
    })
  })

  // ─── Already approved banner ────────────────────────────────────────────────

  describe('already approved banner', () => {
    it('shows "อนุมัติแล้ว" banner when workflow is approved', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'approved',
        auditedAt: '2026-04-14T12:00:00Z',
        approvedAt: '2026-04-14T14:00:00Z',
        approvedByName: 'Owner A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('อนุมัติแล้ว')
    })

    it('shows approved_with_notes banner for that workflow status', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'approved_with_notes',
        auditedAt: '2026-04-14T12:00:00Z',
        approvedAt: '2026-04-14T14:00:00Z',
        approvedByName: 'Owner B',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('อนุมัติแล้ว')
    })

    it('shows approver name in the approved banner', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'approved',
        auditedAt: '2026-04-14T12:00:00Z',
        approvedAt: '2026-04-14T14:00:00Z',
        approvedByName: 'Owner A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.text()).toContain('Owner A')
    })
  })

  // ─── OwnerDecisionCard visibility ──────────────────────────────────────────

  describe('OwnerDecisionCard visibility', () => {
    it('renders OwnerDecisionCard when audited and not yet approved', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      // isAudited = true, isApproved = false → canSubmitApproval = true
      store.currentSummary = {
        workflowStatus: 'audited',
        auditedAt: '2026-04-14T12:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.find('.owner-decision-card').exists()).toBe(true)
    })

    it('hides OwnerDecisionCard when not yet audited', () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      // isAudited = false → canSubmitApproval = false
      expect(wrapper.find('.owner-decision-card').exists()).toBe(false)
    })

    it('hides OwnerDecisionCard when already approved', async () => {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'approved',
        auditedAt: '2026-04-14T12:00:00Z',
        approvedAt: '2026-04-14T14:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await nextTick()
      expect(wrapper.find('.owner-decision-card').exists()).toBe(false)
    })
  })

  // ─── Expandable summary sections ───────────────────────────────────────────

  describe('expandable summary sections', () => {
    async function mountAudited() {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'audited',
        step1TotalTransactions: 3,
        step1SuccessTransactions: 3,
        step1FailedTransactions: 0,
        step1TotalAmount: 1500,
        step1TotalCommission: 75,
        auditedAt: '2026-04-14T12:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.transactions = []
      await nextTick()
      return { wrapper, store }
    }

    it('renders the Step 1 summary card header', async () => {
      const { wrapper } = await mountAudited()
      expect(wrapper.text()).toContain('Step 1 — Manager บันทึกรายการ')
    })

    it('renders the Step 2 summary card header', async () => {
      const { wrapper } = await mountAudited()
      expect(wrapper.text()).toContain('Step 2 — Manager ตรวจนับเงิน')
    })

    it('renders the Auditor findings summary card header', async () => {
      const { wrapper } = await mountAudited()
      expect(wrapper.text()).toContain('ผลการตรวจสอบ Auditor')
    })

    it('shows "ไม่มีหมายเหตุ" in the Step 2 details when there is no note', async () => {
      const { wrapper } = await mountAudited()
      expect(wrapper.text()).toContain('ไม่มีหมายเหตุ')
    })

    it('shows the Step 2 note instead of the placeholder when there is one', async () => {
      const { wrapper, store } = await mountAudited()
      store.currentSummary = { ...store.currentSummary, step2VerificationNotes: 'เงินขาด 100' }
      await nextTick()
      expect(wrapper.text()).toContain('เงินขาด 100')
      expect(wrapper.text()).not.toContain('ไม่มีหมายเหตุ')
    })

    it('expands step1 section when toggle button is clicked', async () => {
      const { wrapper } = await mountAudited()
      const step1ToggleBtn = wrapper.findAll('button').find(b => b.text().includes('รายการธุรกรรมทั้งหมด'))
      expect(step1ToggleBtn).toBeTruthy()
      // Initially collapsed — expanded state is reactive
      await step1ToggleBtn.trigger('click')
      await nextTick()
      // After toggle, should show empty state or transaction table
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  // ─── Step 1 totals + owner deposits ─────────────────────────────────────────

  describe('step 1 with an owner deposit', () => {
    async function mountWithDeposit(transactions) {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'audited',
        step1TotalAmount: 3000,
        auditedAt: '2026-04-14T12:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.transactions = transactions
      await nextTick()
      const step1Items = wrapper.findAllComponents({ name: 'WorkflowStepSummaryCard' })[0].props('summaryItems')
      return { wrapper, step1Items }
    }

    const bill = { id: 'b1', date: '2026-04-14', transactionType: 'bill_payment', billType: 'utility', status: 'completed', amount: 2000, commission: 20 }
    const cancelledBill = { id: 'b2', date: '2026-04-14', transactionType: 'bill_payment', billType: 'telecom', status: 'cancelled', amount: 500, commission: 10 }
    const deposit = { id: 'd1', date: '2026-04-14', transactionType: 'owner_deposit', status: 'completed', amount: 1000, commission: 0 }

    it('lists every transaction, including the deposit', async () => {
      const { wrapper } = await mountWithDeposit([bill, cancelledBill, deposit])
      expect(wrapper.findAll('tbody tr')).toHaveLength(3)
      expect(wrapper.text()).toContain('owner_deposit')
    })

    it('splits completed bill payments and deposits, ignoring cancelled rows', async () => {
      const { step1Items } = await mountWithDeposit([bill, cancelledBill, deposit])
      expect(step1Items.find(i => i.label === 'ยอดรับชำระทั้งหมด').value).toBe('2000 ฿')
      expect(step1Items.find(i => i.label === 'ฝากเงิน').value).toBe('1000 ฿')
    })

    it('keeps the deposit card with "-" when the day has no deposit', async () => {
      const { step1Items } = await mountWithDeposit([bill])
      expect(step1Items.find(i => i.label === 'ฝากเงิน').value).toBe('-')
    })

    it('labels cancelled transactions "ยกเลิก", matching the table badge', async () => {
      const { step1Items } = await mountWithDeposit([bill, cancelledBill])
      expect(step1Items.some(i => i.label === 'ยกเลิก')).toBe(true)
      expect(step1Items.some(i => i.label === 'รายการล้มเหลว')).toBe(false)
    })

    it('lists transactions in time order regardless of stored order', async () => {
      const { wrapper } = await mountWithDeposit([
        { ...deposit, timestamp: '2026-04-14T13:00:00Z' },
        { ...bill, timestamp: '2026-04-14T09:00:00Z' },
      ])
      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].text()).toContain('utility')
      expect(rows[1].text()).toContain('owner_deposit')
    })
  })

  // ─── Decision submission ────────────────────────────────────────────────────

  describe('decision submission', () => {
    async function mountReadyToApprove() {
      const pinia = createTestingPinia({ createSpy: vi.fn })
      const wrapper = mount(OwnerApprovalSection, {
        props: DEFAULT_PROPS,
        global: { plugins: [pinia], ...globalConfig },
      })
      const store = useBillPaymentStore(pinia)
      store.currentSummary = {
        workflowStatus: 'audited',
        auditedAt: '2026-04-14T12:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.transactions = []
      await nextTick()
      return { wrapper, store }
    }

    it('calls store.submitOwnerApproval when OwnerDecisionCard emits submit', async () => {
      const { wrapper, store } = await mountReadyToApprove()
      const decisionCard = wrapper.findComponent({ name: 'OwnerDecisionCard' })
      await decisionCard.vm.$emit('submit', 'approved', '')
      expect(store.submitOwnerApproval).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({ decision: 'approved' }))
    })

    it('calls store.submitOwnerApproval with notes for approved_with_notes decision', async () => {
      const { wrapper, store } = await mountReadyToApprove()
      const decisionCard = wrapper.findComponent({ name: 'OwnerDecisionCard' })
      await decisionCard.vm.$emit('submit', 'approved_with_notes', 'ยอดตรงแต่มีหมายเหตุ')
      expect(store.submitOwnerApproval).toHaveBeenCalledWith('2026-04-14', expect.objectContaining({
        decision: 'approved_with_notes',
        approvalNotes: 'ยอดตรงแต่มีหมายเหตุ',
      }))
    })

    it('emits approval-submitted with the decision value on success', async () => {
      const { wrapper } = await mountReadyToApprove()
      const decisionCard = wrapper.findComponent({ name: 'OwnerDecisionCard' })
      await decisionCard.vm.$emit('submit', 'approved', '')
      await nextTick()
      expect(wrapper.emitted('approval-submitted')).toBeTruthy()
      expect(wrapper.emitted('approval-submitted')[0][0]).toBe('approved')
    })

    it('emits approval-submitted with needs_correction on correction submit', async () => {
      const { wrapper } = await mountReadyToApprove()
      const decisionCard = wrapper.findComponent({ name: 'OwnerDecisionCard' })
      await decisionCard.vm.$emit('submit', 'needs_correction', 'ต้องแก้')
      await nextTick()
      expect(wrapper.emitted('approval-submitted')).toBeTruthy()
      expect(wrapper.emitted('approval-submitted')[0][0]).toBe('needs_correction')
    })
  })
})
