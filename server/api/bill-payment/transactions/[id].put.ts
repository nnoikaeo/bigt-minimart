import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'

/**
 * PUT /api/bill-payment/transactions/[id]
 */
export default defineEventHandler(async (event) => {
  try {
    await billPaymentJsonRepository.init()

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, message: 'Transaction ID required' })

    const updates = await readBody(event)
    const updated = await billPaymentJsonRepository.updateTransaction(id, updates)

    return { success: true, data: updated }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to update transaction: ${error.message}` })
  }
})
