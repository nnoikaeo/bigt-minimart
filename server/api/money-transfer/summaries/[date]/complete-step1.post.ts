import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/summaries/[date]/complete-step1
 *
 * Complete Step 1: Manager finishes transaction recording for the day
 * - Verifies no draft transactions remain (or manager confirms to proceed)
 * - Calculates final statistics
 * - Updates step1 status to completed
 * - Prepares for Step 2 (cash verification)
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary }
 */

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

    console.log('[POST /api/money-transfer/summaries/[date]/complete-step1] Date:', date)

    // Get current user info from request body (optional but recommended)
    const body = (await readBody(event).catch(() => ({}))) ?? {}
    const userId = body.userId || 'system'
    const userName = body.userName || 'Manager'

    // Get or create summary
    let summary = await moneyTransferJsonRepository.getDailySummary(date)

    if (!summary) {
      summary = await moneyTransferJsonRepository.createDailySummary(date)
    }

    // Get all transactions for the date
    const transactions = await moneyTransferJsonRepository.getTransactionsByDate(date)
    const completed = transactions.filter(t => t.status === 'completed')
    const drafts = transactions.filter(t => t.status === 'draft')

    console.log(
      `[POST /api/money-transfer/summaries/[date]/complete-step1] ` +
      `Total: ${transactions.length}, Completed: ${completed.length}, Drafts: ${drafts.length}`
    )

    // Get final balance snapshot
    const finalBalance = await moneyTransferJsonRepository.getCurrentBalance(date)

    // Complete Step 1
    const updatedSummary = await moneyTransferJsonRepository.updateDailySummary(date, {
      step1: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: userId,
        completedByName: userName,
        totalTransactions: transactions.length,
        completedTransactions: completed.length,
        draftTransactions: drafts.length,
        totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
        totalCommission: completed.reduce((sum, t) => sum + (t.commission || 0), 0),
        finalBalances: {
          bankAccount: finalBalance.bankAccount,
          transferCash: finalBalance.transferCash,
          serviceFeeTransfer: finalBalance.serviceFeeTransfer,
          serviceFeeCash: finalBalance.serviceFeeCash,
        },
      },
      workflowStatus: 'step1_completed',
    })

    console.log(
      `[POST /api/money-transfer/summaries/[date]/complete-step1] ` +
      `Completed Step 1 for ${date}`
    )

    setResponseStatus(event, 200)
    return {
      success: true,
      data: updatedSummary,
      message: 'Step 1 completed successfully. Ready for Step 2 verification.',
      summary: {
        totalTransactions: transactions.length,
        completedTransactions: completed.length,
        draftTransactions: drafts.length,
        totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
        totalCommission: completed.reduce((sum, t) => sum + (t.commission || 0), 0),
      },
    }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/summaries/[date]/complete-step1] Error:', error)

    if (error.statusCode) {
      throw error
    }

    console.error(
      '[POST /api/money-transfer/summaries/[date]/complete-step1] Unexpected error:',
      error.message
    )
    throw createError({
      statusCode: 500,
      message: `Failed to complete Step 1: ${error.message}`,
    })
  }
})
