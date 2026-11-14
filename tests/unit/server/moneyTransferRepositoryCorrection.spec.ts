/* eslint-disable */
// @ts-nocheck
/**
 * BUG-035: MT send-back goes to Manager (same as BP) — keep Step 1, clear Step 2 + audit + owner decision
 */
import { setActivePinia, createPinia } from 'pinia'
import { moneyTransferJsonRepository as repo } from '~/server/repositories/money-transfer-json.repository'

const DATE = '2026-03-09'

function auditedSummary(workflowStatus = 'audited') {
  return {
    id: `mtsum-${DATE}`,
    date: DATE,
    workflowStatus,
    step1: { status: 'completed', totalTransactions: 5, completedTransactions: 5, draftTransactions: 0, totalAmount: 1000, totalCommission: 50 },
    step2: { status: 'completed', expectedCash: { transferWithdrawal: 1000, serviceFee: 50, total: 1050 }, actualCash: { transferWithdrawal: 1000, serviceFee: 50, total: 1050 }, differences: { transferWithdrawal: 0, serviceFee: 0, total: 0 }, hasDiscrepancies: false },
    auditorVerification: { status: 'completed', transactionsVerified: 5, transactionsWithIssues: 0, bankStatementVerified: true, bankBalanceMatches: true, auditNotes: '', auditResult: 'no_issues' },
    createdAt: '2026-03-09T08:00:00Z',
    updatedAt: '2026-03-09T12:00:00Z',
  }
}

describe('moneyTransferJsonRepository.requestCorrection', () => {
  beforeEach(() => {
    vi.spyOn(repo, 'save').mockResolvedValue(undefined)
  })

  it('Owner send-back: keeps Step 1, clears Step 2 + audit + decision, stores reason', async () => {
    repo.summaries = [auditedSummary('audited_with_issues')]
    const result = await repo.requestCorrection(DATE, { notes: 'นับเงินใหม่', requestedBy: 'owner' })

    expect(result.workflowStatus).toBe('needs_correction')
    expect(result.needsCorrectionFrom).toBe('audited_with_issues')
    expect(result.correctionNotes).toBe('นับเงินใหม่')
    expect(result.correctionRequestedBy).toBe('owner')
    expect(result.step1.status).toBe('completed')
    expect(result.step2).toBeUndefined()
    expect(result.auditorVerification).toBeUndefined()
    expect(result.ownerApproval).toBeUndefined()
  })

  it('Auditor send-back: records the Step 2 status it came from', async () => {
    const s = auditedSummary('step2_completed_with_notes')
    delete s.auditorVerification
    repo.summaries = [s]
    const result = await repo.requestCorrection(DATE, { notes: 'เงินขาด 100', requestedBy: 'auditor-uid' })

    expect(result.needsCorrectionFrom).toBe('step2_completed_with_notes')
    expect(result.step2).toBeUndefined()
    expect(result.correctionNotes).toBe('เงินขาด 100')
  })

  it('throws when the summary does not exist', async () => {
    repo.summaries = []
    await expect(repo.requestCorrection(DATE, { notes: 'x', requestedBy: 'owner' })).rejects.toThrow()
  })
})

describe('money-transfer store getCorrectionSource', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  async function storeWith(needsCorrectionFrom?: string) {
    vi.stubGlobal('useAuthStore', () => ({ user: { uid: 'u', displayName: 'U' } }))
    const { useMoneyTransferStore } = await import('~/stores/money-transfer')
    const store = useMoneyTransferStore()
    store.currentSummary = { date: DATE, workflowStatus: 'needs_correction', needsCorrectionFrom }
    return store
  }

  it('is Owner when the day was audited', async () => {
    expect((await storeWith('audited')).getCorrectionSource).toBe('Owner')
    expect((await storeWith('audited_with_issues')).getCorrectionSource).toBe('Owner')
  })

  it('is Auditor when the day was at Step 2', async () => {
    expect((await storeWith('step2_completed')).getCorrectionSource).toBe('Auditor')
    expect((await storeWith('step2_completed_with_notes')).getCorrectionSource).toBe('Auditor')
  })
})
