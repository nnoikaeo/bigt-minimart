import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

/**
 * PUT /api/bill-payment/transactions/[id]
 *
 * Update transaction fields. A draft stays draft — it leaves the queue only via
 * POST /:id/complete or PUT /:id/status (cancel).
 */
export default defineEventHandler(async (event) => {
  try {
    await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, message: 'Transaction ID required' })

    const updates = await readBody(event)
    const existing = await billPaymentJsonRepository.getTransaction(id)
    if (existing.status === 'draft') updates.status = 'draft'

    const updated = await billPaymentJsonRepository.updateTransaction(id, updates)

    return { success: true, data: updated }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to update transaction: ${error.message}` })
  }
})
