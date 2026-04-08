import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * POST /api/bill-payment/summaries/[date]/init
 * Idempotent: creates summary if not exists
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const date = event.context.params?.date
    if (!date) throw createError({ statusCode: 400, message: 'Date required' })

    const existing = await billPaymentJsonRepository.getDailySummary(date)
    if (existing) {
      return { success: true, data: existing, created: false }
    }

    const summary = await billPaymentJsonRepository.createDailySummary(date)
    setResponseStatus(event, 201)
    return { success: true, data: summary, created: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to init summary: ${error.message}` })
  }
})
