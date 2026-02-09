<template>
  <div class="transaction-form card">
    <h3 class="form-title">📝 Record New Transaction (บันทึกธุรกรรมใหม่)</h3>

    <form @submit.prevent="handleSubmit">
      <!-- Date & Time Section -->
      <div class="form-section">
        <h4 class="section-title">Date & Time</h4>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              Date (วันที่)
              <span class="required">*</span>
            </label>
            <input v-model="formData.date" type="date" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label">
              Time (เวลา)
              <span class="required">*</span>
            </label>
            <input v-model="formData.time" type="time" class="form-control" required />
          </div>
        </div>
      </div>

      <!-- Transaction Type & Channel Section -->
      <div class="form-section">
        <TransactionTypeSelector v-model="formData.transactionType" />

        <!-- Channel - Only for Transfer/Withdrawal -->
        <ChannelSelector
          v-if="formData.transactionType !== 'owner_deposit'"
          v-model="formData.channel"
        />
      </div>

      <!-- Conditional Channel Fields -->
      <div v-if="formData.transactionType !== 'owner_deposit'" class="form-section">
        <PromptPayFields
          v-if="formData.channel === 'promptpay'"
          v-model="promptpayData"
        />

        <BankAccountFields
          v-if="formData.channel === 'bank' || formData.channel === 'other'"
          v-model="bankData"
        />
      </div>

      <!-- Amount & Commission Section -->
      <div class="form-section">
        <h4 class="section-title">Financial Information (ข้อมูลการเงิน)</h4>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              Amount (จำนวนเงิน)
              <span class="required">*</span>
            </label>
            <div class="input-group">
              <input
                v-model.number="formData.amount"
                type="number"
                class="form-control"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
              <span class="input-addon">฿</span>
            </div>
          </div>

          <!-- Commission - Only for Transfer/Withdrawal -->
          <div v-if="formData.transactionType !== 'owner_deposit'" class="form-group">
            <label class="form-label">Commission (ค่าธรรมเนียม)</label>
            <div class="input-group">
              <input
                v-model.number="formData.commission"
                type="number"
                class="form-control"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <span class="input-addon">฿</span>
            </div>
          </div>
        </div>

        <!-- Commission Type - Only if commission entered -->
        <div
          v-if="formData.transactionType !== 'owner_deposit' && formData.commission > 0"
          class="form-group"
        >
          <label class="form-label">How was commission received? (ได้รับค่าธรรมเนียมอย่างไร)</label>
          <div class="radio-group">
            <div class="radio-item">
              <input
                id="commission-cash"
                v-model="formData.commissionType"
                type="radio"
                value="cash"
                class="radio-input"
              />
              <label for="commission-cash" class="radio-label">💵 Cash (เงินสด)</label>
            </div>

            <div class="radio-item">
              <input
                id="commission-transfer"
                v-model="formData.commissionType"
                type="radio"
                value="transfer"
                class="radio-input"
              />
              <label for="commission-transfer" class="radio-label">📱 Transfer (โอนเงิน)</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Info Section -->
      <div class="form-section">
        <h4 class="section-title">Customer Information (ข้อมูลลูกค้า)</h4>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Customer Name (ชื่อลูกค้า - ไม่บังคับ)</label>
            <input
              v-model="formData.customerName"
              type="text"
              class="form-control"
              placeholder="Customer name (optional)"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Notes (หมายเหตุ - ไม่บังคับ)</label>
            <textarea
              v-model="formData.notes"
              class="form-control"
              placeholder="Additional notes..."
              rows="2"
            />
          </div>
        </div>
      </div>

      <!-- Balance Check Section -->
      <div class="form-section balance-section">
        <BalanceDisplay
          :balances="currentBalance"
          :required-amount="formData.amount"
        />

        <div
          v-if="formData.amount > 0"
          class="status-message"
          :class="{ sufficient: hasSufficientBalance, insufficient: !hasSufficientBalance }"
        >
          <div class="status-icon">
            {{ hasSufficientBalance ? '✅' : '⚠️' }}
          </div>
          <div class="status-text">
            {{
              hasSufficientBalance
                ? 'Sufficient balance - Transaction will be saved as COMPLETED'
                : 'Insufficient balance - Transaction will be saved as DRAFT'
            }}
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting || formData.amount <= 0"
        >
          <span v-if="isSubmitting" class="spinner" />
          {{ buttonLabel }}
        </button>

        <button type="button" class="btn btn-secondary" @click="handleCancel">Cancel</button>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { MoneyTransferBalance } from '~/types/repositories'

interface Props {
  editingTransaction?: any
  currentBalance: MoneyTransferBalance
  recordedBy: string
  recordedByName: string
}

interface Emits {
  (e: 'submit', transaction: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSubmitting = ref(false)
const errorMessage = ref('')

// Form data
const formData = ref({
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  transactionType: 'transfer' as 'transfer' | 'withdrawal' | 'owner_deposit',
  channel: 'promptpay' as 'promptpay' | 'bank' | 'other',
  amount: 0,
  commission: 0,
  commissionType: 'cash' as 'cash' | 'transfer',
  customerName: '',
  notes: '',
})

const promptpayData = ref({
  promptpayIdentifierType: 'phone' as 'phone' | 'id_card',
  promptpayIdentifier: '',
  promptpayAccountName: '',
})

const bankData = ref({
  accountType: '' as 'savings' | 'current' | 'other' | '',
  accountNumber: '',
  accountName: '',
})

/**
 * Check if balance is sufficient
 */
const hasSufficientBalance = computed(() => {
  return props.currentBalance.bankAccount >= formData.value.amount
})

/**
 * Determine button label based on balance
 */
const buttonLabel = computed(() => {
  if (!formData.value.amount || formData.value.amount <= 0) {
    return 'Enter Amount'
  }

  if (hasSufficientBalance.value) {
    return '💾 Save & Complete Transaction'
  } else {
    return '📌 Save as Draft (Insufficient Balance)'
  }
})

/**
 * Handle form submission
 */
async function handleSubmit() {
  errorMessage.value = ''

  // Validate required fields
  if (!formData.value.date) {
    errorMessage.value = 'Date is required'
    return
  }

  if (!formData.value.time) {
    errorMessage.value = 'Time is required'
    return
  }

  if (formData.value.amount <= 0) {
    errorMessage.value = 'Amount must be greater than 0'
    return
  }

  if (formData.value.transactionType !== 'owner_deposit') {
    if (!formData.value.channel) {
      errorMessage.value = 'Channel is required'
      return
    }

    if (formData.value.channel === 'promptpay') {
      if (!promptpayData.value.promptpayIdentifierType) {
        errorMessage.value = 'PromptPay identifier type is required'
        return
      }

      if (!promptpayData.value.promptpayIdentifier) {
        errorMessage.value = 'PromptPay identifier is required'
        return
      }
    } else if (formData.value.channel === 'bank' || formData.value.channel === 'other') {
      if (!bankData.value.accountType) {
        errorMessage.value = 'Account type is required'
        return
      }

      if (!bankData.value.accountNumber) {
        errorMessage.value = 'Account number is required'
        return
      }

      if (!bankData.value.accountName) {
        errorMessage.value = 'Account name is required'
        return
      }
    }
  }

  // Prepare transaction data
  const transactionData = {
    date: formData.value.date,
    datetime: new Date(
      `${formData.value.date}T${formData.value.time}`
    ).toISOString(),
    transactionType: formData.value.transactionType,
    channel: formData.value.channel,
    ...(formData.value.channel === 'promptpay' && {
      promptpayIdentifierType: promptpayData.value.promptpayIdentifierType,
      promptpayIdentifier: promptpayData.value.promptpayIdentifier,
      promptpayAccountName: promptpayData.value.promptpayAccountName,
    }),
    ...(
      (formData.value.channel === 'bank' || formData.value.channel === 'other') && {
        accountType: bankData.value.accountType,
        accountNumber: bankData.value.accountNumber,
        accountName: bankData.value.accountName,
      }
    ),
    amount: formData.value.amount,
    commission: formData.value.commission || 0,
    commissionType: formData.value.commissionType,
    customerName: formData.value.customerName,
    notes: formData.value.notes,
    recordedBy: props.recordedBy,
    recordedByName: props.recordedByName,
    status: hasSufficientBalance.value ? 'completed' : 'draft',
  }

  isSubmitting.value = true

  try {
    emit('submit', transactionData)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to submit transaction'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Handle cancel button
 */
function handleCancel() {
  emit('cancel')
}
</script>

<style scoped lang="scss">
.transaction-form {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 25px;

  .form-title {
    margin: 0 0 25px 0;
    font-size: 20px;
    font-weight: 700;
    color: #212529;
    border-bottom: 3px solid #007bff;
    padding-bottom: 12px;
  }

  .form-section {
    margin-bottom: 25px;
    padding-bottom: 25px;
    border-bottom: 1px solid #e9ecef;

    &:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }

    .section-title {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #495057;
    }
  }

  .balance-section {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 25px;

    .status-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
      font-weight: 600;
      font-size: 15px;

      &.sufficient {
        background: #d1e7dd;
        color: #0f5132;
        border: 1px solid #badbcc;
      }

      &.insufficient {
        background: #fff3cd;
        color: #664d03;
        border: 1px solid #ffecb5;
      }

      .status-icon {
        font-size: 24px;
      }

      .status-text {
        flex: 1;
      }
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .form-label {
      font-weight: 600;
      color: #212529;
      font-size: 14px;

      .required {
        color: #dc3545;
        margin-left: 2px;
      }
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.15s ease-in-out;

      &:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
    }

    textarea.form-control {
      resize: vertical;
      font-family: inherit;
    }

    .input-group {
      display: flex;
      gap: 0;

      .form-control {
        flex: 1;
        border-radius: 4px 0 0 4px;
      }

      .input-addon {
        background: #e9ecef;
        border: 1px solid #dee2e6;
        border-left: none;
        border-radius: 0 4px 4px 0;
        padding: 10px 12px;
        color: #495057;
        font-weight: 600;
      }
    }

    .radio-group {
      display: flex;
      gap: 12px;

      .radio-item {
        position: relative;

        .radio-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;

          &:checked + .radio-label {
            background: #e7f1ff;
            border-color: #0d6efd;
            color: #0d6efd;
          }
        }

        .radio-label {
          display: inline-block;
          padding: 8px 12px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0d6efd;
          }
        }
      }
    }
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 25px;

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    }

    .btn-primary {
      background: #0d6efd;
      color: white;

      &:hover:not(:disabled) {
        background: #0b5ed7;
      }
    }

    .btn-secondary {
      background: #6c757d;
      color: white;

      &:hover:not(:disabled) {
        background: #5c636a;
      }
    }
  }

  .alert {
    padding: 12px 15px;
    border-radius: 4px;
    margin-top: 15px;
    font-size: 14px;

    &.alert-danger {
      background: #f8d7da;
      color: #842029;
      border: 1px solid #f5c2c7;
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .transaction-form {
    padding: 15px;

    .form-title {
      font-size: 18px;
      margin-bottom: 15px;
    }

    .form-section {
      margin-bottom: 15px;
      padding-bottom: 15px;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .form-actions {
      flex-direction: column;

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>
