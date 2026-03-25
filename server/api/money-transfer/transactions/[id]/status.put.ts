import { z } from 'zod'
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * PUT /api/money-transfer/transactions/[id]/status
 *
 * Change transaction status with balance adjustment:
 *   completed → on_hold:  reverse balance (as if transaction never happened)
 *   on_hold → completed:  re-apply balance (as if creating fresh)
 *   on_hold → cancelled:  no balance change (already reversed at on_hold)
 *
 * Requires statusNote for all transitions.
 */

const statusChangeSchema = z.object({
  status: z.enum(['on_hold', 'completed', 'cancelled']),
  statusNote: z.string().min(1, 'กรุณาระบุหมายเหตุ'),
})

// Allowed transitions: [from] → [to[]]
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  completed: ['on_hold'],
  on_hold: ['completed', 'cancelled'],
}

export default defineEventHandler(async (event) => {
  try {
    await moneyTransferJsonRepository.init()

    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, message: 'Transaction ID is required' })
    }

    const body = await readBody(event)
    const validated = statusChangeSchema.parse(body)

    // Get transaction
    const transaction = await moneyTransferJsonRepository.getTransaction(id)

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[transaction.status]
    if (!allowed || !allowed.includes(validated.status)) {
      throw createError({
        statusCode: 400,
        message: `ไม่สามารถเปลี่ยนสถานะจาก "${transaction.status}" เป็น "${validated.status}" ได้`,
      })
    }

    // Get current balance
    const currentBalance = await moneyTransferJsonRepository.getCurrentBalance(transaction.date)

    let newBankAccount = currentBalance.bankAccount
    let newTransferCash = currentBalance.transferCash
    let newServiceFeeCash = currentBalance.serviceFeeCash
    let newServiceFeeTransfer = currentBalance.serviceFeeTransfer

    const amount = transaction.amount
    const commission = transaction.commission || 0
    const commissionType = transaction.commissionType

    // ── Balance adjustments ──────────────────────────────────────────────────

    if (transaction.status === 'completed' && validated.status === 'on_hold') {
      // REVERSE balance: undo what was applied at creation
      if (transaction.transactionType === 'owner_deposit') {
        newBankAccount -= amount
      } else if (transaction.transactionType === 'withdrawal') {
        newBankAccount -= amount
        newTransferCash += amount
        if (commission > 0) {
          if (commissionType === 'cash') {
            newServiceFeeCash -= commission
          } else if (commissionType === 'transfer') {
            newBankAccount -= commission
            newServiceFeeTransfer -= commission
          }
        }
      } else {
        // transfer
        newBankAccount += amount
        newTransferCash -= amount
        if (commission > 0) {
          if (commissionType === 'cash') {
            newServiceFeeCash -= commission
          } else if (commissionType === 'transfer') {
            newServiceFeeTransfer -= commission
          }
        }
      }
    } else if (transaction.status === 'on_hold' && validated.status === 'completed') {
      // RE-APPLY balance: same logic as creating a completed transaction
      if (transaction.transactionType === 'owner_deposit') {
        newBankAccount += amount
      } else if (transaction.transactionType === 'withdrawal') {
        newBankAccount += amount
        newTransferCash -= amount
        if (commission > 0) {
          if (commissionType === 'cash') {
            newServiceFeeCash += commission
          } else if (commissionType === 'transfer') {
            newBankAccount += commission
            newServiceFeeTransfer += commission
          }
        }
      } else {
        // transfer
        newBankAccount -= amount
        newTransferCash += amount
        if (commission > 0) {
          if (commissionType === 'cash') {
            newServiceFeeCash += commission
          } else if (commissionType === 'transfer') {
            newServiceFeeTransfer += commission
          }
        }
      }
    }
    // on_hold → cancelled: no balance change (already reversed)

    // ── Update transaction ───────────────────────────────────────────────────

    const updated = await moneyTransferJsonRepository.updateTransaction(id, {
      status: validated.status,
      statusNote: validated.statusNote,
    })

    // ── Update balance ───────────────────────────────────────────────────────

    if (transaction.status === 'completed' && validated.status === 'on_hold' ||
        transaction.status === 'on_hold' && validated.status === 'completed') {
      await moneyTransferJsonRepository.updateBalance(transaction.date, {
        bankAccount: newBankAccount,
        transferCash: newTransferCash,
        serviceFeeCash: newServiceFeeCash,
        serviceFeeTransfer: newServiceFeeTransfer,
      })
    }

    // ── Update daily summary counts ──────────────────────────────────────────

    const summary = await moneyTransferJsonRepository.getDailySummary(transaction.date)
    if (summary) {
      const transactions = await moneyTransferJsonRepository.getTransactionsByDate(transaction.date)
      const completed = transactions.filter(t => t.status === 'completed')

      await moneyTransferJsonRepository.updateDailySummary(transaction.date, {
        step1: {
          ...summary.step1,
          totalTransactions: transactions.length,
          completedTransactions: completed.length,
          draftTransactions: transactions.filter(t => t.status === 'draft').length,
          totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
          totalCommission: completed.reduce((sum, t) => sum + (t.commission || 0), 0),
        },
      })
    }

    console.log(`[PUT /api/money-transfer/transactions/[id]/status] ${id}: ${transaction.status} → ${validated.status}`)

    return {
      success: true,
      data: updated,
      message: `เปลี่ยนสถานะเป็น "${validated.status}" สำเร็จ`,
    }
  } catch (error: any) {
    console.error('[PUT /api/money-transfer/transactions/[id]/status] Error:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: `Failed to change transaction status: ${error.message}`,
    })
  }
})
