import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * GET /api/money-transfer/balances/[date]
 *
 * Get balance for a specific date (YYYY-MM-DD).
 * Used by the service page when viewing a past date so that
 * isOpeningSet reflects the correct date's balance.
 *
 * Response: { success: boolean, data: MoneyTransferBalance }
 */
export default defineEventHandler(async (event) => {
  try {
    await moneyTransferJsonRepository.init()

    const date = event.context.params?.date
    if (!date) {
      throw createError({ statusCode: 400, message: 'Date is required in format YYYY-MM-DD' })
    }

    const balance = await moneyTransferJsonRepository.getCurrentBalance(date)

    return { success: true, data: balance }
  } catch (error: any) {
    console.error('[GET /api/money-transfer/balances/[date]] Error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to fetch balance: ${error.message}` })
  }
})
