<template>
  <div class="step-1-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">💰 Money Transfer Service - Step 1: Transaction Recording</h1>
      <p class="page-description">
        บันทึกธุรกรรมโอนเงินสำหรับวันนี้ - Record all transactions for the day
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
      <p>Loading transaction data...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Current Balance Display -->
      <section class="balance-section">
        <BalanceDisplay :balances="store.currentBalance" />
      </section>

      <!-- Step 1 Status Card -->
      <section v-if="store.currentSummary" class="status-card">
        <h3>📋 Step 1 Status</h3>
        <div class="status-info">
          <div class="stat-item">
            <span class="label">Status:</span>
            <span class="value" :class="{ completed: store.isStep1Complete }">
              {{ store.isStep1Complete ? '✅ Completed' : '🔄 In Progress' }}
            </span>
          </div>
          <div class="stat-item">
            <span class="label">Total Transactions:</span>
            <span class="value">{{ store.getTodayStats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Completed:</span>
            <span class="value">{{ store.getTodayStats.completed }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Drafts:</span>
            <span class="value">{{ store.getTodayStats.drafts }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Total Amount:</span>
            <span class="value">{{ formatCurrency(store.getTodayStats.totalAmount) }}</span>
          </div>
        </div>
      </section>

      <!-- Transaction Form -->
      <section class="form-section">
        <TransactionForm
          :current-balance="store.currentBalance"
          :recorded-by="currentUser.uid"
          :recorded-by-name="currentUser.displayName"
          @submit="handleSubmitTransaction"
          @cancel="resetForm"
        />
      </section>

      <!-- Draft Transactions Panel -->
      <section v-if="store.hasDrafts" class="drafts-section">
        <h3 class="section-title">⚠️ Draft Transactions ({{ store.draftCount }})</h3>
        <p class="section-subtitle">
          These transactions need attention - complete or delete them before proceeding
        </p>

        <div class="drafts-grid">
          <div
            v-for="draft in store.getDraftTransactions"
            :key="draft.id"
            class="draft-card"
          >
            <div class="draft-header">
              <span class="transaction-type">{{ formatTransactionType(draft.transactionType) }}</span>
              <span class="draft-badge">DRAFT</span>
            </div>

            <div class="draft-details">
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">{{ formatCurrency(draft.amount) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reason:</span>
                <span class="value">{{ draft.draftReason || 'Not specified' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Shortfall:</span>
                <span class="value shortfall">
                  {{ formatCurrency(draft.amount - store.currentBalance.bankAccount) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">{{ formatTime(draft.datetime) }}</span>
              </div>
            </div>

            <div class="draft-actions">
              <!-- Complete Draft (if now sufficient balance) -->
              <button
                v-if="canCompleteDraft(draft)"
                class="btn btn-success"
                @click="handleCompleteDraft(draft.id)"
              >
                ✅ Complete Draft
              </button>

              <!-- Cannot complete (insufficient) -->
              <button v-else class="btn btn-disabled" disabled>
                ❌ Insufficient Balance
              </button>

              <!-- Delete Draft -->
              <button class="btn btn-danger" @click="handleDeleteDraft(draft.id)">
                🗑️ Delete
              </button>

              <!-- View Details -->
              <button class="btn btn-info" @click="handleViewDraft(draft)">
                👁️ View
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Transactions Table -->
      <section class="transactions-section">
        <h3 class="section-title">📊 Today's Transactions</h3>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            class="tab-button"
            :class="{ active: activeFilter === tab.value }"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
            <span class="count">{{ getFilteredCount(tab.value) }}</span>
          </button>
        </div>

        <!-- Transactions Table -->
        <div v-if="filteredTransactions.length > 0" class="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in filteredTransactions" :key="transaction.id">
                <td>{{ formatTime(transaction.datetime) }}</td>
                <td>{{ formatTransactionType(transaction.transactionType) }}</td>
                <td>{{ formatChannel(transaction.channel) }}</td>
                <td class="amount">{{ formatCurrency(transaction.amount) }}</td>
                <td>
                  <span class="status-badge" :class="transaction.status">
                    {{ transaction.status.toUpperCase() }}
                  </span>
                </td>
                <td>
                  <button class="btn-small" @click="handleViewTransaction(transaction)">
                    👁️
                  </button>
                  <button
                    v-if="transaction.status === 'draft'"
                    class="btn-small"
                    @click="handleEditTransaction(transaction)"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="transaction.status === 'draft'"
                    class="btn-small danger"
                    @click="handleDeleteTransaction(transaction.id)"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <p>No {{ activeFilter }} transactions recorded yet.</p>
        </div>
      </section>

      <!-- Complete Step 1 Button -->
      <section v-if="!store.isStep1Complete" class="actions-section">
        <button
          class="btn btn-primary btn-lg"
          :disabled="store.hasDrafts || store.getTodayStats.total === 0"
          @click="handleCompleteStep1"
        >
          ✅ Complete Step 1 & Proceed to Step 2
        </button>
        <small v-if="store.hasDrafts" class="warning-text">
          ⚠️ Please complete or delete all draft transactions before proceeding
        </small>
      </section>

      <!-- Already Completed -->
      <section v-else class="completed-section">
        <div class="alert alert-success">
          <h4>✅ Step 1 Completed</h4>
          <p>You can now proceed to Step 2 (Cash Verification)</p>
          <button class="btn btn-primary" @click="goToStep2">
            → Go to Step 2 (Cash Verification)
          </button>
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
  title: 'Money Transfer Service - Step 1: Transaction Recording',
})

const store = useMoneyTransferStore()
const router = useRouter()

// Get current user from auth store
const authStore = useAuthStore()
const currentUser = computed(() => ({
  uid: authStore.user?.uid || '',
  displayName: authStore.user?.displayName || 'Unknown',
}))

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const activeFilter = ref('all')

const filterTabs = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Failed', value: 'failed' },
]

/**
 * Get filtered transactions based on active filter
 */
const filteredTransactions = computed(() => {
  const txns = store.getTransactionsByDate(selectedDate.value)

  if (activeFilter.value === 'all') {
    return txns
  }

  return txns.filter((t: any) => t.status === activeFilter.value)
})

/**
 * Get count for a filter tab
 */
function getFilteredCount(status: string): number {
  const txns = store.getTransactionsByDate(selectedDate.value)

  if (status === 'all') {
    return txns.length
  }

  return txns.filter((t: any) => t.status === status).length
}

/**
 * Check if draft can be completed
 */
function canCompleteDraft(draft: any): boolean {
  return store.currentBalance.bankAccount >= draft.amount
}

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
  await store.fetchTransactionsByDate(selectedDate.value)
  await store.fetchDailySummary(selectedDate.value)
}

/**
 * Handle submit transaction
 */
async function handleSubmitTransaction(transactionData: any) {
  try {
    await store.createTransaction(transactionData)
    // Refresh transactions
    await store.fetchTransactionsByDate(selectedDate.value)
    // Show success message
    useNuxtData()
  } catch (error: any) {
    console.error('Failed to create transaction:', error)
  }
}

/**
 * Handle complete draft
 */
async function handleCompleteDraft(transactionId: string) {
  if (!confirm('Complete this draft transaction?')) return

  try {
    await store.completeDraftTransaction(transactionId)
    await store.fetchTransactionsByDate(selectedDate.value)
  } catch (error: any) {
    console.error('Failed to complete draft:', error)
  }
}

/**
 * Handle delete draft
 */
async function handleDeleteDraft(transactionId: string) {
  if (!confirm('Delete this draft transaction? This cannot be undone.')) return

  try {
    await store.deleteTransaction(transactionId)
    await store.fetchTransactionsByDate(selectedDate.value)
  } catch (error: any) {
    console.error('Failed to delete transaction:', error)
  }
}

/**
 * Handle view draft/transaction
 */
function handleViewDraft(transaction: any) {
  // TODO: Show transaction details modal
  console.log('View draft:', transaction)
}

/**
 * Handle view transaction
 */
function handleViewTransaction(transaction: any) {
  // TODO: Show transaction details modal
  console.log('View transaction:', transaction)
}

/**
 * Handle edit transaction
 */
function handleEditTransaction(transaction: any) {
  // TODO: Show edit modal
  console.log('Edit transaction:', transaction)
}

/**
 * Handle delete transaction
 */
async function handleDeleteTransaction(transactionId: string) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return

  try {
    await store.deleteTransaction(transactionId)
    await store.fetchTransactionsByDate(selectedDate.value)
  } catch (error: any) {
    console.error('Failed to delete transaction:', error)
  }
}

/**
 * Reset form
 */
function resetForm() {
  // Form automatically resets when submitted
}

/**
 * Handle complete Step 1
 */
async function handleCompleteStep1() {
  if (store.hasDrafts) {
    alert('Please complete or delete all draft transactions first.')
    return
  }

  if (store.getTodayStats.total === 0) {
    alert('Please create at least one transaction first.')
    return
  }

  try {
    await store.completeStep1(selectedDate.value)
    alert('Step 1 completed! Proceed to Step 2.')
  } catch (error: any) {
    console.error('Failed to complete Step 1:', error)
  }
}

/**
 * Go to Step 2
 */
function goToStep2() {
  router.push('/finance/money-transfer-service/step-2')
}

/**
 * Initialize component
 */
onMounted(async () => {
  await store.initializeStore()
  await store.fetchTransactionsByDate(selectedDate.value)
})
</script>

<style scoped lang="scss">
.step-1-container {
  max-width: 1200px;
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

  .balance-section {
    margin-bottom: 30px;
  }

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

    .status-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;

      .stat-item {
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

          &.completed {
            color: #28a745;
          }
        }
      }
    }
  }

  .form-section {
    margin-bottom: 30px;
  }

  .drafts-section {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;

    .section-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .section-subtitle {
      margin: 0 0 20px 0;
      color: #664d03;
      font-size: 14px;
    }

    .drafts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;

      .draft-card {
        background: white;
        border: 2px solid #ffc107;
        border-radius: 6px;
        padding: 15px;

        .draft-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .transaction-type {
            font-weight: 600;
            color: #212529;
          }

          .draft-badge {
            background: #dc3545;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
        }

        .draft-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;

          .detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;

            .label {
              color: #6c757d;
              font-weight: 600;
            }

            .value {
              color: #212529;
              font-weight: 600;

              &.shortfall {
                color: #dc3545;
              }
            }
          }
        }

        .draft-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .btn {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s ease;

            &.btn-success {
              background: #28a745;
              color: white;

              &:hover {
                background: #218838;
              }
            }

            &.btn-danger {
              background: #dc3545;
              color: white;

              &:hover {
                background: #c82333;
              }
            }

            &.btn-info {
              background: #17a2b8;
              color: white;

              &:hover {
                background: #138496;
              }
            }

            &.btn-disabled {
              background: #e9ecef;
              color: #6c757d;
              cursor: not-allowed;
            }
          }
        }
      }
    }
  }

  .transactions-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;

    .section-title {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e9ecef;

      .tab-button {
        padding: 12px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-weight: 600;
        color: #6c757d;
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;

        &:hover {
          color: #495057;
        }

        &.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
        }

        .count {
          margin-left: 6px;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 12px;
        }
      }
    }

    .transactions-table {
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
                font-weight: 600;
                color: #0d6efd;
              }

              .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;

                &.completed {
                  background: #d1e7dd;
                  color: #0f5132;
                }

                &.draft {
                  background: #fff3cd;
                  color: #664d03;
                }

                &.failed {
                  background: #f8d7da;
                  color: #842029;
                }
              }

              .btn-small {
                padding: 4px 8px;
                margin: 0 2px;
                background: #0d6efd;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;

                &:hover {
                  background: #0b5ed7;
                }

                &.danger {
                  background: #dc3545;

                  &:hover {
                    background: #c82333;
                  }
                }
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

  .actions-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;

    .btn-lg {
      padding: 16px 32px;
      font-size: 16px;
    }

    .warning-text {
      color: #dc3545;
      font-weight: 600;
    }
  }

  .completed-section {
    .alert-success {
      background: #d1e7dd;
      border: 1px solid #badbcc;
      color: #0f5132;
      padding: 20px;
      border-radius: 8px;

      h4 {
        margin: 0 0 10px 0;
      }

      p {
        margin: 0 0 15px 0;
      }
    }
  }

  .alert {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 30px;
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

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;

    &.btn-primary {
      background: #0d6efd;
      color: white;

      &:hover:not(:disabled) {
        background: #0b5ed7;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .step-1-container {
    padding: 12px;

    .page-header {
      padding: 20px;

      .page-title {
        font-size: 22px;
      }

      .page-description {
        font-size: 14px;
      }

      .date-selector {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .status-card .status-info {
      grid-template-columns: 1fr;
    }

    .drafts-section .drafts-grid {
      grid-template-columns: 1fr;
    }

    .transactions-section .transactions-table {
      font-size: 12px;

      table {
        th, td {
          padding: 8px;
        }
      }
    }
  }
}
</style>
