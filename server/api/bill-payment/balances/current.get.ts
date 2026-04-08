import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * GET /api/bill-payment/balances/current
 * Returns balance for today
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const today = new Date().toISOString().split('T')[0]!
    const balance = await billPaymentJsonRepository.getCurrentBalance(today)

    return { success: true, data: balance }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: `Failed to fetch current balance: ${error.message}` })
  }
})
