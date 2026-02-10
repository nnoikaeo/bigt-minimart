<template>
  <div class="auditor-review-container">
    <!-- Header -->
    <div class="page-header auditor">
      <h1 class="page-title">🔍 Auditor Review - Workflow 2.2: Transaction Verification</h1>
      <p class="page-description">
        ตรวจสอบความถูกต้องของธุรกรรมและเปรียบเทียบกับสถานะบัญชี
      </p>

      <div class="date-selector">
        <label>Select Date to Review:</label>
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
      <p>Loading audit data...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Workflow Progress -->
      <section class="workflow-progress">
        <div class="progress-step completed">
          <div class="step-marker">✅</div>
          <div class="step-label">Step 1<br>Recording</div>
        </div>
        <div class="progress-line completed" />
        <div class="progress-step completed">
          <div class="step-marker">✅</div>
          <div class="step-label">Step 2<br>Verification</div>
        </div>
        <div class="progress-line active" />
        <div class="progress-step active">
          <div class="step-marker">2.2</div>
          <div class="step-label">Auditor<br>Review</div>
        </div>
        <div class="progress-line pending" />
        <div class="progress-step pending">
          <div class="step-marker">2.3</div>
          <div class="step-label">Owner<br>Approval</div>
        </div>
      </section>

      <!-- Manager Summary -->
      <section class="manager-summary">
        <h3>📋 Manager Summary (Step 1 & 2)</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Total Transactions:</span>
            <span class="value">{{ store.currentSummary?.step1?.totalTransactions || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Amount:</span>
            <span class="value">{{
              formatCurrency(store.currentSummary?.step1?.totalAmount || 0)
            }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Cash Discrepancy:</span>
            <span
              class="value"
              :class="{
                'no-discrepancy': !store.currentSummary?.step2?.hasDiscrepancies,
              }"
            >
              {{
                store.currentSummary?.step2?.hasDiscrepancies
                  ? `⚠️ ${formatCurrency(store.currentSummary.step2.differences.total)}`
                  : '✅ No Discrepancies'
              }}
            </span>
          </div>
        </div>
      </section>

      <!-- Audit Form -->
      <section v-if="!store.isAudited" class="audit-form-section">
        <h3>🔍 Auditor Verification Form</h3>

        <div class="form-section">
          <h4 class="subsection-title">Transaction Verification</h4>

          <div class="input-group">
            <label class="form-label">
              Total Transactions Verified
              <span class="required">*</span>
            </label>
            <input
              v-model.number="auditData.transactionsVerified"
              type="number"
              class="form-control"
              :max="store.currentSummary?.step1?.totalTransactions || 0"
              required
            />
            <small>
              Out of {{ store.currentSummary?.step1?.totalTransactions || 0 }} total transactions
            </small>
          </div>

          <div class="input-group">
            <label class="form-label">Transactions with Issues</label>
            <input
              v-model.number="auditData.transactionsWithIssues"
              type="number"
              class="form-control"
              min="0"
              :max="auditData.transactionsVerified"
            />
          </div>
        </div>

        <div class="form-section">
          <h4 class="subsection-title">Bank Statement Verification</h4>

          <div class="checkbox-group">
            <div class="checkbox-item">
              <input
                id="bank-verified"
                v-model="auditData.bankStatementVerified"
                type="checkbox"
              />
              <label for="bank-verified">Bank statement has been reviewed</label>
            </div>

            <div class="checkbox-item">
              <input id="balance-matches" v-model="auditData.bankBalanceMatches" type="checkbox" />
              <label for="balance-matches">Actual bank balance matches system expected balance</label>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="subsection-title">Audit Result & Notes</h4>

          <div class="input-group">
            <label class="form-label">
              Audit Result
              <span class="required">*</span>
            </label>
            <select v-model="auditData.auditResult" class="form-control" required>
              <option value="">-- Select Result --</option>
              <option value="no_issues">✅ No Issues</option>
              <option value="minor_issues">⚠️ Minor Issues</option>
              <option value="major_issues">🔴 Major Issues</option>
            </select>
          </div>

          <div class="input-group">
            <label class="form-label">
              Audit Notes
              <span class="required">*</span>
            </label>
            <textarea
              v-model="auditData.auditNotes"
              class="form-control"
              placeholder="Detailed audit findings and observations..."
              rows="4"
              required
            />
          </div>

          <div v-if="auditData.auditResult !== 'no_issues'" class="input-group">
            <label class="form-label">Issues Found (List each issue)</label>
            <textarea
              v-model="auditData.issuesFoundText"
              class="form-control"
              placeholder="Enter each issue on a new line..."
              rows="3"
            />
            <small>Issues will be extracted for follow-up</small>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            class="btn btn-primary btn-lg"
            :disabled="isSubmitting || !isFormValid"
            @click="handleSubmitAudit"
          >
            <span v-if="isSubmitting" class="spinner-small" />
            {{ isSubmitting ? 'Submitting...' : '✅ Submit Audit Verification' }}
          </button>

          <button class="btn btn-secondary" @click="goBackToStep2">← Back to Step 2</button>
        </div>
      </section>

      <!-- Audit Already Completed -->
      <section v-else class="audit-completed">
        <h3>✅ Audit Completed</h3>

        <div class="audit-summary">
          <div class="summary-row">
            <span class="label">Auditor:</span>
            <span class="value">{{ store.currentSummary?.auditorVerification?.completedByName }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Completed At:</span>
            <span class="value">{{ formatDateTime(store.currentSummary?.auditorVerification?.completedAt) }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Transactions Verified:</span>
            <span class="value">{{ store.currentSummary?.auditorVerification?.transactionsVerified }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Issues Found:</span>
            <span class="value">{{ store.currentSummary?.auditorVerification?.transactionsWithIssues }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Bank Statement Verified:</span>
            <span class="value">{{
              store.currentSummary?.auditorVerification?.bankStatementVerified
                ? '✅ Yes'
                : '❌ No'
            }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Balance Matches:</span>
            <span class="value">{{
              store.currentSummary?.auditorVerification?.bankBalanceMatches ? '✅ Yes' : '❌ No'
            }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Audit Result:</span>
            <span class="value result" :class="store.currentSummary?.auditorVerification?.auditResult">
              {{
                {
                  no_issues: '✅ No Issues',
                  minor_issues: '⚠️ Minor Issues',
                  major_issues: '🔴 Major Issues',
                }[(store.currentSummary?.auditorVerification?.auditResult as 'no_issues' | 'minor_issues' | 'major_issues') || ''] || '-'
              }}
            </span>
          </div>
          <div v-if="store.currentSummary?.auditorVerification?.auditNotes" class="summary-notes">
            <strong>Audit Notes:</strong>
            <p>{{ store.currentSummary.auditorVerification.auditNotes }}</p>
          </div>
          <div
            v-if="store.currentSummary?.auditorVerification?.issuesFound?.length"
            class="summary-issues"
          >
            <strong>Issues Found:</strong>
            <ul>
              <li v-for="(issue, idx) in store.currentSummary.auditorVerification.issuesFound"
                :key="idx"
              >
                {{ issue }}
              </li>
            </ul>
          </div>
        </div>

        <p class="next-step">Ready for owner approval (Workflow 2.3)</p>

        <button class="btn btn-primary" @click="goToOwnerApproval">
          → Go to Owner Approval
        </button>
      </section>

      <!-- Transaction Details Reference -->
      <section class="reference-section">
        <h3>📖 Transaction Details (Reference)</h3>

        <div class="transactions-reference">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="transaction in completedTransactions"
                :key="transaction.id"
              >
                <td>{{ formatTime(transaction.datetime) }}</td>
                <td>{{ formatTransactionType(transaction.transactionType) }}</td>
                <td class="amount">{{ formatCurrency(transaction.amount) }}</td>
                <td class="amount">{{ formatCurrency(transaction.commission || 0) }}</td>
                <td>
                  <span class="badge">{{ transaction.status.toUpperCase() }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Error Message -->
      <div v-if="store.error" class="alert alert-danger">
        {{ store.error }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'

definePageMeta({
  middleware: 'auth',
  title: 'Auditor Review - Workflow 2.2',
})

const store = useMoneyTransferStore()
const router = useRouter()

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const isSubmitting = ref(false)

const auditData = ref({
  transactionsVerified: 0,
  transactionsWithIssues: 0,
  bankStatementVerified: false,
  bankBalanceMatches: false,
  auditNotes: '',
  auditResult: '',
  issuesFoundText: '',
  issuesFound: [] as string[],
})

/**
 * Check if form is valid
 */
const isFormValid = computed(() => {
  return (
    auditData.value.transactionsVerified > 0 &&
    auditData.value.auditResult &&
    auditData.value.auditNotes
  )
})

/**
 * Get completed transactions
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
 * Format date and time
 */
function formatDateTime(dt?: string | Date): string {
  if (!dt) return '-'
  const date = new Date(dt)
  return date.toLocaleString('th-TH')
}

/**
 * Handle date change
 */
async function handleDateChange() {
  if (!selectedDate.value) return
  await store.fetchTransactionsByDate(selectedDate.value)
  await store.fetchDailySummary(selectedDate.value)

  // Load existing audit data if available
  if (store.currentSummary?.auditorVerification) {
    const audit = store.currentSummary.auditorVerification
    auditData.value.transactionsVerified = audit.transactionsVerified
    auditData.value.transactionsWithIssues = audit.transactionsWithIssues
    auditData.value.bankStatementVerified = audit.bankStatementVerified
    auditData.value.bankBalanceMatches = audit.bankBalanceMatches ?? false
    auditData.value.auditNotes = audit.auditNotes
    auditData.value.auditResult = audit.auditResult
    auditData.value.issuesFound = audit.issuesFound || []
  }
}

/**
 * Handle submit audit
 */
async function handleSubmitAudit() {
  if (!isFormValid.value || !selectedDate.value) return

  isSubmitting.value = true

  try {
    // Parse issues from textarea
    const issuesFound: string[] = auditData.value.issuesFoundText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)

    await store.submitAudit(selectedDate.value, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: 'auditor-id',
      completedByName: 'Auditor',
      transactionsVerified: auditData.value.transactionsVerified,
      transactionsWithIssues: auditData.value.transactionsWithIssues,
      bankStatementVerified: auditData.value.bankStatementVerified,
      bankBalanceMatches: auditData.value.bankBalanceMatches ?? false,
      auditNotes: auditData.value.auditNotes,
      issuesFound,
      auditResult: auditData.value.auditResult as 'no_issues' | 'minor_issues' | 'major_issues',
    })

    alert('Audit submitted! Ready for owner approval.')
  } catch (error: any) {
    console.error('Failed to submit audit:', error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Go back to Step 2
 */
function goBackToStep2() {
  router.push('/finance/money-transfer-service/step-2')
}

/**
 * Go to Owner Approval
 */
function goToOwnerApproval() {
  router.push('/finance/money-transfer-service/owner-approval')
}

/**
 * Initialize component
 */
onMounted(async () => {
  await store.initializeStore()
  if (selectedDate.value) {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
  }
})
</script>

<style scoped lang="scss">
.auditor-review-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

  .page-header {
    background: linear-gradient(135deg, #17a2b8 0%, #0f6a7e 100%);
    color: white;
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 30px;

    &.auditor {
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    }

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
      border-top: 4px solid #ffc107;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }

  .workflow-progress {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
    padding: 20px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;

      .step-marker {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: 700;
        font-size: 18px;
        background: #e9ecef;
        color: #6c757d;
      }

      .step-label {
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        color: #6c757d;
      }

      &.completed {
        .step-marker {
          background: #d1e7dd;
          color: #0f5132;
        }

        .step-label {
          color: #0f5132;
        }
      }

      &.active {
        .step-marker {
          background: #fff3cd;
          color: #664d03;
        }

        .step-label {
          color: #664d03;
          font-weight: 700;
        }
      }

      &.pending {
        .step-marker {
          background: #e9ecef;
          color: #6c757d;
        }
      }
    }

    .progress-line {
      flex: 1;
      height: 3px;
      background: #e9ecef;
      margin: 0 10px;

      &.completed {
        background: #28a745;
      }

      &.active {
        background: #ffc107;
      }
    }
  }

  .manager-summary,
  .audit-form-section,
  .reference-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;

    h3,
    h4 {
      margin: 0 0 15px 0;
      font-weight: 600;
    }

    h3 {
      font-size: 18px;
    }

    h4 {
      font-size: 16px;
      color: #495057;
    }

    .summary-grid {
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
        }

        .value {
          font-weight: 700;
          color: #212529;

          &.no-discrepancy {
            color: #28a745;
          }
        }
      }
    }
  }

  .audit-form-section {
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
        color: #495057;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 15px;

        &:last-child {
          margin-bottom: 0;
        }

        .form-label {
          font-weight: 600;
          color: #212529;
          font-size: 14px;

          .required {
            color: #dc3545;
            margin-left: 2px;
          }
        }

        .form-control,
        textarea {
          padding: 10px 12px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;

          &:focus {
            outline: none;
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          }
        }

        textarea {
          resize: vertical;
        }

        small {
          font-size: 12px;
          color: #6c757d;
        }
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;

          input {
            cursor: pointer;
          }

          label {
            cursor: pointer;
            font-size: 14px;
            color: #212529;
          }
        }
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
  }

  .audit-completed {
    background: #d1e7dd;
    border: 1px solid #badbcc;
    border-radius: 8px;
    padding: 25px;

    h3 {
      margin: 0 0 20px 0;
      color: #0f5132;
    }

    .audit-summary {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #e9ecef;
        font-size: 14px;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #495057;
          font-weight: 600;
        }

        .value {
          color: #212529;
          font-weight: 600;

          &.result {
            &.no_issues {
              color: #28a745;
            }

            &.minor_issues {
              color: #ffc107;
            }

            &.major_issues {
              color: #dc3545;
            }
          }
        }
      }

      .summary-notes,
      .summary-issues {
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

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 4px;
          }
        }
      }
    }

    .next-step {
      margin: 0 0 15px 0;
      color: #0f5132;
      font-weight: 600;
    }

    .btn {
      padding: 12px 24px;
      background: #0d6efd;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;

      &:hover {
        background: #0b5ed7;
      }
    }
  }

  .reference-section {
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

              .badge {
                background: #e9ecef;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: 600;
              }
            }
          }
        }
      }
    }
  }

  .alert {
    padding: 15px;
    border-radius: 8px;
    margin-top: 20px;

    &.alert-danger {
      background: #f8d7da;
      color: #842029;
      border: 1px solid #f5c2c7;
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .auditor-review-container {
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

    .workflow-progress {
      flex-wrap: wrap;

      .progress-line {
        display: none;
      }
    }

    .manager-summary .summary-grid {
      grid-template-columns: 1fr;
    }

    .audit-form-section .form-section .input-group {
      .form-control,
      textarea {
        font-size: 16px;
      }
    }
  }
}
</style>
