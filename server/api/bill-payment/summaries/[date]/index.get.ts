import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * GET /api/bill-payment/summaries/[date]
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const date = event.context.params?.date
    if (!date) throw createError({ statusCode: 400, message: 'Date required' })

    const summary = await billPaymentJsonRepository.getDailySummary(date)
    if (!summary) throw createError({ statusCode: 404, message: `No summary found for ${date}` })

    return { success: true, data: summary }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to fetch summary: ${error.message}` })
  }
})
