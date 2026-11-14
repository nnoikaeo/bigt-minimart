import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'
import { todayISO } from '~/utils/date'
/**
 * GET /api/money-transfer/balances/current
 *
 * Get current balance for today
 * Automatically initializes if doesn't exist
 *
 * Response: { success: boolean, data: MoneyTransferBalance }
 */

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await moneyTransferJsonRepository.init()

    // Get today's date
    const today = todayISO()
    if (!today) {
      throw createError({
        statusCode: 500,
        message: 'Failed to get current date',
      })
    }

    console.log('[GET /api/money-transfer/balances/current] Fetching balance for', today)

    // Get or initialize balance
    let balance = await moneyTransferJsonRepository.getCurrentBalance(today)

    console.log('[GET /api/money-transfer/balances/current] Balance:', balance)

    return {
      success: true,
      data: balance,
    }
  } catch (error: any) {
    console.error('[GET /api/money-transfer/balances/current] Error:', error)

    throw createError({
      statusCode: 500,
      message: `Failed to fetch balance: ${error.message}`,
    })
  }
})
