import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { todayISO } from '~/utils/date'

/**
 * GET /api/bill-payment/balances/current
 * Returns balance for today
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const today = todayISO()
    const balance = await billPaymentJsonRepository.getCurrentBalance(today)

    return { success: true, data: balance }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: `Failed to fetch current balance: ${error.message}` })
  }
})
