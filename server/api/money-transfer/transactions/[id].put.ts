import { z } from 'zod'
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * PUT /api/money-transfer/transactions/:id
 *
 * Update a draft transaction's fields.
 * - Only draft transactions can be edited
 * - If the updated amount is now sufficient, status auto-upgrades to 'completed'
 *   and balance impacts are applied
 */

const updateTransactionSchema = z.object({
  datetime: z.string().datetime().optional(),
  transactionType: z.enum(['transfer', 'withdrawal', 'owner_deposit']).optional(),
  channel: z.enum(['promptpay', 'bank', 'other']).optional(),

  // PromptPay fields
  promptpayIdentifierType: z.enum(['phone', 'id_card']).optional(),
  promptpayIdentifier: z.string().optional(),
  promptpayAccountName: z.string().optional(),

  // Bank fields
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),

  // Financial
  amount: z.number().positive().optional(),
  commission: z.number().nonnegative().optional(),
  commissionType: z.enum(['cash', 'transfer']).optional(),
  customerName: z.string().optional(),

  // Metadata
  notes: z.string().optional(),
  recordedBy: z.string().optional(),
  recordedByName: z.string().optional(),

  // Status from client (server may override based on balance check)
  status: z.enum(['draft', 'completed']).optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Transaction ID is required' })
  }

  try {
    await moneyTransferJsonRepository.init()

    const body = await readBody(event)
    const validated = updateTransactionSchema.parse(body)

    // Only draft transactions can be edited
    const existing = await moneyTransferJsonRepository.getTransaction(id)
    if (existing.status !== 'draft') {
      throw createError({ statusCode: 422, message: 'Only draft transactions can be edited' })
    }

    const currentBalance = await moneyTransferJsonRepository.getCurrentBalance(existing.date)

    // Determine final amount (use validated or existing)
    const finalAmount = validated.amount ?? existing.amount
    const finalType = validated.transactionType ?? existing.transactionType

    // Check balance sufficiency with updated values
    const hasSufficientBalance =
      finalType === 'owner_deposit'
        ? true
        : finalType === 'withdrawal'
          ? currentBalance.transferCash >= finalAmount
          : currentBalance.bankAccount >= finalAmount

    const finalStatus = hasSufficientBalance ? 'completed' : 'draft'

    // Build balance impacts (only relevant if transitioning to completed)
    let balanceAfterBankAccount = currentBalance.bankAccount
    let balanceAfterTransferCash = currentBalance.transferCash
    let balanceAfterServiceFeeCash = currentBalance.serviceFeeCash
    let balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer

    if (finalStatus === 'completed') {
      if (finalType === 'owner_deposit') {
        balanceAfterBankAccount = currentBalance.bankAccount + finalAmount
      } else if (finalType === 'withdrawal') {
        // Withdrawal — customer sends to owner's bank, owner pays out cash
        balanceAfterBankAccount = currentBalance.bankAccount + finalAmount
        balanceAfterTransferCash = currentBalance.transferCash - finalAmount

        // transfer commission = customer also transfers commission via bank → add to bankAccount
        const finalCommission = validated.commission ?? existing.commission ?? 0
        const finalCommissionType = validated.commissionType ?? existing.commissionType
        if (finalCommission > 0) {
          if (finalCommissionType === 'cash') {
            balanceAfterServiceFeeCash = currentBalance.serviceFeeCash + finalCommission
          } else if (finalCommissionType === 'transfer') {
            balanceAfterBankAccount += finalCommission
            balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer + finalCommission
          }
        }
      } else {
        // Transfer — customer gives cash, owner transfers from bank
        balanceAfterBankAccount = currentBalance.bankAccount - finalAmount
        balanceAfterTransferCash = currentBalance.transferCash + finalAmount

        const finalCommission = validated.commission ?? existing.commission ?? 0
        const finalCommissionType = validated.commissionType ?? existing.commissionType
        if (finalCommission > 0) {
          if (finalCommissionType === 'cash') {
            balanceAfterServiceFeeCash = currentBalance.serviceFeeCash + finalCommission
          } else if (finalCommissionType === 'transfer') {
            balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer + finalCommission
          }
        }
      }
    }

    const updates: Record<string, any> = {
      ...validated,
      status: finalStatus,
      balanceImpact: {
        bankAccountBefore: Number(currentBalance.bankAccount),
        bankAccountAfter: Number(balanceAfterBankAccount),
        transferCashBefore: Number(currentBalance.transferCash),
        transferCashAfter: Number(balanceAfterTransferCash),
        serviceFeeBeforeCash: Number(currentBalance.serviceFeeCash),
        serviceFeeAfterCash: Number(balanceAfterServiceFeeCash),
        serviceFeeBeforeTransfer: Number(currentBalance.serviceFeeTransfer),
        serviceFeeAfterTransfer: Number(balanceAfterServiceFeeTransfer),
      },
    }
    if (finalStatus === 'completed') {
      updates.completedAt = new Date().toISOString()
      updates.draftReason = undefined
    }

    const updated = await moneyTransferJsonRepository.updateTransaction(id, updates)
    console.log(`[PUT /api/money-transfer/transactions/${id}] Updated, status=${finalStatus}`)

    // Apply balance if transaction completed
    if (finalStatus === 'completed') {
      await moneyTransferJsonRepository.updateBalance(existing.date, {
        bankAccount: balanceAfterBankAccount,
        transferCash: balanceAfterTransferCash,
        serviceFeeCash: balanceAfterServiceFeeCash,
        serviceFeeTransfer: balanceAfterServiceFeeTransfer,
      })

      // Update daily summary
      const summary = await moneyTransferJsonRepository.getDailySummary(existing.date)
      if (summary) {
        const transactions = await moneyTransferJsonRepository.getTransactionsByDate(existing.date)
        const completed = transactions.filter(t => t.status === 'completed')
        await moneyTransferJsonRepository.updateDailySummary(existing.date, {
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
    }

    return {
      success: true,
      data: updated,
      message: finalStatus === 'completed'
        ? 'Transaction updated and completed'
        : 'Transaction updated as draft',
    }
  } catch (error: any) {
    console.error(`[PUT /api/money-transfer/transactions/${id}] Error:`, error)

    if (error.statusCode) throw error

    if (error.message?.includes('not found')) {
      throw createError({ statusCode: 404, message: `Transaction ${id} not found` })
    }

    throw createError({ statusCode: 500, message: `Failed to update transaction: ${error.message}` })
  }
})
