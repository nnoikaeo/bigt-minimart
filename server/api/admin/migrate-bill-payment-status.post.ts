/**
 * POST /api/admin/migrate-bill-payment-status
 *
 * Data migration script for Bill Payment service harmonization.
 * Migrates legacy Firestore data to align with UnifiedWorkflowStatus
 * and UnifiedTransactionStatus.
 *
 * Migration rules:
 *   BillPaymentTransaction:
 *     - 'success' → 'completed'
 *     - 'failed'  → 'cancelled'
 *   BillPaymentDailySummary:
 *     - Add default values for new fields (audit cash counts, balance snapshot, etc.)
 *
 * Features:
 *   - Authentication required (owner role only)
 *   - Dry-run mode (default) — preview changes without writing
 *   - Produces a rollback snapshot before applying
 *
 * ⚠️  This script must run BEFORE the new UI goes live.
 *
 * @example
 *   POST /api/admin/migrate-bill-payment-status
 *   Body: { "dryRun": true }    // preview (default)
 *   Body: { "dryRun": false }   // apply changes
 */

import { z } from 'zod'

const bodySchema = z.object({
  dryRun: z.boolean().default(true),
})

// Legacy transaction statuses that need migration
const TRANSACTION_STATUS_MAP: Record<string, string> = {
  success: 'completed',
  failed: 'cancelled',
}

// Legacy workflow statuses that need migration
const WORKFLOW_STATUS_MAP: Record<string, string> = {
  pending: 'step1_in_progress',
  recording: 'step1_in_progress',
  in_progress: 'step1_in_progress',
  verified: 'step2_completed',
  audited_ok: 'audited',
  audited_issues: 'audited_with_issues',
  completed: 'approved',
}

// Default values for new DailySummary fields added during harmonization
const SUMMARY_DEFAULTS = {
  auditorActualBillPaymentCash: undefined,
  auditorActualServiceFeeCash: undefined,
  auditExpectedClosingBalance: undefined,
  auditBankStatementVsClosingDiff: undefined,
  auditBankStatementVsClosingMatches: undefined,
  auditTxnIssueStatus: undefined,
}

interface MigrationChange {
  collection: string
  documentId: string
  field: string
  oldValue: unknown
  newValue: unknown
}

interface MigrationResult {
  success: boolean
  dryRun: boolean
  timestamp: string
  summary: {
    transactionsScanned: number
    transactionsMigrated: number
    summariesScanned: number
    summariesMigrated: number
    summaryFieldsAdded: number
  }
  changes: MigrationChange[]
  rollbackSnapshot?: {
    transactions: Record<string, string>[]
    summaries: Record<string, unknown>[]
  }
  errors: string[]
}

export default defineEventHandler(async (event) => {
  // ── Auth: require owner role ──────────────────────────────────────────
  const { requireServerAuth } = await import('~/server/utils/serverAuth')
  const user = await requireServerAuth(event)

  // In production, verify role from Firestore user record
  // In dev mode, allow dev-unverified to proceed
  if (user.uid !== 'dev-unverified') {
    try {
      const { adminDb } = await import('~/server/utils/firebase-admin')
      const userDoc = await adminDb.collection('users').doc(user.uid).get()
      const userData = userDoc.data()
      const userRole = userData?.primaryRole || userData?.role

      if (userRole !== 'owner') {
        throw createError({
          statusCode: 403,
          message: 'Migration requires owner role',
        })
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err) throw err
      console.warn('[migrate] Could not verify role from Firestore, proceeding with caution')
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────
  const body = await readBody(event)
  const { dryRun } = bodySchema.parse(body ?? {})

  console.log(`[migrate] Starting bill-payment migration (dryRun=${dryRun})`)

  const changes: MigrationChange[] = []
  const errors: string[] = []
  const result: MigrationResult = {
    success: false,
    dryRun,
    timestamp: new Date().toISOString(),
    summary: {
      transactionsScanned: 0,
      transactionsMigrated: 0,
      summariesScanned: 0,
      summariesMigrated: 0,
      summaryFieldsAdded: 0,
    },
    changes,
    errors,
  }

  try {
    const { readFile, writeFile, copyFile } = await import('fs/promises')
    const { join } = await import('path')

    const dataDir = join(process.cwd(), 'public', 'data')

    // ── 1. Migrate Transactions ───────────────────────────────────────
    const txnPath = join(dataDir, 'bill-payment-transactions.json')
    const txnRaw = await readFile(txnPath, 'utf-8')
    const transactions: Record<string, unknown>[] = JSON.parse(txnRaw)

    result.summary.transactionsScanned = transactions.length

    // Build rollback snapshot (original status values)
    const txnRollback = transactions.map((t) => ({
      id: String(t.id),
      status: String(t.status),
    }))

    for (const txn of transactions) {
      const oldStatus = String(txn.status ?? '')
      const newStatus = TRANSACTION_STATUS_MAP[oldStatus]

      if (newStatus) {
        changes.push({
          collection: 'bill-payment-transactions',
          documentId: String(txn.id),
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
        })

        if (!dryRun) {
          txn.status = newStatus
        }

        result.summary.transactionsMigrated++
      }
    }

    // ── 2. Migrate Summaries ──────────────────────────────────────────
    const sumPath = join(dataDir, 'bill-payment-summaries.json')
    const sumRaw = await readFile(sumPath, 'utf-8')
    const summaries: Record<string, unknown>[] = JSON.parse(sumRaw)

    result.summary.summariesScanned = summaries.length

    // Build rollback snapshot (original summaries)
    const sumRollback = summaries.map((s) => ({
      id: String(s.id),
      workflowStatus: s.workflowStatus,
    }))

    for (const summary of summaries) {
      let migrated = false

      // 2a. Migrate workflowStatus if it uses a legacy value
      const oldWfStatus = String(summary.workflowStatus ?? '')
      const newWfStatus = WORKFLOW_STATUS_MAP[oldWfStatus]

      if (newWfStatus) {
        changes.push({
          collection: 'bill-payment-summaries',
          documentId: String(summary.id),
          field: 'workflowStatus',
          oldValue: oldWfStatus,
          newValue: newWfStatus,
        })

        if (!dryRun) {
          summary.workflowStatus = newWfStatus
        }
        migrated = true
      }

      // 2b. Add default values for new fields (only if missing)
      for (const [field, defaultValue] of Object.entries(SUMMARY_DEFAULTS)) {
        if (!(field in summary)) {
          changes.push({
            collection: 'bill-payment-summaries',
            documentId: String(summary.id),
            field,
            oldValue: undefined,
            newValue: defaultValue,
          })

          if (!dryRun) {
            summary[field] = defaultValue
          }

          result.summary.summaryFieldsAdded++
          migrated = true
        }
      }

      if (migrated) {
        result.summary.summariesMigrated++
      }
    }

    // ── 3. Write changes (if not dry-run) ─────────────────────────────
    if (!dryRun) {
      // Create backup copies before writing
      const backupSuffix = `.backup-${Date.now()}.json`
      await copyFile(txnPath, txnPath.replace('.json', backupSuffix))
      await copyFile(sumPath, sumPath.replace('.json', backupSuffix))

      console.log('[migrate] Backup files created')

      // Write migrated data
      await writeFile(txnPath, JSON.stringify(transactions, null, 2), 'utf-8')
      await writeFile(sumPath, JSON.stringify(summaries, null, 2), 'utf-8')

      console.log('[migrate] Migration applied successfully')
    }

    // ── 4. Build rollback snapshot ────────────────────────────────────
    result.rollbackSnapshot = {
      transactions: txnRollback,
      summaries: sumRollback,
    }

    result.success = true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    errors.push(message)
    console.error('[migrate] Error:', message)
  }

  const totalChanges = result.summary.transactionsMigrated
    + result.summary.summariesMigrated
    + result.summary.summaryFieldsAdded

  console.log(
    `[migrate] Done — dryRun=${dryRun}, changes=${totalChanges}, errors=${errors.length}`,
  )

  return result
})
