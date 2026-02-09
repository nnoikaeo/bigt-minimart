import { z } from 'zod'
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/summaries/[date]/audit
 *
 * Workflow 2.2: Auditor verification and audit
 * - Auditor reviews all completed transactions
 * - Verifies transactions against bank statement
 * - Identifies any issues or discrepancies
 * - Records audit findings and result
 * - Updates auditorVerification status
 * - Prepares for Workflow 2.3 (Owner approval)
 *
 * Request body:
 * {
 *   transactionsVerified: number,
 *   transactionsWithIssues: number,
 *   bankStatementVerified: boolean,
 *   auditResult: 'no_issues' | 'minor_issues' | 'major_issues',
 *   auditNotes: string,
 *   issuesFound?: string
 * }
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary }
 */

const auditSchema = z.object({
  transactionsVerified: z.number().nonnegative('Transaction count cannot be negative'),
  transactionsWithIssues: z.number().nonnegative('Issues count cannot be negative'),
  bankStatementVerified: z.boolean(),
  auditResult: z.enum(['no_issues', 'minor_issues', 'major_issues']),
  auditNotes: z.string().min(1, 'Audit notes are required'),
  issuesFound: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await moneyTransferJsonRepository.init()

    // Get date from route params
    const date = event.context.params?.date

    if (!date) {
      throw createError({
        statusCode: 400,
        message: 'Date is required in format YYYY-MM-DD',
      })
    }

    console.log('[POST /api/money-transfer/summaries/[date]/audit] Date:', date)

    // Parse and validate request body
    const body = await readBody(event)
    const validated = auditSchema.parse(body)

    console.log('[POST /api/money-transfer/summaries/[date]/audit] Validated data:', validated)

    // Get summary
    const summary = await moneyTransferJsonRepository.getDailySummary(date)

    if (!summary) {
      throw createError({
        statusCode: 404,
        message: `No summary found for ${date}. Please complete Step 1 first.`,
      })
    }

    if (summary.step1?.status !== 'completed') {
      throw createError({
        statusCode: 400,
        message: 'Step 1 must be completed before conducting audit',
      })
    }

    if (summary.step2?.status !== 'completed') {
      throw createError({
        statusCode: 400,
        message: 'Step 2 must be completed before conducting audit',
      })
    }

    // Get all completed transactions for audit reference
    const transactions = await moneyTransferJsonRepository.getTransactionsByDate(date)
    const completed = transactions.filter(t => t.status === 'completed')

    console.log(
      `[POST /api/money-transfer/summaries/[date]/audit] Auditing ${completed.length} transactions`
    )

    // Update summary with auditor verification data
    const updatedSummary = await moneyTransferJsonRepository.updateDailySummary(date, {
      auditorVerification: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: 'auditor', // TODO: Get from auth context
        completedByName: 'Auditor', // TODO: Get from auth context
        transactionsVerified: validated.transactionsVerified,
        transactionsWithIssues: validated.transactionsWithIssues,
        bankStatementVerified: validated.bankStatementVerified,
        auditNotes: validated.auditNotes,
        issuesFound: validated.issuesFound,
        auditResult: validated.auditResult,
      },
      workflowStatus: 'audited',
    })

    console.log(`[POST /api/money-transfer/summaries/[date]/audit] Completed audit for ${date}`)

    setResponseStatus(event, 200)
    return {
      success: true,
      data: updatedSummary,
      message: 'Audit completed successfully. Ready for owner approval.',
      auditSummary: {
        transactionsVerified: validated.transactionsVerified,
        transactionsWithIssues: validated.transactionsWithIssues,
        bankStatementVerified: validated.bankStatementVerified,
        auditResult: validated.auditResult,
        auditResultLabel:
          validated.auditResult === 'no_issues'
            ? '✅ No issues found'
            : validated.auditResult === 'minor_issues'
              ? '⚠️ Minor issues found'
              : '❌ Major issues found',
      },
    }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/summaries/[date]/audit] Error:', error)

    if (error instanceof z.ZodError) {
      console.error('[POST /api/money-transfer/summaries/[date]/audit] Validation error:', error.issues)
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error(
      '[POST /api/money-transfer/summaries/[date]/audit] Unexpected error:',
      error.message
    )
    throw createError({
      statusCode: 500,
      message: `Failed to complete audit: ${error.message}`,
    })
  }
})
