/* eslint-disable */
// @ts-nocheck
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useMoneyTransferStore } from '~/stores/money-transfer'
import OwnerApprovalSection from '~/components/money-transfer/OwnerApprovalSection.vue'

// ── Stub Nuxt auto-imports ────────────────────────────────────────────────────
vi.stubGlobal('useMoneyTransferHelpers', () => ({
  formatCurrency: (v) => `${v} ฿`,
  formatDatetime: (v) => v ?? '-',
  formatTime: (v) => v ?? '-',
  getStatusBadgeVariant: () => 'default',
  getStatusLabel: (v) => v ?? '-',
  getTransactionTypeLabel: (v) => v ?? '-',
}))
vi.mock('~/composables/useLogger', () => ({
  useLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}))

const DATE = '2026-03-09'

async function mountAudited(auditorVerification) {
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const store = useMoneyTransferStore(pinia)
  store.transactions = []
  store.currentSummary = {
    date: DATE,
    workflowStatus: 'audited',
    auditorVerification: {
      auditResult: 'no_issues',
      completedByName: 'Auditor A',
      transactionsVerified: 3,
      transactionsWithIssues: 0,
      ...auditorVerification,
    },
  }
  const wrapper = shallowMount(OwnerApprovalSection, {
    props: { date: DATE },
    global: {
      plugins: [pinia],
      stubs: {
        WorkflowStepSummaryCard: {
          name: 'WorkflowStepSummaryCard',
          template: '<div class="workflow-step-summary-card"><slot /></div>',
          props: ['stepNumber', 'title', 'summaryItems', 'badge'],
        },
      },
    },
  })
  await nextTick()
  return wrapper
}

function bankStatementItem(wrapper) {
  const cards = wrapper.findAllComponents({ name: 'WorkflowStepSummaryCard' })
  return cards.flatMap(c => c.props('summaryItems') ?? []).find(i => i.label === 'ยอดรายการเดินบัญชี')
}

describe('money-transfer OwnerApprovalSection', () => {
  describe('bank statement amount in the Auditor summary (BUG-051)', () => {
    it('shows "ไม่ได้กรอก" when the Auditor left it empty', async () => {
      const wrapper = await mountAudited({})
      expect(bankStatementItem(wrapper).value).toBe('ไม่ได้กรอก')
    })

    it('shows the amount when it was filled in', async () => {
      const wrapper = await mountAudited({ bankStatementAmount: 8934 })
      expect(bankStatementItem(wrapper).value).toBe('8934 ฿')
    })

    it('still shows a real 0 as an amount', async () => {
      const wrapper = await mountAudited({ bankStatementAmount: 0 })
      expect(bankStatementItem(wrapper).value).toBe('0 ฿')
    })
  })
})
