import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * GET /api/bill-payment/transactions
 * Query: date | dateFrom + dateTo
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const query = getQuery(event)
    const date = query.date as string | undefined
    const dateFrom = query.dateFrom as string | undefined
    const dateTo = query.dateTo as string | undefined

    let transactions: any[] = []

    if (date) {
      transactions = await billPaymentJsonRepository.getTransactionsByDate(date)
    } else if (dateFrom && dateTo) {
      transactions = await billPaymentJsonRepository.getTransactionsByDateRange(dateFrom, dateTo)
    }

    return { success: true, data: transactions, count: transactions.length }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: `Failed to fetch transactions: ${error.message}` })
  }
})
