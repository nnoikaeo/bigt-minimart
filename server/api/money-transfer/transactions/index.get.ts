import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * GET /api/money-transfer/transactions
 *
 * Fetch transactions with optional filters
 * Query parameters:
 *   - date: ISO date string (YYYY-MM-DD) - single day
 *   - dateFrom: ISO date string (YYYY-MM-DD) - start of range
 *   - dateTo: ISO date string (YYYY-MM-DD) - end of range
 *   - status: draft | completed | failed | cancelled
 *   - type: transfer | withdrawal | owner_deposit
 *
 * Response: { success: boolean, data: MoneyTransferTransaction[], count: number }
 */

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await moneyTransferJsonRepository.init()

    // Get query parameters
    const query = getQuery(event)
    const date = query.date as string | undefined
    const dateFrom = query.dateFrom as string | undefined
    const dateTo = query.dateTo as string | undefined
    const status = query.status as string | undefined
    const type = query.type as string | undefined

    console.log('[GET /api/money-transfer/transactions] Query:', {
      date,
      dateFrom,
      dateTo,
      status,
      type,
    })

    let transactions: any[] = []

    // Fetch based on date parameters
    if (date) {
      // Single day
      transactions = await moneyTransferJsonRepository.getTransactionsByDate(date)
      console.log(`[GET /api/money-transfer/transactions] Found ${transactions.length} for ${date}`)
    } else if (dateFrom && dateTo) {
      // Date range
      transactions = await moneyTransferJsonRepository.getTransactionsByDateRange(dateFrom, dateTo)
      console.log(
        `[GET /api/money-transfer/transactions] Found ${transactions.length} in range ${dateFrom} to ${dateTo}`
      )
    } else {
      // No date specified, return empty
      transactions = []
    }

    // Apply filters
    if (status) {
      const validStatuses = ['draft', 'completed', 'on_hold', 'cancelled']
      if (validStatuses.includes(status)) {
        transactions = transactions.filter(t => t.status === status)
        console.log(`[GET /api/money-transfer/transactions] Filtered by status ${status}: ${transactions.length}`)
      }
    }

    if (type) {
      const validTypes = ['transfer', 'withdrawal', 'owner_deposit']
      if (validTypes.includes(type)) {
        transactions = transactions.filter(t => t.transactionType === type)
        console.log(`[GET /api/money-transfer/transactions] Filtered by type ${type}: ${transactions.length}`)
      }
    }

    return {
      success: true,
      data: transactions,
      count: transactions.length,
    }
  } catch (error: any) {
    console.error('[GET /api/money-transfer/transactions] Error:', error)

    throw createError({
      statusCode: 500,
      message: `Failed to fetch transactions: ${error.message}`,
    })
  }
})
