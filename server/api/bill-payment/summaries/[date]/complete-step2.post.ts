import { z } from 'zod'
import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

const schema = z.object({
  step2ActualBillPaymentCash: z.number().nonnegative(),
  step2ActualServiceFeeCash: z.number().nonnegative(),
  step2VerificationNotes: z.string().optional(),
  step2CompletedBy: z.string().optional(),
  step2CompletedByName: z.string().optional(),
})

/**
 * POST /api/bill-payment/summaries/[date]/complete-step2
 * WF 3.1: Manager verifies cash count
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const date = event.context.params?.date
    if (!date) throw createError({ statusCode: 400, message: 'Date required' })

    const body = await readBody(event)
    const validated = schema.parse(body)

    const summary = await billPaymentJsonRepository.getDailySummary(date)
    if (!summary) throw createError({ statusCode: 404, message: `No summary for ${date}` })
    if (!summary.step1CompletedAt) {
      throw createError({ statusCode: 400, message: 'Step 1 must be completed first' })
    }

    // Calculate expected from transactions
    const txns = await billPaymentJsonRepository.getTransactionsByDate(date)
    const successTxns = txns.filter(t => t.status === 'success')
    const expectedBillPaymentCash = successTxns
      .filter(t => t.transactionType === 'bill_payment')
      .reduce((s, t) => s + t.amount, 0)
    const expectedServiceFeeCash = successTxns.reduce((s, t) => s + (t.commission ?? 0), 0)

    const hasDiscrepancies =
      validated.step2ActualBillPaymentCash !== expectedBillPaymentCash ||
      validated.step2ActualServiceFeeCash !== expectedServiceFeeCash

    const now = new Date().toISOString()
    const updatedSummary = await billPaymentJsonRepository.updateDailySummary(date, {
      workflowStatus: hasDiscrepancies ? 'step2_completed_with_notes' : 'step2_completed',
      step2CompletedAt: now,
      step2CompletedBy: validated.step2CompletedBy || 'manager',
      step2CompletedByName: validated.step2CompletedByName || 'Manager',
      step2ExpectedBillPaymentCash: expectedBillPaymentCash,
      step2ActualBillPaymentCash: validated.step2ActualBillPaymentCash,
      step2ExpectedServiceFeeCash: expectedServiceFeeCash,
      step2ActualServiceFeeCash: validated.step2ActualServiceFeeCash,
      step2HasDiscrepancies: hasDiscrepancies,
      step2VerificationNotes: validated.step2VerificationNotes,
    })

    return {
      success: true,
      data: updatedSummary,
      message: 'Step 2 complete. Ready for auditor review.',
      verification: {
        expectedBillPaymentCash,
        actualBillPaymentCash: validated.step2ActualBillPaymentCash,
        expectedServiceFeeCash,
        actualServiceFeeCash: validated.step2ActualServiceFeeCash,
        hasDiscrepancies,
      },
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: 'Invalid input', data: error.issues })
    }
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to complete Step 2: ${error.message}` })
  }
})
