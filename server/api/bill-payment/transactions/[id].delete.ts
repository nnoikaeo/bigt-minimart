import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * DELETE /api/bill-payment/transactions/[id]
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, message: 'Transaction ID required' })

    await billPaymentJsonRepository.deleteTransaction(id)

    return { success: true, message: `Transaction ${id} deleted` }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to delete transaction: ${error.message}` })
  }
})
