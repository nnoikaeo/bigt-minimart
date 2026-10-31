/* eslint-disable */
// @ts-nocheck
import { billPaymentJsonRepository as repo } from '~/server/repositories/bill-payment-json.repository'

const DATE = '2026-04-14'

describe('billPaymentJsonRepository.submitAudit status', () => {
  beforeEach(() => {
    repo.summaries = [{
      id: `bpsum-${DATE}`,
      date: DATE,
      workflowStatus: 'step2_completed',
      step2CompletedAt: '2026-04-14T11:00:00Z',
      createdAt: '2026-04-14T08:00:00Z',
      updatedAt: '2026-04-14T11:00:00Z',
    }]
    vi.spyOn(repo, 'save').mockResolvedValue(undefined)
  })

  it('keeps audited for a clean confirm', async () => {
    const result = await repo.submitAudit(DATE, { outcome: 'audited', auditTransactionsWithIssues: 0 })
    expect(result.workflowStatus).toBe('audited')
  })

  it('uses audited_with_issues when that outcome is chosen, even with no flagged transaction', async () => {
    const result = await repo.submitAudit(DATE, { outcome: 'audited_with_issues', auditTransactionsWithIssues: 0 })
    expect(result.workflowStatus).toBe('audited_with_issues')
  })

  it('uses audited_with_issues when a transaction is flagged', async () => {
    const result = await repo.submitAudit(DATE, { outcome: 'audited', auditTransactionsWithIssues: 1 })
    expect(result.workflowStatus).toBe('audited_with_issues')
  })

  it('clears Step 2 on needs_correction', async () => {
    const result = await repo.submitAudit(DATE, { outcome: 'needs_correction', correctionNotes: 'นับใหม่', auditTransactionsWithIssues: 0 })
    expect(result.workflowStatus).toBe('needs_correction')
    expect(result.step2CompletedAt).toBeUndefined()
    expect(result.correctionNotes).toBe('นับใหม่')
  })
})
