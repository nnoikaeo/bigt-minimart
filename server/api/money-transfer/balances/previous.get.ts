import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * GET /api/money-transfer/balances/previous?date=YYYY-MM-DD
 *
 * Get the balance record for the day before the given date.
 * Used to pre-fill Carry-over opening balance.
 *
 * Response: { success: boolean, data: MoneyTransferBalance | null }
 */
export default defineEventHandler(async (event) => {
  try {
    await moneyTransferJsonRepository.init()

    const query = getQuery(event)
    const date = (query.date as string) || new Date().toISOString().split('T')[0]

    console.log(`[GET /api/money-transfer/balances/previous] Fetching previous day balance for ${date}`)

    const balance = await moneyTransferJsonRepository.getPreviousDayBalance(date)

    console.log(`[GET /api/money-transfer/balances/previous] Result:`, balance ? balance.date : 'not found')

    return { success: true, data: balance }
  } catch (error: any) {
    console.error('[GET /api/money-transfer/balances/previous] Error:', error)
    throw createError({ statusCode: 500, message: error.message })
  }
})
