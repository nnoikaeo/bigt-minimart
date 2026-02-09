<template>
  <div class="owner-approval-container">
    <!-- Header -->
    <div class="page-header owner">
      <h1 class="page-title">👑 Owner Final Approval - Workflow 2.3</h1>
      <p class="page-description">
        อนุมัติหรือขอให้ปรับปรุงการดำเนินการประจำวัน - Approve or request corrections
      </p>

      <div class="date-selector">
        <label>Select Date to Approve:</label>
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
      <p>Loading approval data...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Workflow Complete Indicator -->
      <section class="workflow-complete">
        <div class="checkmark-icon">✅</div>
        <h3>All Steps Completed</h3>
        <p>Ready for final approval</p>
      </section>

      <!-- Summary Cards -->
      <section class="summary-cards">
        <!-- Transaction Summary -->
        <div class="summary-card">
          <h4>📊 Transactions</h4>
          <div class="card-content">
            <div class="stat">
              <span class="label">Total:</span>
              <span class="value">{{ store.currentSummary?.step1?.totalTransactions }}</span>
            </div>
            <div class="stat">
              <span class="label">Total Amount:</span>
              <span class="value">{{ formatCurrency(store.currentSummary?.step1?.totalAmount || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Verification Summary -->
        <div class="summary-card">
          <h4>💵 Cash Verification</h4>
          <div class="card-content">
            <div class="stat" :class="{ 'has-discrepancy': store.currentSummary?.step2?.hasDiscrepancies }">
              <span class="label">Discrepancy:</span>
              <span class="value">
                {{
                  store.currentSummary?.step2?.hasDiscrepancies
                    ? `⚠️ ${formatCurrency(store.currentSummary.step2.differences.total)}`
                    : '✅ No Discrepancies'
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- Audit Summary -->
        <div class="summary-card">
          <h4>🔍 Auditor Review</h4>
          <div class="card-content">
            <div class="stat">
              <span class="label">Result:</span>
              <span class="value result" :class="store.currentSummary?.auditorVerification?.auditResult">
                {{
                  {
                    no_issues: '✅ No Issues',
                    minor_issues: '⚠️ Minor Issues',
                    major_issues: '🔴 Major Issues',
                  }[store.currentSummary?.auditorVerification?.auditResult || '']
                }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Decision Form -->
      <section v-if="!store.isApproved" class="approval-form">
        <h3>👑 Owner Decision</h3>

        <div class="form-section">
          <h4 class="subsection-title">What is your decision?</h4>

          <div class="decision-options">
            <div class="option-card" :class="{ selected: decision === 'approve' }">
              <input
                id="approve"
                v-model="decision"
                type="radio"
                value="approve"
                class="radio-input"
              />
              <label for="approve" class="option-label">
                <div class="option-icon">✅</div>
                <div class="option-content">
                  <strong>Approve</strong>
                  <small>Accept and close this day's operations</small>
                </div>
              </label>
            </div>

            <div class="option-card" :class="{ selected: decision === 'approve_with_notes' }">
              <input
                id="approve-notes"
                v-model="decision"
                type="radio"
                value="approve_with_notes"
                class="radio-input"
              />
              <label for="approve-notes" class="option-label">
                <div class="option-icon">📝</div>
                <div class="option-content">
                  <strong>Approve with Notes</strong>
                  <small>Accept with additional comments</small>
                </div>
              </label>
            </div>

            <div class="option-card" :class="{ selected: decision === 'request_correction' }">
              <input
                id="correction"
                v-model="decision"
                type="radio"
                value="request_correction"
                class="radio-input"
              />
              <label for="correction" class="option-label">
                <div class="option-icon">🔄</div>
                <div class="option-content">
                  <strong>Request Correction</strong>
                  <small>Return to team for review and correction</small>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Owner Notes -->
        <div class="form-section">
          <label class="form-label">
            Owner Notes
            {{ decision !== 'approve' ? '(Required)' : '(Optional)' }}
          </label>
          <textarea
            v-model="ownerNotes"
            class="form-control"
            :placeholder="
              decision === 'request_correction'
                ? 'Please explain what needs to be corrected...'
                : 'Add any additional notes...'
            "
            rows="4"
            :required="decision !== 'approve'"
          />
        </div>

        <!-- Confirmation -->
        <div class="form-section confirmation">
          <div class="warning">
            <strong>⚠️ This is a final decision</strong>
            <p>Once submitted, this approval cannot be easily reversed. Please review all data carefully.</p>
          </div>

          <div class="checkbox-group">
            <input id="confirm" v-model="confirmed" type="checkbox" />
            <label for="confirm">I have reviewed all data and confirm this decision</label>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            class="btn btn-primary btn-lg"
            :disabled="!confirmed || isSubmitting || (decision !== 'approve' && !ownerNotes.trim())"
            @click="handleSubmitApproval"
          >
            <span v-if="isSubmitting" class="spinner-small" />
            {{ isSubmitting ? 'Submitting...' : 'Submit Final Decision' }}
          </button>

          <button class="btn btn-secondary" @click="goBackToAudit">← Back to Auditor Review</button>
        </div>
      </section>

      <!-- Already Approved -->
      <section v-else class="approval-completed">
        <div class="completed-header">
          <div class="check-icon">✅</div>
          <h3>Operations Approved</h3>
        </div>

        <div class="approval-details">
          <div class="detail-row">
            <span class="label">Decision:</span>
            <span class="value">
              {{
                {
                  approve: 'Approved',
                  approve_with_notes: 'Approved with Notes',
                  correction_requested: 'Correction Requested',
                }[store.currentSummary?.ownerApproval?.decision || '']
              }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Approved By:</span>
            <span class="value">{{ store.currentSummary?.ownerApproval?.completedByName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Approved At:</span>
            <span class="value">{{ formatDateTime(store.currentSummary?.ownerApproval?.completedAt) }}</span>
          </div>
          <div v-if="store.currentSummary?.ownerApproval?.ownerNotes" class="detail-row notes">
            <span class="label">Owner Notes:</span>
            <p class="value">{{ store.currentSummary.ownerApproval.ownerNotes }}</p>
          </div>
        </div>

        <div v-if="store.currentSummary?.ownerApproval?.decision === 'approve'" class="alert alert-success">
          <strong>✅ Operations Successfully Closed</strong>
          <p>This day's money transfer operations have been completed and approved.</p>
        </div>

        <div v-if="store.currentSummary?.ownerApproval?.decision === 'approval_with_notes'" class="alert alert-info">
          <strong>📝 Approved with Notes</strong>
          <p>Operations approved with owner comments. Please review the notes above.</p>
        </div>

        <div v-if="store.currentSummary?.ownerApproval?.decision === 'correction_requested'" class="alert alert-warning">
          <strong>🔄 Correction Requested</strong>
          <p>Please return to the team and make the necessary corrections.</p>
        </div>
      </section>

      <!-- Data Review Section -->
      <section class="review-section">
        <h3>📖 Complete Review Summary</h3>

        <!-- Step 1 Summary -->
        <div class="review-card">
          <h4>Step 1: Transaction Recording</h4>
          <div class="review-details">
            <div v-if="store.currentSummary?.step1" class="details-list">
              <div class="item">
                <span class="label">Recorded By:</span>
                <span class="value">{{ store.currentSummary.step1.completedByName }}</span>
              </div>
              <div class="item">
                <span class="label">Total Transactions:</span>
                <span class="value">{{ store.currentSummary.step1.totalTransactions }}</span>
              </div>
              <div class="item">
                <span class="label">Total Amount:</span>
                <span class="value">{{ formatCurrency(store.currentSummary.step1.totalAmount) }}</span>
              </div>
              <div class="item">
                <span class="label">Completed At:</span>
                <span class="value">{{ formatDateTime(store.currentSummary.step1.completedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2 Summary -->
        <div class="review-card">
          <h4>Step 2: Cash Verification</h4>
          <div v-if="store.currentSummary?.step2" class="review-details">
            <div class="details-list">
              <div class="item">
                <span class="label">Verified By:</span>
                <span class="value">{{ store.currentSummary.step2.completedByName }}</span>
              </div>
              <div class="item">
                <span class="label">Expected Cash:</span>
                <span class="value">{{ formatCurrency(store.currentSummary.step2.expectedCash.total) }}</span>
              </div>
              <div class="item">
                <span class="label">Actual Cash:</span>
                <span class="value">{{ formatCurrency(store.currentSummary.step2.actualCash.total) }}</span>
              </div>
              <div class="item" :class="{ 'has-discrepancy': store.currentSummary.step2.hasDiscrepancies }">
                <span class="label">Discrepancy:</span>
                <span class="value">
                  {{
                    store.currentSummary.step2.hasDiscrepancies
                      ? `⚠️ ${formatCurrency(store.currentSummary.step2.differences.total)}`
                      : '✅ None'
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Auditor Review Summary -->
        <div class="review-card">
          <h4>Workflow 2.2: Auditor Review</h4>
          <div v-if="store.currentSummary?.auditorVerification" class="review-details">
            <div class="details-list">
              <div class="item">
                <span class="label">Auditor:</span>
                <span class="value">{{ store.currentSummary.auditorVerification.completedByName }}</span>
              </div>
              <div class="item">
                <span class="label">Transactions Verified:</span>
                <span class="value">{{ store.currentSummary.auditorVerification.transactionsVerified }}</span>
              </div>
              <div class="item">
                <span class="label">Result:</span>
                <span class="value result" :class="store.currentSummary.auditorVerification.auditResult">
                  {{
                    {
                      no_issues: '✅ No Issues',
                      minor_issues: '⚠️ Minor Issues',
                      major_issues: '🔴 Major Issues',
                    }[store.currentSummary.auditorVerification.auditResult]
                  }}
                </span>
              </div>
              <div v-if="store.currentSummary.auditorVerification.auditNotes" class="item notes">
                <span class="label">Audit Notes:</span>
                <p class="value">{{ store.currentSummary.auditorVerification.auditNotes }}</p>
              </div>
            </div>
          </div>
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
  title: 'Owner Final Approval - Workflow 2.3',
})

const store = useMoneyTransferStore()
const router = useRouter()

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])
const decision = ref('')
const ownerNotes = ref('')
const confirmed = ref(false)
const isSubmitting = ref(false)

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
  await store.fetchTransactionsByDate(selectedDate.value)
  await store.fetchDailySummary(selectedDate.value)

  // Load existing approval if available
  if (store.currentSummary?.ownerApproval) {
    decision.value = store.currentSummary.ownerApproval.decision
    ownerNotes.value = store.currentSummary.ownerApproval.ownerNotes || ''
  } else {
    decision.value = ''
    ownerNotes.value = ''
  }
  confirmed.value = false
}

/**
 * Handle submit approval
 */
async function handleSubmitApproval() {
  if (!confirmed.value || !decision.value) return
  if (decision.value !== 'approve' && !ownerNotes.value.trim()) return

  isSubmitting.value = true

  try {
    await store.submitOwnerApproval(selectedDate.value, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: 'owner-id',
      completedByName: 'Owner',
      decision: decision.value,
      ownerNotes: ownerNotes.value,
    })

    alert('Approval submitted successfully!')
  } catch (error: any) {
    console.error('Failed to submit approval:', error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Go back to Auditor Review
 */
function goBackToAudit() {
  router.push('/finance/money-transfer-service/auditor-review')
}

/**
 * Initialize component
 */
onMounted(async () => {
  await store.initializeStore()
  await store.fetchTransactionsByDate(selectedDate.value)
  await store.fetchDailySummary(selectedDate.value)
})
</script>

<style scoped lang="scss">
.owner-approval-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

  .page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 30px;

    &.owner {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }

  .workflow-complete {
    text-align: center;
    padding: 40px;
    background: #d1e7dd;
    border: 1px solid #badbcc;
    border-radius: 8px;
    margin-bottom: 30px;

    .checkmark-icon {
      font-size: 60px;
      margin-bottom: 15px;
    }

    h3 {
      margin: 0 0 8px 0;
      color: #0f5132;
      font-size: 24px;
    }

    p {
      margin: 0;
      color: #0f5132;
      font-weight: 600;
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .summary-card {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;

      h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .stat {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;

          .label {
            font-weight: 600;
            color: #495057;
            font-size: 13px;
          }

          .value {
            font-weight: 700;
            color: #212529;

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

          &.has-discrepancy {
            background: #fff3cd;
          }
        }
      }
    }
  }

  .approval-form {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;

    h3 {
      margin: 0 0 25px 0;
      font-size: 20px;
      font-weight: 600;
    }

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

      .decision-options {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .option-card {
          position: relative;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          padding: 15px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0d6efd;
            background: #f8f9fa;
          }

          &.selected {
            border-color: #0d6efd;
            background: #e7f1ff;
          }

          .radio-input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
          }

          .option-label {
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;

            .option-icon {
              font-size: 24px;
            }

            .option-content {
              display: flex;
              flex-direction: column;
              gap: 4px;

              strong {
                color: #212529;
                font-size: 15px;
              }

              small {
                color: #6c757d;
                font-size: 13px;
              }
            }
          }
        }
      }

      .form-label {
        display: block;
        font-weight: 600;
        color: #212529;
        margin-bottom: 10px;
        font-size: 14px;
      }

      .form-control {
        width: 100%;
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

      &.confirmation {
        background: #fff3cd;
        border: 1px solid #ffecb5;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 0;
        border-bottom: none;

        .warning {
          margin-bottom: 15px;

          strong {
            display: block;
            color: #664d03;
            margin-bottom: 5px;
          }

          p {
            margin: 0;
            color: #664d03;
            font-size: 14px;
          }
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;

          input {
            cursor: pointer;
          }

          label {
            cursor: pointer;
            color: #664d03;
            font-weight: 600;
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

  .approval-completed {
    background: #d1e7dd;
    border: 1px solid #badbcc;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 30px;

    .completed-header {
      text-align: center;
      margin-bottom: 25px;

      .check-icon {
        font-size: 60px;
        display: block;
        margin-bottom: 15px;
      }

      h3 {
        margin: 0;
        color: #0f5132;
        font-size: 24px;
      }
    }

    .approval-details {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #e9ecef;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          color: #495057;
        }

        .value {
          color: #212529;
          font-weight: 600;

          &.result {
            &.approve {
              color: #28a745;
            }

            &.approve_with_notes {
              color: #0d6efd;
            }

            &.correction_requested {
              color: #ffc107;
            }
          }
        }

        &.notes {
          flex-direction: column;
          gap: 8px;

          .value {
            margin: 0;
            font-weight: normal;
            white-space: pre-wrap;
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

      &.alert-success {
        background: #d1e7dd;
        color: #0f5132;
        border: 1px solid #badbcc;
      }

      &.alert-info {
        background: #cfe2ff;
        color: #084298;
        border: 1px solid #b6d4fe;
      }

      &.alert-warning {
        background: #fff3cd;
        color: #664d03;
        border: 1px solid #ffecb5;
      }
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

  .review-section {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 25px;

    h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .review-card {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      h4 {
        margin: 0 0 12px 0;
        font-size: 15px;
        font-weight: 600;
      }

      .review-details {
        .details-list {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 8px;
            background: white;
            border-radius: 4px;
            font-size: 14px;

            .label {
              font-weight: 600;
              color: #495057;
            }

            .value {
              color: #212529;
              text-align: right;

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

            &.has-discrepancy .value {
              color: #ffc107;
              font-weight: 700;
            }

            &.notes {
              flex-direction: column;
              gap: 8px;

              .value {
                margin: 0;
                text-align: left;
                white-space: pre-wrap;
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
  .owner-approval-container {
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

    .summary-cards {
      grid-template-columns: 1fr;
    }

    .approval-form .form-section .decision-options .option-card .option-label {
      flex-direction: column;
      text-align: center;

      .option-icon {
        font-size: 32px;
      }
    }

    .review-section .review-card .review-details .details-list .item {
      flex-direction: column;

      .value {
        text-align: left !important;
      }
    }
  }
}
</style>
