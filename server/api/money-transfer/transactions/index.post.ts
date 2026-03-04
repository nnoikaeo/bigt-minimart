import { z } from 'zod'
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'
import type { MoneyTransferTransaction } from '~/types/repositories'

/**
 * POST /api/money-transfer/transactions
 *
 * Create a new money transfer transaction
 * - Validates input with Zod
 * - Checks balance sufficiency
 * - Automatically saves as draft if insufficient balance
 * - Calculates balance impacts and snapshots
 * - Updates daily summary
 *
 * Request body: MoneyTransferTransaction (without id, createdAt, updatedAt)
 * Response: { success: boolean, data: MoneyTransferTransaction }
 */

const createTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  datetime: z.string().datetime('DateTime must be valid ISO format'),
  transactionType: z.enum(['transfer', 'withdrawal', 'owner_deposit']),
  channel: z.enum(['promptpay', 'bank', 'other']).optional(),

  // PromptPay fields
  promptpayIdentifierType: z.enum(['phone', 'id_card']).optional(),
  promptpayIdentifier: z.string().optional(),
  promptpayAccountName: z.string().optional(),

  // Bank/Other fields
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),

  // Financial data
  amount: z.number().positive('Amount must be greater than 0'),
  commission: z.number().nonnegative('Commission cannot be negative').optional(),
  commissionType: z.enum(['cash', 'transfer']).optional(),
  customerName: z.string().optional(),

  // User tracking
  recordedBy: z.string().min(1, 'RecordedBy is required'),
  recordedByName: z.string().min(1, 'RecordedByName is required'),

  // Notes
  notes: z.string().optional(),

  // Status (client suggestion, but server may override)
  status: z.enum(['draft', 'completed']).default('completed'),
})

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await moneyTransferJsonRepository.init()

    const body = await readBody(event)
    console.log('[POST /api/money-transfer/transactions] Request body:', body)

    // Validate input
    const validatedData = createTransactionSchema.parse(body)
    console.log('[POST /api/money-transfer/transactions] Validated data:', validatedData)

    // Get current balance for this date
    const currentBalance = await moneyTransferJsonRepository.getCurrentBalance(validatedData.date)
    console.log(
      `[POST /api/money-transfer/transactions] Current balance for ${validatedData.date}:`,
      currentBalance
    )

    // Check balance sufficiency
    // owner_deposit = เพิ่มเงินเข้าบัญชี ไม่มีเงื่อนไขยอดคงเหลือ ให้ผ่านเสมอ
    const hasSufficientBalance =
      validatedData.transactionType === 'owner_deposit'
        ? true
        : validatedData.transactionType === 'withdrawal'
          ? currentBalance.transferCash >= validatedData.amount
          : currentBalance.bankAccount >= validatedData.amount

    // Determine final status
    let finalStatus: 'draft' | 'completed' = validatedData.status
    let draftReason: string | undefined

    if (!hasSufficientBalance && validatedData.status === 'completed') {
      console.log(
        `[POST /api/money-transfer/transactions] Insufficient balance for ${validatedData.transactionType}: available=${currentBalance.bankAccount}, required=${validatedData.amount}`
      )
      finalStatus = 'draft'
      draftReason = 'Insufficient bank account balance'
    }

    // Calculate balance impacts
    let balanceAfterBankAccount = currentBalance.bankAccount
    let balanceAfterTransferCash = currentBalance.transferCash
    let balanceAfterServiceFeeCash = currentBalance.serviceFeeCash
    let balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer

    if (finalStatus === 'completed') {
      if (validatedData.transactionType === 'owner_deposit') {
        // Owner deposits — owner adds money to bank account
        balanceAfterBankAccount = currentBalance.bankAccount + validatedData.amount
      } else if (validatedData.transactionType === 'withdrawal') {
        // Withdrawal — customer sends to owner's bank, owner pays out cash
        balanceAfterBankAccount = currentBalance.bankAccount + validatedData.amount
        balanceAfterTransferCash = currentBalance.transferCash - validatedData.amount

        // Commission handling
        // transfer commission = customer also transfers commission via bank → add to bankAccount
        if (validatedData.commission && validatedData.commission > 0) {
          if (validatedData.commissionType === 'cash') {
            balanceAfterServiceFeeCash = currentBalance.serviceFeeCash + validatedData.commission
          } else if (validatedData.commissionType === 'transfer') {
            balanceAfterBankAccount += validatedData.commission
            balanceAfterServiceFeeTransfer =
              currentBalance.serviceFeeTransfer + validatedData.commission
          }
        }
      } else {
        // Transfer — customer gives cash, owner transfers from bank
        balanceAfterBankAccount = currentBalance.bankAccount - validatedData.amount
        balanceAfterTransferCash = currentBalance.transferCash + validatedData.amount

        // Commission handling
        if (validatedData.commission && validatedData.commission > 0) {
          if (validatedData.commissionType === 'cash') {
            balanceAfterServiceFeeCash = currentBalance.serviceFeeCash + validatedData.commission
          } else if (validatedData.commissionType === 'transfer') {
            balanceAfterServiceFeeTransfer =
              currentBalance.serviceFeeTransfer + validatedData.commission
          }
        }
      }
    }

    // Create transaction with balance snapshots
    const transactionData: Omit<MoneyTransferTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      date: validatedData.date,
      datetime: validatedData.datetime,
      transactionType: validatedData.transactionType,
      channel: validatedData.channel,
      promptpayIdentifierType: validatedData.promptpayIdentifierType,
      promptpayIdentifier: validatedData.promptpayIdentifier,
      promptpayAccountName: validatedData.promptpayAccountName,
      bankName: validatedData.bankName,
      accountNumber: validatedData.accountNumber,
      accountName: validatedData.accountName,
      amount: validatedData.amount,
      commission: validatedData.transactionType === 'owner_deposit' ? 0 : (validatedData.commission || 0),
      commissionType: validatedData.transactionType === 'owner_deposit' ? undefined : validatedData.commissionType,
      customerName: validatedData.customerName,
      status: finalStatus,
      draftReason,
      recordedBy: validatedData.recordedBy,
      recordedByName: validatedData.recordedByName,
      notes: validatedData.notes,
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

    // Add to repository
    const newTransaction = await moneyTransferJsonRepository.addTransaction(transactionData)
    console.log('[POST /api/money-transfer/transactions] Created transaction:', newTransaction.id)

    // If transaction is completed, update balance
    if (finalStatus === 'completed') {
      await moneyTransferJsonRepository.updateBalance(validatedData.date, {
        bankAccount: balanceAfterBankAccount,
        transferCash: balanceAfterTransferCash,
        serviceFeeCash: balanceAfterServiceFeeCash,
        serviceFeeTransfer: balanceAfterServiceFeeTransfer,
      })
      console.log('[POST /api/money-transfer/transactions] Updated balance')
    }

    // Update daily summary with transaction counts
    let summary = await moneyTransferJsonRepository.getDailySummary(validatedData.date)
    if (!summary) {
      summary = await moneyTransferJsonRepository.createDailySummary(validatedData.date)
    }

    const transactions = await moneyTransferJsonRepository.getTransactionsByDate(validatedData.date)
    const completed = transactions.filter(t => t.status === 'completed')

    await moneyTransferJsonRepository.updateDailySummary(validatedData.date, {
      step1: {
        ...summary.step1,
        totalTransactions: transactions.length,
        completedTransactions: completed.length,
        draftTransactions: transactions.filter(t => t.status === 'draft').length,
        totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
        totalCommission: completed
          .filter(t => t.transactionType !== 'owner_deposit')
          .reduce((sum, t) => sum + (t.commission || 0), 0),
      },
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      data: newTransaction,
      message:
        finalStatus === 'draft'
          ? `Transaction saved as draft (insufficient balance)`
          : 'Transaction created successfully',
    }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/transactions] Error:', error)

    if (error instanceof z.ZodError) {
      console.error('[POST /api/money-transfer/transactions] Validation error:', error.issues)
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('[POST /api/money-transfer/transactions] Unexpected error:', error.message)
    throw createError({
      statusCode: 500,
      message: `Failed to create transaction: ${error.message}`,
    })
  }
})
