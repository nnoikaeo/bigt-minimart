import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

/**
 * POST /api/bill-payment/summaries/[date]/complete-step1
 * WF 3.1: Manager finishes recording transactions
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const date = event.context.params?.date
    if (!date) throw createError({ statusCode: 400, message: 'Date required' })

    // Identity derived from server-verified token, not client-supplied body
    const userId = authUser.uid
    const userName = authUser.name ?? 'Manager'

    const txns = await billPaymentJsonRepository.getTransactionsByDate(date)
    if (txns.length === 0) {
      throw createError({ statusCode: 400, message: 'ต้องมีรายการอย่างน้อย 1 รายการก่อนไปขั้นตอนที่ 2' })
    }

    const successTxns = txns.filter(t => t.status === 'completed')
    const failedTxns = txns.filter(t => t.status === 'cancelled')

    let summary = await billPaymentJsonRepository.getDailySummary(date)
    if (!summary) summary = await billPaymentJsonRepository.createDailySummary(date)

    const now = new Date().toISOString()
    const updatedSummary = await billPaymentJsonRepository.updateDailySummary(date, {
      workflowStatus: 'step1_in_progress', // stays here; step2 page changes to step2_completed
      step1CompletedAt: now,
      step1CompletedBy: userId,
      step1CompletedByName: userName,
      step1TotalTransactions: txns.length,
      step1SuccessTransactions: successTxns.length,
      step1FailedTransactions: failedTxns.length,
      step1TotalAmount: successTxns.reduce((s, t) => s + t.amount, 0),
      step1TotalCommission: successTxns.reduce((s, t) => s + (t.commission ?? 0), 0),
    })

    return {
      success: true,
      data: updatedSummary,
      message: 'Step 1 complete. Ready for Step 2.',
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to complete Step 1: ${error.message}` })
  }
})
