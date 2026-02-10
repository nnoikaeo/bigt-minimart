<template>
  <div class="step-2-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">💰 Money Transfer Service - Step 2: Cash Verification</h1>
      <p class="page-description">
        ตรวจสอบเงินสดจริงกับจำนวนที่คำนวณได้ - Verify actual cash against expected amounts
      </p>

      <!-- Date Selector -->
      <div class="date-selector">
        <label>Select Date (เลือกวันที่):</label>
        <input
          v-model="selectedDate"
          type="date"
          class="form-control"
          @change="handleDateChange"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading" class="loading-container">
      <div class="spinner" />
      <p>Loading verification data...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Step 1 Summary Card -->
      <section v-if="store.currentSummary" class="summary-card">
        <h3>📋 Step 1 Summary (Recap)</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Total Transactions:</span>
            <span class="value">{{ store.currentSummary.step1.totalTransactions }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Completed:</span>
            <span class="value">{{ store.currentSummary.step1.completedTransactions }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Amount:</span>
            <span class="value">{{ formatCurrency(store.currentSummary.step1.totalAmount) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Commission:</span>
            <span class="value">{{ formatCurrency(store.currentSummary.step1.totalCommission) }}</span>
          </div>
        </div>
      </section>

      <!-- Step 2 Status Card -->
      <section v-if="store.currentSummary" class="status-card">
        <h3>📊 Step 2 Status</h3>
        <div class="status-info">
          <span class="status-badge" :class="store.isStep2Complete ? 'completed' : 'in-progress'">
            {{ store.isStep2Complete ? '✅ Completed' : '🔄 In Progress' }}
          </span>
          <span v-if="store.currentSummary.step2?.hasDiscrepancies" class="warning-badge">
            ⚠️ Has Discrepancies
          </span>
        </div>
      </section>

      <!-- Verification Form -->
      <section class="verification-section">
        <h3 class="section-title">💵 Cash Count Verification</h3>

        <div v-if="!store.isStep2Complete" class="verification-form">
          <div class="form-section">
            <h4 class="subsection-title">Expected Amounts (From System Calculations)</h4>

            <div class="amounts-grid">
              <div class="amount-box expected">
                <div class="label">Transfers & Withdrawals</div>
                <div class="amount">{{ formatCurrency(expectedCash.transferWithdrawal) }}</div>
                <small>Total from all transfer/withdrawal transactions</small>
              </div>

              <div class="amount-box expected">
                <div class="label">Service Fee (Cash)</div>
                <div class="amount">{{ formatCurrency(expectedCash.serviceFee) }}</div>
                <small>Commission received in cash</small>
              </div>

              <div class="amount-box expected total">
                <div class="label">Total Expected Cash</div>
                <div class="amount">{{ formatCurrency(expectedCash.total) }}</div>
                <small>Sum of all expected amounts</small>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="subsection-title">Actual Amounts (Count as of now)</h4>

            <div class="input-grid">
              <div class="input-group">
                <label class="form-label">
                  Transfer & Withdrawal Cash (เงินโอน/ถอน)
                  <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <input
                    v-model.number="actualCash.transferWithdrawal"
                    type="number"
                    class="form-control"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span class="currency">฿</span>
                </div>
              </div>

              <div class="input-group">
                <label class="form-label">
                  Service Fee Cash (ค่าธรรมเนียม-เงินสด)
                  <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <input
                    v-model.number="actualCash.serviceFee"
                    type="number"
                    class="form-control"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span class="currency">฿</span>
                </div>
              </div>

              <div class="input-group">
                <label class="form-label">Total Actual Cash</label>
                <div class="input-wrapper total-display">
                  <span class="total-amount">{{ formatCurrency(actualCash.total) }}</span>
                  <span class="currency">฿</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Discrepancy Analysis -->
          <div class="form-section discrepancies">
            <h4 class="subsection-title">Discrepancy Analysis</h4>

            <div class="analysis-grid">
              <div class="analysis-box" :class="{ discrepancy: differences.transferWithdrawal !== 0 }">
                <div class="label">Transfer & Withdrawal</div>
                <div class="expected">Expected: {{ formatCurrency(expectedCash.transferWithdrawal) }}</div>
                <div class="actual">Actual: {{ formatCurrency(actualCash.transferWithdrawal) }}</div>
                <div class="difference">
                  Diff: <span>{{ formatCurrency(differences.transferWithdrawal) }}</span>
                </div>
              </div>

              <div class="analysis-box" :class="{ discrepancy: differences.serviceFee !== 0 }">
                <div class="label">Service Fee (Cash)</div>
                <div class="expected">Expected: {{ formatCurrency(expectedCash.serviceFee) }}</div>
                <div class="actual">Actual: {{ formatCurrency(actualCash.serviceFee) }}</div>
                <div class="difference">
                  Diff: <span>{{ formatCurrency(differences.serviceFee) }}</span>
                </div>
              </div>

              <div class="analysis-box total" :class="{ discrepancy: differences.total !== 0 }">
                <div class="label">Total</div>
                <div class="expected">Expected: {{ formatCurrency(expectedCash.total) }}</div>
                <div class="actual">Actual: {{ formatCurrency(actualCash.total) }}</div>
                <div class="difference">
                  Diff: <span>{{ formatCurrency(differences.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Discrepancy Alert -->
            <div v-if="differences.total !== 0" class="alert alert-warning">
              <strong>⚠️ Discrepancy Alert</strong>
              <p>
                Total difference of {{ formatCurrency(Math.abs(differences.total)) }}
                {{ differences.total > 0 ? '(Over)' : '(Short)' }}.
                Please review and add notes explaining the discrepancy.
              </p>
            </div>

            <div v-else class="alert alert-success">
              <strong>✅ No Discrepancies</strong>
              <p>Actual amounts match expected amounts perfectly.</p>
            </div>
          </div>

          <!-- Verification Notes -->
          <div class="form-section">
            <h4 class="subsection-title">Verification Notes (ความเห็นเพิ่มเติม)</h4>

            <textarea
              v-model="verificationNotes"
              class="form-control notes-textarea"
              placeholder="Add any notes about the verification process or discrepancies..."
              rows="4"
            />
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button
              class="btn btn-primary btn-lg"
              :disabled="isSubmitting"
              @click="handleCompleteStep2"
            >
              <span v-if="isSubmitting" class="spinner-small" />
              {{ isSubmitting ? 'Submitting...' : '✅ Complete Step 2 & Proceed to Audit' }}
            </button>

            <button class="btn btn-secondary" @click="goBackToStep1">← Back to Step 1</button>
          </div>
        </div>

        <!-- Step 2 Already Completed -->
        <div v-else class="completed-box">
          <h4>✅ Step 2 Completed</h4>

          <div v-if="store.currentSummary?.step2" class="verification-summary">
            <div class="summary-row">
              <span class="label">Expected Transfer/Withdrawal:</span>
              <span class="value">{{ formatCurrency(store.currentSummary.step2.expectedCash.transferWithdrawal) }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Actual Transfer/Withdrawal:</span>
              <span class="value">{{ formatCurrency(store.currentSummary.step2.actualCash.transferWithdrawal) }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Expected Service Fee:</span>
              <span class="value">{{ formatCurrency(store.currentSummary.step2.expectedCash.serviceFee) }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Actual Service Fee:</span>
              <span class="value">{{ formatCurrency(store.currentSummary.step2.actualCash.serviceFee) }}</span>
            </div>

            <div class="summary-row total">
              <span class="label">Discrepancy Status:</span>
              <span class="value" :class="{ 'no-discrepancy': !store.currentSummary.step2.hasDiscrepancies }">
                {{
                  store.currentSummary.step2.hasDiscrepancies
                    ? `⚠️ ${formatCurrency(store.currentSummary.step2.differences.total)}`
                    : '✅ No Discrepancies'
                }}
              </span>
            </div>

            <div v-if="store.currentSummary.step2.verificationNotes" class="notes-display">
              <strong>Notes:</strong>
              <p>{{ store.currentSummary.step2.verificationNotes }}</p>
            </div>
          </div>

          <p class="next-step">Proceed to Auditor Verification (Workflow 2.2)</p>

          <button class="btn btn-primary" @click="goToAuditReview">
            → Go to Auditor Review
          </button>
        </div>
      </section>

      <!-- Transactions Reference Table -->
      <section class="reference-section">
        <h3 class="section-title">📖 Transaction Reference (Read-only)</h3>
        <p class="section-subtitle">
          These are the completed transactions from Step 1 that contribute to cash counts
        </p>

        <div class="transactions-reference">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in completedTransactions" :key="transaction.id">
                <td>{{ formatTime(transaction.datetime) }}</td>
                <td>{{ formatTransactionType(transaction.transactionType) }}</td>
                <td>{{ formatChannel(transaction.channel) }}</td>
                <td class="amount">{{ formatCurrency(transaction.amount) }}</td>
                <td class="amount">{{ formatCurrency(transaction.commission || 0) }}</td>
                <td class="small">{{ transaction.commissionType || '-' }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="completedTransactions.length === 0" class="empty-state">
            <p>No completed transactions for this date.</p>
          </div>
        </div>
      </section>

      <!-- Error Message -->
      <div v-if="store.error" class="alert alert-danger">
        {{ store.error }}
        <button class="btn-close" @click="store.clearError">✕</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'

definePageMeta({
  middleware: 'auth',
  title: 'Money Transfer Service - Step 2: Cash Verification',
})

const store = useMoneyTransferStore()
const router = useRouter()

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const actualCash = ref({
  transferWithdrawal: 0,
  serviceFee: 0,
  total: 0,
})
const verificationNotes = ref('')
const isSubmitting = ref(false)

/**
 * Expected cash amounts (calculated from completed transactions)
 */
const expectedCash = computed(() => {
  if (!selectedDate.value) {
    return { transferWithdrawal: 0, serviceFee: 0, total: 0 }
  }
  const transactions = store.getTransactionsByDate(selectedDate.value)
  const completed = transactions.filter((t: any) => t.status === 'completed')

  return {
    transferWithdrawal: completed
      .filter((t: any) => t.transactionType !== 'owner_deposit')
      .reduce((sum: any, t: any) => sum + t.amount, 0),
    serviceFee: completed
      .filter((t: any) => t.commission && t.commissionType === 'cash')
      .reduce((sum: any, t: any) => sum + (t.commission || 0), 0),
    total: 0,
  }
})

/**
 * Initialize expected cash total
 */
watch(
  expectedCash,
  () => {
    expectedCash.value.total =
      expectedCash.value.transferWithdrawal + expectedCash.value.serviceFee
  },
  { deep: true }
)

/**
 * Compute actual cash total
 */
watch(
  () => [actualCash.value.transferWithdrawal, actualCash.value.serviceFee],
  () => {
    actualCash.value.total = actualCash.value.transferWithdrawal + actualCash.value.serviceFee
  }
)

/**
 * Calculate differences
 */
const differences = computed(() => ({
  transferWithdrawal: actualCash.value.transferWithdrawal - expectedCash.value.transferWithdrawal,
  serviceFee: actualCash.value.serviceFee - expectedCash.value.serviceFee,
  total: actualCash.value.total - expectedCash.value.total,
}))

/**
 * Get completed transactions for reference
 */
const completedTransactions = computed(() => {
  if (!selectedDate.value) return []
  const transactions = store.getTransactionsByDate(selectedDate.value)
  return transactions.filter((t: any) => t.status === 'completed')
})

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format transaction type
 */
function formatTransactionType(type: string): string {
  const types: Record<string, string> = {
    transfer: '📤 Transfer',
    withdrawal: '💸 Withdrawal',
    owner_deposit: '💰 Owner Deposit',
  }
  return types[type] || type
}

/**
 * Format channel
 */
function formatChannel(channel?: string): string {
  if (!channel) return '-'
  const channels: Record<string, string> = {
    promptpay: '📱 PromptPay',
    bank: '🏦 Bank',
    other: '⚙️ Other',
  }
  return channels[channel] || channel
}

/**
 * Format time
 */
function formatTime(datetime: string | Date): string {
  const date = new Date(datetime)
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Handle date change
 */
async function handleDateChange() {
  if (!selectedDate.value) return
  await store.fetchTransactionsByDate(selectedDate.value)
  await store.fetchDailySummary(selectedDate.value)

  // Load existing Step 2 data if available
  if (store.currentSummary?.step2) {
    actualCash.value = {
      transferWithdrawal: store.currentSummary.step2.actualCash.transferWithdrawal,
      serviceFee: store.currentSummary.step2.actualCash.serviceFee,
      total: store.currentSummary.step2.actualCash.transferWithdrawal +
             store.currentSummary.step2.actualCash.serviceFee,
    }
    verificationNotes.value = store.currentSummary.step2.verificationNotes || ''
  }
}

/**
 * Handle complete Step 2
 */
async function handleCompleteStep2() {
  if (!selectedDate.value) return
  isSubmitting.value = true

  try {
    await store.completeStep2(selectedDate.value, {
      actualCash: {
        transferWithdrawal: actualCash.value.transferWithdrawal,
        serviceFee: actualCash.value.serviceFee,
      },
      verificationNotes: verificationNotes.value,
    })

    alert('Step 2 completed! Proceed to Auditor Verification.')
  } catch (error: any) {
    console.error('Failed to complete Step 2:', error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Go back to Step 1
 */
function goBackToStep1() {
  router.push('/finance/money-transfer-service/step-1')
}

/**
 * Go to Auditor Review
 */
function goToAuditReview() {
  router.push('/finance/money-transfer-service/auditor-review')
}

/**
 * Initialize component
 */
onMounted(async () => {
  await store.initializeStore()
  if (selectedDate.value) {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)

    // Load existing data if available
    if (store.currentSummary?.step2) {
      actualCash.value = {
        transferWithdrawal: store.currentSummary.step2.actualCash.transferWithdrawal,
        serviceFee: store.currentSummary.step2.actualCash.serviceFee,
        total: store.currentSummary.step2.actualCash.transferWithdrawal +
               store.currentSummary.step2.actualCash.serviceFee,
      }
      verificationNotes.value = store.currentSummary.step2.verificationNotes || ''
    }
  }
})
</script>

<style scoped lang="scss">
.step-2-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

  .page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 30px;

    .page-title {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 700;
    }

    .page-description {
      margin: 0 0 20px 0;
      font-size: 16px;
      opacity: 0.9;
    }

    .date-selector {
      display: flex;
      align-items: center;
      gap: 12px;

      label {
        font-weight: 600;
      }

      .form-control {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
      }
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 20px;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }

  .summary-card,
  .status-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;

    h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .summary-grid,
    .status-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;

        .label {
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .value {
          font-weight: 700;
          color: #212529;
          font-size: 16px;
        }
      }
    }

    .status-info {
      display: flex;
      gap: 10px;

      .status-badge,
      .warning-badge {
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;

        &.completed {
          background: #d1e7dd;
          color: #0f5132;
        }

        &.in-progress {
          background: #fff3cd;
          color: #664d03;
        }
      }

      .warning-badge {
        background: #f8d7da;
        color: #842029;
      }
    }
  }

  .verification-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;

    .section-title {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .verification-form {
      .form-section {
        margin-bottom: 25px;
        padding-bottom: 25px;
        border-bottom: 1px solid #e9ecef;

        &:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }

        .subsection-title {
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          color: #495057;
        }

        .amounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;

          .amount-box {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            text-align: center;

            &.expected {
              border-color: #0d6efd;
              background: #e7f1ff;
            }

            &.total {
              border-color: #28a745;
              background: #d1e7dd;
              grid-column: 1 / -1;
            }

            .label {
              font-weight: 600;
              color: #212529;
              margin-bottom: 8px;
            }

            .amount {
              font-size: 24px;
              font-weight: 700;
              color: #0d6efd;
              margin-bottom: 8px;
            }

            small {
              color: #6c757d;
              font-size: 12px;
            }
          }
        }

        .input-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;

          .input-group {
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

            .input-wrapper {
              display: flex;
              gap: 0;
              align-items: center;

              .form-control {
                flex: 1;
                padding: 10px 12px;
                border: 1px solid #dee2e6;
                border-radius: 4px 0 0 4px;
                font-size: 14px;

                &:focus {
                  outline: none;
                  border-color: #0d6efd;
                  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
                }
              }

              .currency {
                background: #e9ecef;
                border: 1px solid #dee2e6;
                border-left: none;
                border-radius: 0 4px 4px 0;
                padding: 10px 12px;
                color: #495057;
                font-weight: 600;
              }

              &.total-display {
                .total-amount {
                  flex: 1;
                  padding: 10px 12px;
                  background: #f8f9fa;
                  border: 1px solid #dee2e6;
                  border-radius: 4px 0 0 4px;
                  font-weight: 700;
                  color: #0d6efd;
                }
              }
            }
          }
        }

        &.discrepancies {
          .analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;

            .analysis-box {
              background: white;
              border: 2px solid #dee2e6;
              border-radius: 6px;
              padding: 15px;

              &.discrepancy {
                border-color: #ffc107;
                background: #fff8e1;
              }

              &.total {
                grid-column: 1 / -1;
                border-color: #0d6efd;
                background: #e7f1ff;
              }

              .label {
                font-weight: 600;
                color: #212529;
                margin-bottom: 8px;
                font-size: 14px;
              }

              .expected,
              .actual {
                font-size: 13px;
                color: #6c757d;
                margin-bottom: 4px;
              }

              .difference {
                font-weight: 700;
                color: #212529;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #dee2e6;

                span {
                  color: #dc3545;
                }
              }
            }
          }

          .alert {
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;

            strong {
              display: block;
              margin-bottom: 5px;
            }

            p {
              margin: 0;
              font-size: 14px;
            }

            &.alert-warning {
              background: #fff3cd;
              color: #664d03;
              border: 1px solid #ffecb5;
            }

            &.alert-success {
              background: #d1e7dd;
              color: #0f5132;
              border: 1px solid #badbcc;
            }
          }
        }
      }
    }

    .completed-box {
      background: #d1e7dd;
      border: 1px solid #badbcc;
      border-radius: 6px;
      padding: 20px;

      h4 {
        margin: 0 0 15px 0;
        color: #0f5132;
      }

      .verification-summary {
        background: white;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;

          &:last-child {
            border-bottom: none;
          }

          &.total {
            font-weight: 700;
            padding-top: 15px;
            border-top: 2px solid #dee2e6;

            .value {
              &.no-discrepancy {
                color: #28a745;
              }
            }
          }

          .label {
            color: #495057;
            font-weight: 600;
          }

          .value {
            color: #212529;
            font-weight: 600;
          }
        }

        .notes-display {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          margin-top: 15px;

          strong {
            display: block;
            margin-bottom: 8px;
            color: #212529;
          }

          p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
          }
        }
      }

      .next-step {
        margin: 0 0 15px 0;
        color: #0f5132;
        font-weight: 600;
      }
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 25px;

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;

        &.btn-primary {
          background: #0d6efd;
          color: white;

          &:hover:not(:disabled) {
            background: #0b5ed7;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        &.btn-secondary {
          background: #6c757d;
          color: white;

          &:hover {
            background: #5c636a;
          }
        }

        .spinner-small {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      }
    }

    .notes-textarea {
      padding: 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;

      &:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
    }
  }

  .reference-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;

    .section-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .section-subtitle {
      margin: 0 0 20px 0;
      color: #6c757d;
      font-size: 14px;
    }

    .transactions-reference {
      overflow-x: auto;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          tr {
            background: #f8f9fa;
            border-bottom: 2px solid #dee2e6;

            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #495057;
              font-size: 14px;
            }
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #dee2e6;

            &:hover {
              background: #f8f9fa;
            }

            td {
              padding: 12px;
              font-size: 14px;

              &.amount {
                text-align: right;
                font-weight: 600;
                color: #0d6efd;
              }

              &.small {
                font-size: 12px;
                color: #6c757d;
              }
            }
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6c757d;
    }
  }

  .alert {
    padding: 15px;
    border-radius: 8px;
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.alert-danger {
      background: #f8d7da;
      color: #842029;
      border: 1px solid #f5c2c7;

      .btn-close {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 20px;
        color: inherit;
      }
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .step-2-container {
    padding: 12px;

    .page-header {
      padding: 20px;

      .page-title {
        font-size: 22px;
      }

      .date-selector {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .verification-section .verification-form .form-section {
      .amounts-grid,
      .analysis-grid {
        grid-template-columns: 1fr;
      }

      .input-grid {
        grid-template-columns: 1fr;
      }
    }

    .reference-section .transactions-reference {
      font-size: 12px;

      table th,
      table td {
        padding: 8px;
      }
    }
  }
}
</style>
