import { z } from 'zod'
import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

const schema = z.object({
  outcome: z.enum(['audited', 'audited_with_issues', 'needs_correction']),
  auditBankStatementAmount: z.number().nonnegative().optional(),
  auditBankBalanceMatches: z.boolean().optional(),
  /** Auditor's cash count for bill payment receipts */
  auditorActualBillPaymentCash: z.number().nonnegative().optional(),
  /** Auditor's cash count for service fees */
  auditorActualServiceFeeCash: z.number().nonnegative().optional(),
  /** Expected closing balance used for bank statement comparison */
  auditExpectedClosingBalance: z.number().optional(),
  /** Diff: bankStatementAmount − expectedClosingBalance */
  auditBankStatementVsClosingDiff: z.number().optional(),
  /** Whether bank statement matches expected closing balance */
  auditBankStatementVsClosingMatches: z.boolean().optional(),
  /** Per-transaction issue flags: { [txnId]: true } */
  auditTxnIssueStatus: z.record(z.literal(true)).optional(),
  auditFindings: z.string().optional(),
  auditTransactionsVerified: z.number().nonnegative().default(0),
  auditTransactionsWithIssues: z.number().nonnegative().default(0),
  correctionNotes: z.string().optional(),
})

/**
 * POST /api/bill-payment/summaries/[date]/audit
 * WF 3.2: Auditor verification
 *
 * outcome = 'needs_correction' implements Approach C:
 *   - clears Step 2 so Manager must re-verify
 *   - preserves Step 1 transaction records
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const date = event.context.params?.date
    if (!date) throw createError({ statusCode: 400, message: 'Date required' })

    const body = await readBody(event)
    const validated = schema.parse(body)

    const summary = await billPaymentJsonRepository.getDailySummary(date)
    if (!summary) throw createError({ statusCode: 404, message: `No summary for ${date}` })
    if (!summary.step2CompletedAt) {
      throw createError({ statusCode: 400, message: 'Step 2 must be completed before audit' })
    }

    const updatedSummary = await billPaymentJsonRepository.submitAudit(date, {
      ...validated,
      auditedBy: authUser.uid,
      auditedByName: authUser.name ?? 'Auditor',
    })

    return { success: true, data: updatedSummary, message: 'Audit submitted.' }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: error.issues })
    }
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to submit audit: ${error.message}` })
  }
})
