import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * DELETE /api/money-transfer/transactions/:id
 *
 * Delete a draft transaction by ID.
 * Only draft transactions can be deleted.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Transaction ID is required' })
  }

  try {
    await moneyTransferJsonRepository.init()

    const transaction = await moneyTransferJsonRepository.getTransaction(id)

    if (transaction.status !== 'draft') {
      throw createError({
        statusCode: 422,
        message: 'Only draft transactions can be deleted',
      })
    }

    await moneyTransferJsonRepository.deleteTransaction(id)
    console.log(`[DELETE /api/money-transfer/transactions/${id}] Deleted successfully`)

    return { success: true, message: 'Transaction deleted successfully' }
  } catch (error: any) {
    console.error(`[DELETE /api/money-transfer/transactions/${id}] Error:`, error)

    if (error.statusCode) throw error

    if (error.message?.includes('not found')) {
      throw createError({ statusCode: 404, message: `Transaction ${id} not found` })
    }

    throw createError({ statusCode: 500, message: `Failed to delete transaction: ${error.message}` })
  }
})
