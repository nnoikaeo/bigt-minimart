<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS } from '~/types/permissions'
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('AuditorReview')
const store = useMoneyTransferStore()
const router = useRouter()
const route = useRoute()
usePermissions()

// ─── State ───────────────────────────────────────────────────────────────────
const selectedDate = ref<string>(
  (route.query.date as string) || (new Date().toISOString().split('T')[0] ?? '')
)
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Per-transaction verification status (txn.id → verified | issue)
const txnVerifyStatus = ref<Record<string, 'verified' | 'issue'>>({})

// Bank balance verification
const bankBalanceVerified = ref(false)
const bankStatementAmount = ref<number>(0)

// Step 2 cash count verification
const cashCountVerified = ref(false)

// Audit findings
const issuesFound = ref<'none' | 'minor' | 'major' | ''>('')
const auditNotes = ref('')
const issueDetails = ref('')

// Transaction verify detail modal
const showVerifyModal = ref(false)
const verifyingTransaction = ref<any>(null)

// Reject confirm
const showRejectConfirm = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────
const completedTransactions = computed(() =>
  store.getTransactionsByDate(selectedDate.value)
    .filter((t: any) => t.status === 'completed' || t.status === 'failed')
)

const allTxnsVerified = computed(() =>
  completedTransactions.value.length > 0 &&
  completedTransactions.value.every((t: any) => txnVerifyStatus.value[t.id])
)

const canSubmit = computed(() =>
  allTxnsVerified.value &&
  bankBalanceVerified.value &&
  cashCountVerified.value &&
  issuesFound.value !== ''
)

const managerStep1Data = computed(() => store.currentSummary?.step1)
const step2Data = computed(() => store.currentSummary?.step2)

const expectedBankBalance = computed(() =>
  store.currentBalance?.bankAccount ?? 0
)

const bankBalanceDiff = computed(() =>
  bankStatementAmount.value - expectedBankBalance.value
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ฿'
}

function formatTime(datetime: string | Date): string {
  return new Date(datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function getTransactionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    transfer: 'โอนเงิน',
    withdrawal: 'ถอนเงิน',
    owner_deposit: 'เจ้าของฝากเงิน',
  }
  return map[type] || type
}

function getChannelLabel(channel?: string): string {
  if (!channel) return '-'
  const map: Record<string, string> = { promptpay: 'PromptPay', bank: 'โอนธนาคาร', other: 'อื่นๆ' }
  return map[channel] || channel
}

function getBankImpactLabel(txn: any): string {
  if (txn.transactionType === 'transfer') return `-${formatCurrency(txn.amount)} (โอนออก)`
  if (txn.transactionType === 'withdrawal') return `+${formatCurrency(txn.amount)} (ถอนออก)`
  if (txn.transactionType === 'owner_deposit') return `+${formatCurrency(txn.amount)} (ฝากเข้า)`
  return '-'
}

function markTxnVerified(txnId: string) {
  txnVerifyStatus.value = { ...txnVerifyStatus.value, [txnId]: 'verified' }
}

function markTxnIssue(txnId: string) {
  txnVerifyStatus.value = { ...txnVerifyStatus.value, [txnId]: 'issue' }
}

function openVerifyModal(txn: any) {
  verifyingTransaction.value = txn
  showVerifyModal.value = true
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
    // Reset verification state
    txnVerifyStatus.value = {}
    bankBalanceVerified.value = false
    cashCountVerified.value = false
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
}

async function handleApproveAudit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    await store.submitAudit(selectedDate.value, {
      auditNotes: auditNotes.value,
      issuesFound: issuesFound.value,
      issueDetails: issueDetails.value,
      bankStatementAmount: bankStatementAmount.value,
      result: issuesFound.value === 'none' ? 'no_issues' : 'issues_found',
    })
    successMessage.value = 'Audit เสร็จสมบูรณ์ — ส่งให้ Owner อนุมัติได้เลย'
    logger.log('Audit completed')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete audit', err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleRejectAudit() {
  isSubmitting.value = true
  try {
    await store.submitAudit(selectedDate.value, {
      auditNotes: auditNotes.value,
      issueDetails: issueDetails.value || 'Rejected by Auditor',
      result: 'rejected',
    })
    successMessage.value = 'ส่งคืน Manager เพื่อแก้ไขแล้ว'
    showRejectConfirm.value = false
    logger.log('Audit rejected')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to reject audit', err)
  } finally {
    isSubmitting.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.initializeStore()
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
})
</script>

<template>
  <PageWrapper
    title="ตรวจสอบ Auditor (WF 2.2)"
    description="Cross-check รายการกับ Bank Statement และยืนยันความถูกต้อง"
    icon="🔍"
    :loading="store.isLoading"
    :error="store.error"
  >
    <template #actions>
      <BaseButton variant="secondary" size="sm" @click="router.push('/finance/money-transfer-history')">
        ← ประวัติ
      </BaseButton>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">วันที่:</label>
        <input
          v-model="selectedDate"
          type="date"
          class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
          @change="handleDateChange"
        />
      </div>
    </template>

    <BaseAlert v-if="successMessage" variant="success" :message="successMessage" :auto-close="true" class="mb-4" @close="successMessage = ''" />
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <!-- Prerequisite: Step 2 must be complete -->
    <BaseAlert
      v-if="!store.isStep2Complete"
      variant="warning"
      title="Step 2 ยังไม่เสร็จสมบูรณ์"
      message="กรุณารอให้ Manager ดำเนินการ Step 2 ก่อน"
      :dismissible="false"
      class="mb-6"
    />

    <!-- Already Audited -->
    <template v-if="store.isAudited">
      <BaseAlert
        variant="success"
        title="Audit เสร็จสมบูรณ์"
        message="ส่งให้ Owner อนุมัติแล้ว"
        :dismissible="false"
        class="mb-6"
      />
      <div class="flex justify-center">
        <BaseButton variant="primary" size="lg" @click="router.push('/finance/money-transfer-history')">
          กลับหน้าประวัติ →
        </BaseButton>
      </div>
    </template>

    <template v-else-if="store.isStep2Complete">
      <!-- ── Manager's Data Summary ────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-700 mb-3">📊 ข้อมูลจาก Manager (Step 1 & 2)</h2>
        <div class="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          <!-- Step 1 info -->
          <div class="p-4">
            <div class="text-sm font-semibold text-gray-700 mb-2">Step 1: รายการที่บันทึก</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div class="text-gray-500">รายการทั้งหมด</div>
                <div class="font-bold text-gray-900">{{ managerStep1Data?.totalTransactions ?? completedTransactions.length }} รายการ</div>
              </div>
              <div>
                <div class="text-gray-500">สำเร็จ</div>
                <div class="font-bold text-green-700">{{ managerStep1Data?.completedTransactions ?? completedTransactions.filter((t: any) => t.status === 'completed').length }} รายการ</div>
              </div>
              <div>
                <div class="text-gray-500">ยอดรวม</div>
                <div class="font-bold text-gray-900">{{ formatCurrency(managerStep1Data?.totalAmount ?? 0) }}</div>
              </div>
              <div>
                <div class="text-gray-500">ค่าบริการรวม</div>
                <div class="font-bold text-green-700">{{ formatCurrency(managerStep1Data?.totalCommission ?? 0) }}</div>
              </div>
            </div>
          </div>

          <!-- Step 2 cash verification -->
          <div class="p-4">
            <div class="text-sm font-semibold text-gray-700 mb-2">Step 2: ผลการตรวจนับ</div>
            <div v-if="step2Data" class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <CheckCircleIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span class="text-gray-600">เงินสดโอน/ถอน: <strong>{{ formatCurrency(step2Data.actualCash?.transferWithdrawal ?? 0) }}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <CheckCircleIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span class="text-gray-600">ค่าบริการเงินสด: <strong>{{ formatCurrency(step2Data.actualCash?.serviceFee ?? 0) }}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <component
                  :is="step2Data.hasDiscrepancies ? ExclamationTriangleIcon : CheckCircleIcon"
                  :class="step2Data.hasDiscrepancies ? 'w-4 h-4 text-amber-500 flex-shrink-0' : 'w-4 h-4 text-green-500 flex-shrink-0'"
                />
                <span class="text-gray-600">
                  {{ step2Data.hasDiscrepancies ? '⚠️ พบผลต่าง' : '✅ ตรงกัน' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Verification Checklist ────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-700 mb-3">🔐 Checklist การตรวจสอบ</h2>

        <!-- 1. Verify each transaction -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-gray-800">☐ ตรวจสอบรายการธุรกรรม ({{ completedTransactions.length }} รายการ)</span>
              <BaseBadge
                :variant="allTxnsVerified ? 'success' : 'default'"
                size="sm"
              >
                {{ Object.keys(txnVerifyStatus).length }}/{{ completedTransactions.length }} ตรวจแล้ว
              </BaseBadge>
            </div>
          </div>

          <div class="divide-y divide-gray-100">
            <div
              v-for="(txn, idx) in completedTransactions"
              :key="txn.id"
              :class="[
                'p-4 transition-colors',
                txnVerifyStatus[txn.id] === 'verified' ? 'bg-green-50' : '',
                txnVerifyStatus[txn.id] === 'issue' ? 'bg-red-50' : '',
              ]"
            >
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <!-- Transaction info -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-gray-500">#{{ Number(idx) + 1 }}</span>
                    <span class="font-medium text-gray-900">{{ getTransactionTypeLabel(txn.transactionType) }}</span>
                    <BaseBadge v-if="txn.status === 'failed'" variant="error" size="sm">ล้มเหลว</BaseBadge>
                    <span class="text-gray-500 text-sm">{{ formatTime(txn.datetime) }}</span>
                  </div>
                  <div class="text-sm text-gray-600 space-y-0.5">
                    <div>ช่องทาง: {{ getChannelLabel(txn.channel) }} · จำนวน: <strong>{{ formatCurrency(txn.amount) }}</strong></div>
                    <div class="text-xs text-gray-400">Bank Impact: {{ getBankImpactLabel(txn) }}</div>
                  </div>
                </div>

                <!-- Verify controls -->
                <div class="flex items-center gap-2">
                  <button
                    class="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                    aria-label="ดูรายละเอียดและ Bank Statement"
                    @click="openVerifyModal(txn)"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <button
                    :class="[
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                      txnVerifyStatus[txn.id] === 'verified'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
                    ]"
                    @click="markTxnVerified(txn.id)"
                  >
                    <CheckIcon class="w-4 h-4 inline mr-1" />
                    ถูกต้อง
                  </button>
                  <button
                    :class="[
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                      txnVerifyStatus[txn.id] === 'issue'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-red-700 border-red-300 hover:bg-red-50',
                    ]"
                    @click="markTxnIssue(txn.id)"
                  >
                    <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" />
                    มีปัญหา
                  </button>
                </div>
              </div>
            </div>

            <EmptyState
              v-if="completedTransactions.length === 0"
              icon="📋"
              title="ไม่มีรายการ"
              description="ยังไม่มีรายการธุรกรรมสำหรับวันนี้"
            />
          </div>
        </div>

        <!-- 2. Bank Balance Verification -->
        <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div class="flex items-start gap-3 mb-3">
            <input
              v-model="bankBalanceVerified"
              type="checkbox"
              class="mt-0.5 w-4 h-4 accent-red-600"
              id="bankBalanceCheck"
            />
            <div class="flex-1">
              <label for="bankBalanceCheck" class="font-semibold text-gray-800 cursor-pointer">
                ☐ ตรวจสอบยอดเงินในบัญชี Bank
              </label>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm ml-7">
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="text-blue-700 text-xs mb-1">Expected (จาก Step 1)</div>
              <div class="font-bold text-blue-900 text-base">{{ formatCurrency(expectedBankBalance) }}</div>
            </div>
            <div>
              <FormField label="Bank Statement แสดง">
                <div class="relative">
                  <BaseInput v-model="bankStatementAmount" type="number" placeholder="0" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
                </div>
              </FormField>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 flex items-center">
              <div>
                <div class="text-xs text-gray-500 mb-1">ผลต่าง</div>
                <div :class="['font-bold text-base', bankBalanceDiff === 0 ? 'text-green-700' : 'text-red-700']">
                  {{ bankBalanceDiff === 0 ? '✅ ตรงกัน' : (bankBalanceDiff > 0 ? '+' : '') + formatCurrency(bankBalanceDiff) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Cash Count Verification -->
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex items-start gap-3 mb-3">
            <input
              v-model="cashCountVerified"
              type="checkbox"
              class="mt-0.5 w-4 h-4 accent-red-600"
              id="cashCountCheck"
            />
            <div class="flex-1">
              <label for="cashCountCheck" class="font-semibold text-gray-800 cursor-pointer">
                ☐ ยืนยันผลการตรวจนับเงินสด Step 2
              </label>
            </div>
          </div>
          <div v-if="step2Data" class="ml-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">เงินสดโอน/ถอน</div>
              <div class="font-bold text-gray-900">{{ formatCurrency(step2Data.actualCash?.transferWithdrawal ?? 0) }}</div>
              <BaseBadge variant="success" size="sm" class="mt-1">Match</BaseBadge>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">ค่าบริการเงินสด</div>
              <div class="font-bold text-gray-900">{{ formatCurrency(step2Data.actualCash?.serviceFee ?? 0) }}</div>
              <BaseBadge variant="success" size="sm" class="mt-1">Match</BaseBadge>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">สถานะ</div>
              <BaseBadge
                :variant="step2Data.hasDiscrepancies ? 'warning' : 'success'"
                size="md"
              >
                {{ step2Data.hasDiscrepancies ? '⚠️ พบผลต่าง' : '✅ ตรงกัน' }}
              </BaseBadge>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Audit Notes & Findings ─────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-700 mb-3">📝 ผลการ Audit</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <FormField label="ผลการตรวจสอบ" required>
            <div class="space-y-2">
              <label
                v-for="opt in [{ value: 'none', label: '✅ ไม่พบปัญหา', color: 'green' }, { value: 'minor', label: '⚠️ พบปัญหาเล็กน้อย', color: 'amber' }, { value: 'major', label: '❌ พบปัญหาสำคัญ', color: 'red' }]"
                :key="opt.value"
                :class="[
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  issuesFound === opt.value
                    ? opt.color === 'green' ? 'border-green-500 bg-green-50' : opt.color === 'amber' ? 'border-amber-500 bg-amber-50' : 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:bg-gray-50',
                ]"
              >
                <input v-model="issuesFound" type="radio" :value="opt.value" class="accent-red-600" />
                <span class="font-medium">{{ opt.label }}</span>
              </label>
            </div>
          </FormField>

          <FormField label="บันทึก Audit">
            <BaseTextarea
              v-model="auditNotes"
              placeholder="สรุปผลการตรวจสอบ เช่น ตรวจสอบรายการทั้งหมดแล้ว ยอดเงินตรงกับ Bank Statement..."
              :rows="3"
            />
          </FormField>

          <FormField v-if="issuesFound !== 'none'" label="รายละเอียดปัญหาที่พบ" required>
            <BaseTextarea
              v-model="issueDetails"
              placeholder="ระบุปัญหาที่พบ เช่น รายการที่ X ยอดเงินไม่ตรงกับ Bank Statement..."
              :rows="3"
            />
          </FormField>
        </div>
      </section>

      <!-- ── Actions ────────────────────────────────────────────────────── -->
      <!-- Progress indicator -->
      <div class="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex flex-wrap gap-3">
        <span :class="allTxnsVerified ? 'text-green-700' : 'text-gray-400'">
          {{ allTxnsVerified ? '✅' : '☐' }} ตรวจรายการธุรกรรม
        </span>
        <span :class="bankBalanceVerified ? 'text-green-700' : 'text-gray-400'">
          {{ bankBalanceVerified ? '✅' : '☐' }} ยืนยัน Bank Balance
        </span>
        <span :class="cashCountVerified ? 'text-green-700' : 'text-gray-400'">
          {{ cashCountVerified ? '✅' : '☐' }} ยืนยันการตรวจนับ
        </span>
        <span :class="issuesFound !== '' ? 'text-green-700' : 'text-gray-400'">
          {{ issuesFound !== '' ? '✅' : '☐' }} ระบุผลการ Audit
        </span>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <BaseButton variant="danger" @click="showRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <ActionButton
          :permission="PERMISSIONS.VIEW_FINANCE"
          variant="success"
          size="lg"
          :disabled="!canSubmit"
          :loading="isSubmitting"
          @click="handleApproveAudit"
        >
          <CheckCircleIcon class="w-5 h-5" />
          ✅ Approve Audit
        </ActionButton>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Transaction Verify Detail Modal -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showVerifyModal"
      size="md"
      @close="showVerifyModal = false"
    >
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">Bank Statement Verification</h2>
          <button
            aria-label="ปิด"
            class="text-gray-400 hover:text-gray-600"
            @click="showVerifyModal = false"
          >
            <XCircleIcon class="w-5 h-5" />
          </button>
        </div>
      </template>

      <div v-if="verifyingTransaction" class="space-y-4 text-sm">
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="font-semibold text-gray-800 mb-2">ข้อมูลจาก Manager</div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="text-gray-500">ประเภท: </span>
              <span class="font-medium">{{ getTransactionTypeLabel(verifyingTransaction.transactionType) }}</span>
            </div>
            <div>
              <span class="text-gray-500">ช่องทาง: </span>
              <span class="font-medium">{{ getChannelLabel(verifyingTransaction.channel) }}</span>
            </div>
            <div>
              <span class="text-gray-500">จำนวน: </span>
              <span class="font-bold">{{ formatCurrency(verifyingTransaction.amount) }}</span>
            </div>
            <div v-if="verifyingTransaction.commission">
              <span class="text-gray-500">ค่าบริการ: </span>
              <span class="font-medium text-green-700">{{ formatCurrency(verifyingTransaction.commission) }}</span>
            </div>
            <div>
              <span class="text-gray-500">เวลา: </span>
              <span class="font-medium">{{ formatTime(verifyingTransaction.datetime) }}</span>
            </div>
            <div>
              <span class="text-gray-500">Bank Impact: </span>
              <span class="font-medium">{{ getBankImpactLabel(verifyingTransaction) }}</span>
            </div>
          </div>
          <div v-if="verifyingTransaction.destinationName" class="mt-2">
            <span class="text-gray-500">ปลายทาง: </span>
            <span class="font-medium">{{ verifyingTransaction.destinationName }}</span>
            <span v-if="verifyingTransaction.destinationIdentifier" class="text-gray-400 ml-1">({{ verifyingTransaction.destinationIdentifier }})</span>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="font-semibold text-blue-800 mb-2">Bank Statement (2026-01-29)</div>
          <div class="text-blue-700 space-y-1">
            <div>{{ verifyingTransaction.transactionType === 'transfer' ? '📤 OUT' : '📥 IN' }}: {{ formatCurrency(verifyingTransaction.amount) }}</div>
            <div class="text-xs text-blue-500">เวลา: {{ formatTime(verifyingTransaction.datetime) }}</div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-xs text-gray-500 font-medium uppercase tracking-wide">ผลการตรวจสอบ</div>
          <div class="flex gap-2">
            <button
              :class="[
                'flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors',
                txnVerifyStatus[verifyingTransaction.id] === 'verified'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
              ]"
              @click="markTxnVerified(verifyingTransaction.id)"
            >
              ✅ ถูกต้อง
            </button>
            <button
              :class="[
                'flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors',
                txnVerifyStatus[verifyingTransaction.id] === 'issue'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50',
              ]"
              @click="markTxnIssue(verifyingTransaction.id)"
            >
              ⚠️ มีปัญหา
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showVerifyModal = false">ปิด</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Reject Confirm Dialog -->
    <ConfirmDialog
      :open="showRejectConfirm"
      title="ส่งคืนให้ Manager แก้ไข"
      message="ต้องการส่งคืนรายการนี้ให้ Manager แก้ไขหรือไม่? กรุณาระบุรายละเอียดปัญหาในช้อง Audit Notes ก่อน"
      confirm-text="ส่งคืนแก้ไข"
      cancel-text="ยกเลิก"
      variant="warning"
      @confirm="handleRejectAudit"
      @cancel="showRejectConfirm = false"
    />
  </PageWrapper>
</template>
