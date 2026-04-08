import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * GET /api/bill-payment/balances/previous?date=YYYY-MM-DD
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const query = getQuery(event)
    const date = query.date as string
    if (!date) throw createError({ statusCode: 400, message: 'date query param required' })

    const balance = await billPaymentJsonRepository.getPreviousDayBalance(date)

    return { success: true, data: balance }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to fetch previous balance: ${error.message}` })
  }
})
