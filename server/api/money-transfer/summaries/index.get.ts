import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * GET /api/money-transfer/summaries
 *
 * Fetch all daily summaries sorted by date descending.
 * Used by the History Page (WF 2.0) to show the list of all days.
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary[] }
 */
export default defineEventHandler(async () => {
  try {
    await moneyTransferJsonRepository.init()

    const summaries = await moneyTransferJsonRepository.getAllSummaries()

    return {
      success: true,
      data: summaries,
    }
  } catch (error: any) {
    console.error('[GET /api/money-transfer/summaries] Error:', error)

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch summaries',
    })
  }
})
