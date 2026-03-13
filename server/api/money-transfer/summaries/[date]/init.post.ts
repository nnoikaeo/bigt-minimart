import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/summaries/[date]/init
 *
 * Initialize a daily summary for the given date if it doesn't exist yet.
 * Called when a manager first opens the service page for a new date.
 * Idempotent — safe to call multiple times; returns existing summary if already created.
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary, created: boolean }
 */
export default defineEventHandler(async (event) => {
  try {
    await moneyTransferJsonRepository.init()

    const date = event.context.params?.date
    if (!date) {
      throw createError({ statusCode: 400, message: 'Date is required in format YYYY-MM-DD' })
    }

    const existing = await moneyTransferJsonRepository.getDailySummary(date)
    if (existing) {
      return { success: true, data: existing, created: false }
    }

    const summary = await moneyTransferJsonRepository.createDailySummary(date)
    console.log(`[POST /api/money-transfer/summaries/${date}/init] Created new summary`)

    setResponseStatus(event, 201)
    return { success: true, data: summary, created: true }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/summaries/[date]/init] Error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to init summary: ${error.message}` })
  }
})
