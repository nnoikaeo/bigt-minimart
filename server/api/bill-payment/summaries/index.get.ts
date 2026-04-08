import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * GET /api/bill-payment/summaries
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()
    const summaries = await billPaymentJsonRepository.getAllSummaries()
    return { success: true, data: summaries, count: summaries.length }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: `Failed to fetch summaries: ${error.message}` })
  }
})
