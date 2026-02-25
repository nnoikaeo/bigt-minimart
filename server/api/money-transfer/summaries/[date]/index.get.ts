import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * GET /api/money-transfer/summaries/[date]
 *
 * Fetch the daily summary for a given date.
 * Returns null data (not an error) when no summary exists yet for the date,
 * allowing callers to distinguish "not started" from server errors.
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary | null }
 */
export default defineEventHandler(async (event) => {
  try {
    await moneyTransferJsonRepository.init()

    const date = event.context.params?.date

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw createError({
        statusCode: 400,
        message: 'Date is required in format YYYY-MM-DD',
      })
    }

    console.log(`[GET /api/money-transfer/summaries/[date]] Fetching summary for ${date}`)

    const summary = await moneyTransferJsonRepository.getDailySummary(date)

    console.log(
      `[GET /api/money-transfer/summaries/[date]] Result for ${date}:`,
      summary ? `found (status: ${summary.workflowStatus})` : 'not found'
    )

    return {
      success: true,
      data: summary,
    }
  } catch (error: any) {
    console.error('[GET /api/money-transfer/summaries/[date]] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch daily summary',
    })
  }
})
