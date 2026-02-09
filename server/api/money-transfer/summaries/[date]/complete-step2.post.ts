import { z } from 'zod'
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/summaries/[date]/complete-step2
 *
 * Complete Step 2: Manager verifies actual cash against expected amounts
 * - Receives actual counted cash amounts
 * - Compares with system-calculated expected amounts
 * - Records discrepancies for auditor review
 * - Updates step2 status to completed
 * - Prepares for Workflow 2.2 (Auditor verification)
 *
 * Request body:
 * {
 *   actualCash: {
 *     transferWithdrawal: number,
 *     serviceFee: number
 *   },
 *   verificationNotes?: string
 * }
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary }
 */

const step2Schema = z.object({
  actualCash: z.object({
    transferWithdrawal: z.number().nonnegative('Transfer/Withdrawal cash cannot be negative'),
    serviceFee: z.number().nonnegative('Service fee cash cannot be negative'),
  }),
  verificationNotes: z.string().optional(),
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

    console.log('[POST /api/money-transfer/summaries/[date]/complete-step2] Date:', date)

    // Parse and validate request body
    const body = await readBody(event)
    const validated = step2Schema.parse(body)

    console.log('[POST /api/money-transfer/summaries/[date]/complete-step2] Validated data:', validated)

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
        message: 'Step 1 must be completed before completing Step 2',
      })
    }

    // Get all completed transactions for this date
    const transactions = await moneyTransferJsonRepository.getTransactionsByDate(date)
    const completed = transactions.filter(t => t.status === 'completed')

    // Calculate expected cash amounts from completed transactions
    const expectedCash = {
      transferWithdrawal: completed
        .filter(t => t.transactionType !== 'owner_deposit')
        .reduce((sum, t) => sum + t.amount, 0),
      serviceFee: completed
        .filter(t => t.commission && t.commissionType === 'cash')
        .reduce((sum, t) => sum + (t.commission || 0), 0),
      total: 0,
    }
    expectedCash.total = expectedCash.transferWithdrawal + expectedCash.serviceFee

    // Calculate differences
    const differences = {
      transferWithdrawal: validated.actualCash.transferWithdrawal - expectedCash.transferWithdrawal,
      serviceFee: validated.actualCash.serviceFee - expectedCash.serviceFee,
      total: 0,
    }
    differences.total = differences.transferWithdrawal + differences.serviceFee

    console.log('[POST /api/money-transfer/summaries/[date]/complete-step2] Expected cash:', expectedCash)
    console.log('[POST /api/money-transfer/summaries/[date]/complete-step2] Actual cash:', validated.actualCash)
    console.log('[POST /api/money-transfer/summaries/[date]/complete-step2] Differences:', differences)

    // Update summary with Step 2 data
    const updatedSummary = await moneyTransferJsonRepository.updateDailySummary(date, {
      step2: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: 'manager', // TODO: Get from auth context
        completedByName: 'Manager', // TODO: Get from auth context
        expectedCash,
        actualCash: validated.actualCash,
        differences,
        verificationNotes: validated.verificationNotes,
        hasDiscrepancies: differences.total !== 0,
      },
      workflowStatus: 'step2_completed',
    })

    console.log(
      `[POST /api/money-transfer/summaries/[date]/complete-step2] Completed Step 2 for ${date}`
    )

    setResponseStatus(event, 200)
    return {
      success: true,
      data: updatedSummary,
      message: 'Step 2 completed successfully. Ready for auditor verification.',
      verification: {
        expectedCash,
        actualCash: validated.actualCash,
        differences,
        hasDiscrepancies: differences.total !== 0,
        discrepancyStatus:
          differences.total === 0
            ? '✅ No discrepancies found'
            : `⚠️ Discrepancy of ${differences.total} บาท`,
      },
    }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/summaries/[date]/complete-step2] Error:', error)

    if (error instanceof z.ZodError) {
      console.error('[POST /api/money-transfer/summaries/[date]/complete-step2] Validation error:', error.issues)
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
      '[POST /api/money-transfer/summaries/[date]/complete-step2] Unexpected error:',
      error.message
    )
    throw createError({
      statusCode: 500,
      message: `Failed to complete Step 2: ${error.message}`,
    })
  }
})
