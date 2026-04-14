import { billPaymentJsonRepository } from '~/server/repositories/bill-payment-json.repository'
import { requireServerAuth } from '~/server/utils/serverAuth'

/**
 * POST /api/bill-payment/migrate-status
 *
 * One-time data migration: converts legacy transaction statuses to the
 * unified status model.
 *
 * Mapping:
 *   'success' → 'completed'
 *   'failed'  → 'cancelled'
 *
 * ⚠️ Run BEFORE deploying UI changes that depend on the new status model.
 * ⚠️ Idempotent — safe to run multiple times; already-migrated records are skipped.
 */
export default defineEventHandler(async (event) => {
  try {
    await requireServerAuth(event)

    await billPaymentJsonRepository.init()

    const allTxns = await billPaymentJsonRepository.getTransactionsByDateRange('2000-01-01', '2099-12-31')

    let migratedCount = 0
    let skippedCount = 0

    for (const txn of allTxns) {
      const legacyStatus = txn.status as string

      if (legacyStatus === 'success') {
        await billPaymentJsonRepository.updateTransaction(txn.id, { status: 'completed' })
        migratedCount++
      } else if (legacyStatus === 'failed') {
        await billPaymentJsonRepository.updateTransaction(txn.id, { status: 'cancelled' })
        migratedCount++
      } else if (['completed', 'draft', 'on_hold', 'cancelled'].includes(legacyStatus)) {
        skippedCount++
      } else {
        // Unknown status — default to cancelled and note it
        await billPaymentJsonRepository.updateTransaction(txn.id, {
          status: 'cancelled',
          statusNote: `Migrated from unknown status: ${legacyStatus}`,
        })
        migratedCount++
      }
    }

    return {
      success: true,
      message: `Migration complete. Migrated: ${migratedCount}, Skipped (already up-to-date): ${skippedCount}`,
      migratedCount,
      skippedCount,
      totalProcessed: allTxns.length,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Migration failed: ${error.message}` })
  }
})
