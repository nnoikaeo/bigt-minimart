import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

/**
 * POST /api/bill-payment/transactions/[id]/complete
 * Transition a draft transaction to completed status.
 */
export default defineEventHandler(async (event) => {
  try {
    await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, message: 'Transaction ID required' })

    const txn = await billPaymentJsonRepository.getTransaction(id)
    if (txn.status !== 'draft') {
      throw createError({ statusCode: 400, message: `Cannot complete transaction with status '${txn.status}' — only 'draft' transactions can be completed` })
    }

    const updated = await billPaymentJsonRepository.updateTransaction(id, {
      status: 'completed',
      draftReason: undefined,
      statusNote: undefined,
    })

    return { success: true, data: updated }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Failed to complete transaction: ${error.message}` })
  }
})
