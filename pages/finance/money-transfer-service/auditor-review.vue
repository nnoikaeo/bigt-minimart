<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useMoneyTransferHelpers } from '~/composables/useMoneyTransferHelpers'
import {
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
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

// Per-transaction issue marking (only 'issue' entries — default = ถูกต้อง)
const txnIssueStatus = ref<Record<string, true>>({})

// Section B — Auditor cash count inputs
const auditorCashTransferWithdrawal = ref<number | null>(null)
const auditorCashServiceFee = ref<number | null>(null)

// Section C — Bank balance verification
const bankStatementAmount = ref<number>(0)

// Section D — Transaction list toggle
const showTransactions = ref(false)

// Section E — Issue details
const issueDetails = ref('')

// Confirm dialogs
const showRejectConfirm = ref(false)
const showApproveConfirm = ref(false)

// Transaction detail modal
const showVerifyModal = ref(false)
const verifyingTransaction = ref<any>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const completedTransactions = computed(() =>
  store.getTransactionsByDate(selectedDate.value)
    .filter((t: any) => t.status === 'completed' || t.status === 'failed')
)

const txnsWithIssues = computed(() => Object.keys(txnIssueStatus.value).length)

const canSubmit = computed(() =>
  auditorCashTransferWithdrawal.value !== null && auditorCashServiceFee.value !== null
)

// Section A — Balance snapshot
const openingBalance = computed(() => store.currentBalance?.openingBalance ?? 0)
const closingBalance = computed(() =>
  store.currentSummary?.step1?.finalBalances?.bankAccount ?? store.currentBalance?.bankAccount ?? 0
)
const netChange = computed(() => closingBalance.value - openingBalance.value)
const closingTransferCash = computed(() =>
  store.currentSummary?.step1?.finalBalances?.transferCash ?? store.currentBalance?.transferCash ?? 0
)
const closingServiceFeeCash = computed(() =>
  store.currentSummary?.step1?.finalBalances?.serviceFeeCash ?? store.currentBalance?.serviceFeeCash ?? 0
)

// Section B — Cash diff
const step2Data = computed(() => store.currentSummary?.step2)
const expectedTransferWithdrawal = computed(() => step2Data.value?.expectedCash?.transferWithdrawal ?? 0)
const expectedServiceFee = computed(() => step2Data.value?.expectedCash?.serviceFee ?? 0)
const auditorDiffTransferWithdrawal = computed(() =>
  auditorCashTransferWithdrawal.value !== null
    ? auditorCashTransferWithdrawal.value - expectedTransferWithdrawal.value
    : null
)
const auditorDiffServiceFee = computed(() =>
  auditorCashServiceFee.value !== null
    ? auditorCashServiceFee.value - expectedServiceFee.value
    : null
)
const auditorCashTotal = computed(() =>
  (auditorCashTransferWithdrawal.value ?? 0) + (auditorCashServiceFee.value ?? 0)
)
const auditorDiffTotal = computed(() =>
  auditorDiffTransferWithdrawal.value !== null || auditorDiffServiceFee.value !== null
    ? (auditorDiffTransferWithdrawal.value ?? 0) + (auditorDiffServiceFee.value ?? 0)
    : null
)

// Section A — Bank Statement diff (vs closingBalance)
const bankBalanceDiff = computed(() => bankStatementAmount.value - closingBalance.value)

const managerStep1Data = computed(() => store.currentSummary?.step1)

// Read-only audit data (when isAudited)
const auditData = computed(() => store.currentSummary?.auditorVerification)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const {
  formatCurrency,
  formatTime,
  formatDatetime,
  getTransactionTypeLabel,
  getChannelLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  getAccountName,
  getChannelSubtitle,
} = useMoneyTransferHelpers()

function formatDiff(diff: number | null): string {
  if (diff === null) return '-'
  if (diff === 0) return '✅ ตรงกัน'
  return (diff > 0 ? '+' : '') + formatCurrency(diff)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function toggleTxnIssue(txnId: string) {
  if (txnIssueStatus.value[txnId]) {
    const copy = { ...txnIssueStatus.value }
    delete copy[txnId]
    txnIssueStatus.value = copy
  } else {
    txnIssueStatus.value = { ...txnIssueStatus.value, [txnId]: true }
  }
}

function openVerifyModal(txn: any) {
  verifyingTransaction.value = txn
  showVerifyModal.value = true
}

async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
    await store.fetchBalanceByDate(selectedDate.value)
    // Reset verification state
    txnIssueStatus.value = {}
    auditorCashTransferWithdrawal.value = null
    auditorCashServiceFee.value = null
    bankStatementAmount.value = 0
    issueDetails.value = ''
    showTransactions.value = false
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
}

async function handleApproveAudit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    const hasIssues = issueDetails.value.trim() !== '' || txnsWithIssues.value > 0
    await store.submitAudit(selectedDate.value, {
      transactionsVerified: completedTransactions.value.length,
      transactionsWithIssues: txnsWithIssues.value,
      bankStatementVerified: bankStatementAmount.value > 0,
      bankStatementAmount: bankStatementAmount.value || undefined,
      auditorCash: (auditorCashTransferWithdrawal.value !== null && auditorCashServiceFee.value !== null)
        ? {
            transferWithdrawal: auditorCashTransferWithdrawal.value,
            serviceFee: auditorCashServiceFee.value,
            total: auditorCashTransferWithdrawal.value + auditorCashServiceFee.value,
          }
        : undefined,
      auditResult: hasIssues ? 'minor_issues' : 'no_issues',
      auditNotes: issueDetails.value || '',
      issuesFound: issueDetails.value || undefined,
    })
    successMessage.value = 'Audit เสร็จสมบูรณ์ — ส่งให้ Owner อนุมัติได้เลย'
    showApproveConfirm.value = false
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
      transactionsVerified: completedTransactions.value.length,
      transactionsWithIssues: txnsWithIssues.value,
      bankStatementVerified: bankStatementAmount.value > 0,
      auditResult: 'rejected',
      auditNotes: issueDetails.value || 'ส่งคืน Manager เพื่อแก้ไข',
      issuesFound: issueDetails.value || 'ส่งคืนแก้ไข',
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
    await store.fetchBalanceByDate(selectedDate.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
})
</script>

<template>
  <PageWrapper
    title="ตรวจสอบบริการโอนเงิน"
    description="ตรวจสอบเงินในบัญชีและตรวจสอบเงินสดที่นับได้"
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

    <!-- Already Audited — Read-Only View -->
    <template v-if="store.isAudited">
      <BaseAlert
        variant="success"
        title="ตรวจสอบเสร็จสมบูรณ์"
        message="ส่งให้เจ้าของอนุมัติแล้ว — ข้อมูลนี้เป็นแบบอ่านอย่างเดียว"
        :dismissible="false"
        class="mb-6"
      />

      <!-- SECTION A — Balance Snapshot (read-only) -->
      <section class="mb-5">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-blue-50 rounded-lg p-3 text-center">
              <div class="text-xs text-blue-600 mb-1">ยอดเปิดบัญชี (เริ่มต้นวัน)</div>
              <div class="text-lg font-bold text-blue-900">{{ formatCurrency(openingBalance) }}</div>
            </div>
            <div :class="['rounded-lg p-3 text-center', netChange >= 0 ? 'bg-green-50' : 'bg-red-50']">
              <div :class="['text-xs mb-1', netChange >= 0 ? 'text-green-600' : 'text-red-600']">สุทธิระหว่างวัน</div>
              <div :class="['text-lg font-bold', netChange >= 0 ? 'text-green-800' : 'text-red-800']">
                {{ netChange >= 0 ? '+' : '' }}{{ formatCurrency(netChange) }}
              </div>
            </div>
            <div class="bg-gray-100 rounded-lg p-3 text-center ring-1 ring-gray-300">
              <div class="text-xs text-gray-500 mb-1">ยอดปิดบัญชี (ที่คาดหวัง)</div>
              <div class="text-lg font-bold text-gray-900">{{ formatCurrency(closingBalance) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-wrap">
            <span class="text-sm text-gray-600">รายการเดินบัญชี:</span>
            <template v-if="auditData?.bankStatementAmount">
              <span class="text-sm font-semibold text-blue-800">{{ formatCurrency(auditData.bankStatementAmount) }}</span>
              <span class="text-gray-400 text-xs">(Auditor กรอก)</span>
            </template>
            <BaseBadge :variant="auditData?.bankStatementVerified ? 'success' : 'warning'" size="sm">
              {{ auditData?.bankStatementVerified ? '✅ ตรวจสอบแล้ว' : '⚠️ ไม่ได้ตรวจสอบ' }}
            </BaseBadge>
            <BaseBadge :variant="auditData?.bankBalanceMatches ? 'success' : 'error'" size="sm">
              {{ auditData?.bankBalanceMatches ? '✅ ยอดตรงกัน' : '❌ ยอดไม่ตรงกัน' }}
            </BaseBadge>
          </div>
          <div class="flex gap-6 text-sm text-gray-600 border-t border-gray-100 pt-3">
            <span>เงินสดในมือ (โอน/ถอน): <strong>{{ formatCurrency(closingTransferCash) }}</strong></span>
            <span>ค่าบริการสะสม: <strong class="text-green-700">{{ formatCurrency(closingServiceFeeCash) }}</strong></span>
            <span class="text-gray-400">Step 1 — {{ managerStep1Data?.completedTransactions ?? 0 }} รายการสำเร็จ</span>
          </div>
        </div>
      </section>

      <!-- SECTION D — Transaction List Collapsible (read-only) -->
      <section class="mb-5">
        <button
          class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          :class="showTransactions ? 'rounded-b-none border-b-0' : ''"
          @click="showTransactions = !showTransactions"
        >
          <div class="flex items-center gap-3">
            <component :is="showTransactions ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ completedTransactions.length }} รายการ</span>
          </div>
          <BaseBadge :variant="(auditData?.transactionsWithIssues ?? 0) > 0 ? 'warning' : 'success'" size="sm">
            {{ (auditData?.transactionsWithIssues ?? 0) > 0 ? `⚠️ ${auditData?.transactionsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showTransactions" class="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table v-if="completedTransactions.length > 0" class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">เวลา</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">ชื่อบัญชี</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">ค่าบริการ</th>
                  <th class="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                  <th class="text-center px-4 py-3 font-medium text-gray-600">ดู</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="(txn, idx) in completedTransactions"
                  :key="txn.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="openVerifyModal(txn)"
                >
                  <td class="px-4 py-3 text-gray-500">{{ (idx as number) + 1 }}</td>
                  <td class="px-4 py-3 text-gray-700">{{ formatTime(txn.datetime) }}</td>
                  <td class="px-4 py-3 text-gray-900 font-medium">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <div class="text-gray-900 text-sm">{{ getAccountName(txn) }}</div>
                    <div v-if="getChannelSubtitle(txn)" class="text-xs text-gray-400 mt-0.5">{{ getChannelSubtitle(txn) }}</div>
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(txn.amount) }}</td>
                  <td class="px-4 py-3 text-right text-gray-600">
                    <template v-if="txn.transactionType !== 'owner_deposit'">
                      {{ txn.commission ? formatCurrency(txn.commission) : '-' }}
                      <span v-if="txn.commissionType" class="text-xs text-gray-400 ml-1">
                        {{ txn.commissionType === 'cash' ? 'C' : 'T' }}
                      </span>
                    </template>
                    <template v-else>-</template>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm" dot>
                      {{ getStatusLabel(txn.status) }}
                    </BaseBadge>
                  </td>
                  <td class="px-4 py-3 text-center" @click.stop>
                    <button
                      class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label="ดูรายละเอียด"
                      @click="openVerifyModal(txn)"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <EmptyState v-else icon="📋" title="ไม่มีรายการ" description="ไม่มีรายการธุรกรรมสำหรับวันนี้" />
          </div>
          <div v-if="completedTransactions.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
            รวม {{ completedTransactions.length }} รายการ
          </div>
        </div>
      </section>

      <!-- SECTION B read-only — Cash Verification (Expected vs Manager) -->
      <section class="mb-5">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ตรวจสอบยอดเงินสด</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-100">
                  <th class="text-left py-2 pr-4 font-medium">รายการ</th>
                  <th class="text-right py-2 px-4 font-medium">คาดหวัง</th>
                  <th class="text-right py-2 px-4 font-medium">ผู้จัดการนับ</th>
                  <th class="text-right py-2 px-4 font-medium text-blue-700">ผู้ตรวจสอบนับ</th>
                  <th class="text-right py-2 pl-4 font-medium">ผลต่าง</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">เงินสดโอน/ถอน</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedTransferWithdrawal) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.transferWithdrawal ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-blue-800 font-medium">
                    {{ auditData?.auditorCash ? formatCurrency(auditData.auditorCash.transferWithdrawal) : '-' }}
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span v-if="auditData?.auditorCash" :class="['font-medium text-sm', (auditData.auditorCash.transferWithdrawal - expectedTransferWithdrawal) === 0 ? 'text-green-700' : 'text-red-700']">
                      {{ formatDiff(auditData.auditorCash.transferWithdrawal - expectedTransferWithdrawal) }}
                    </span>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">ค่าบริการเงินสด</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedServiceFee) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.serviceFee ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-blue-800 font-medium">
                    {{ auditData?.auditorCash ? formatCurrency(auditData.auditorCash.serviceFee) : '-' }}
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span v-if="auditData?.auditorCash" :class="['font-medium text-sm', (auditData.auditorCash.serviceFee - expectedServiceFee) === 0 ? 'text-green-700' : 'text-red-700']">
                      {{ formatDiff(auditData.auditorCash.serviceFee - expectedServiceFee) }}
                    </span>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
                <tr class="bg-gray-50 font-semibold border-t border-gray-200">
                  <td class="py-2 pr-4 text-gray-800">รวม</td>
                  <td class="py-2 px-4 text-right text-gray-800">{{ formatCurrency(step2Data?.expectedCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-blue-800">
                    {{ auditData?.auditorCash ? formatCurrency(auditData.auditorCash.total) : '-' }}
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span v-if="auditData?.auditorCash" :class="['font-medium text-sm', (auditData.auditorCash.total - (step2Data?.expectedCash?.total ?? 0)) === 0 ? 'text-green-700' : 'text-red-700 font-bold']">
                      {{ formatDiff(auditData.auditorCash.total - (step2Data?.expectedCash?.total ?? 0)) }}
                    </span>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- SECTION E — Audit Result Summary -->
      <section class="mb-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ผลการตรวจสอบ</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm text-gray-600">ผลการตรวจสอบ:</span>
            <BaseBadge
              :variant="auditData?.auditResult === 'no_issues' ? 'success' : auditData?.auditResult === 'minor_issues' ? 'warning' : 'error'"
              size="md"
            >
              {{
                auditData?.auditResult === 'no_issues' ? '✅ ไม่พบปัญหา' :
                auditData?.auditResult === 'minor_issues' ? '⚠️ พบปัญหาเล็กน้อย' :
                '❌ พบปัญหาสำคัญ'
              }}
            </BaseBadge>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-xs text-gray-500 mb-1">รายการที่ตรวจสอบ</div>
              <div class="font-semibold text-gray-900">{{ auditData?.transactionsVerified ?? 0 }} รายการ</div>
            </div>
            <div :class="['rounded-lg p-3', (auditData?.transactionsWithIssues ?? 0) > 0 ? 'bg-amber-50' : 'bg-gray-50']">
              <div class="text-xs text-gray-500 mb-1">รายการมีปัญหา</div>
              <div :class="['font-semibold', (auditData?.transactionsWithIssues ?? 0) > 0 ? 'text-amber-700' : 'text-gray-900']">
                {{ auditData?.transactionsWithIssues ?? 0 }} รายการ
              </div>
            </div>
          </div>
          <div v-if="auditData?.issuesFound && auditData.issuesFound.length > 0" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div class="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">รายละเอียดปัญหาที่พบ</div>
            <div v-for="(issue, i) in auditData.issuesFound" :key="i" class="text-sm text-amber-900">{{ issue }}</div>
          </div>
          <div v-if="auditData?.auditNotes" class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">หมายเหตุ Auditor</div>
            <div class="text-sm text-gray-900">{{ auditData.auditNotes }}</div>
          </div>
          <div class="border-t border-gray-100 pt-3 text-xs text-gray-500 flex flex-wrap gap-4">
            <span>ตรวจสอบโดย: <strong class="text-gray-700">{{ auditData?.completedByName ?? '-' }}</strong></span>
            <span v-if="auditData?.completedAt">เมื่อ: <strong class="text-gray-700">{{ formatDatetime(auditData.completedAt as string) }}</strong></span>
          </div>
        </div>
      </section>

      <div class="flex justify-center">
        <BaseButton variant="secondary" size="md" @click="router.push('/finance/money-transfer-history')">
          ← ประวัติ
        </BaseButton>
      </div>
    </template>

    <template v-else-if="store.isStep2Complete">

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- SECTION A — ยอดเงินในบัญชี Bank + ตรวจสอบ Bank Statement         -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section class="mb-5">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <!-- 3-card: opening → net → closing (closing = Expected) -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-blue-50 rounded-lg p-3 text-center">
              <div class="text-xs text-blue-600 mb-1">ยอดเปิดบัญชี (เริ่มต้นวัน)</div>
              <div class="text-lg font-bold text-blue-900">{{ formatCurrency(openingBalance) }}</div>
            </div>
            <div :class="['rounded-lg p-3 text-center', netChange >= 0 ? 'bg-green-50' : 'bg-red-50']">
              <div :class="['text-xs mb-1', netChange >= 0 ? 'text-green-600' : 'text-red-600']">สุทธิระหว่างวัน</div>
              <div :class="['text-lg font-bold', netChange >= 0 ? 'text-green-800' : 'text-red-800']">
                {{ netChange >= 0 ? '+' : '' }}{{ formatCurrency(netChange) }}
              </div>
            </div>
            <div class="bg-gray-100 rounded-lg p-3 text-center ring-1 ring-gray-300">
              <div class="text-xs text-gray-500 mb-1">ยอดปิดบัญชี (ที่คาดหวัง)</div>
              <div class="text-lg font-bold text-gray-900">{{ formatCurrency(closingBalance) }}</div>
            </div>
          </div>

          <!-- Bank Statement input + diff (merged from Section C) -->
          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <FormField label="Bank Statement แสดง">
              <div class="relative">
                <BaseInput v-model="bankStatementAmount" type="number" placeholder="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
              </div>
            </FormField>
            <div class="bg-gray-50 rounded-lg p-3 flex items-center self-end mb-1">
              <div>
                <div class="text-xs text-gray-500 mb-1">ผลต่าง (Bank Statement − ยอดปิด)</div>
                <div :class="['font-bold text-base', bankBalanceDiff === 0 ? 'text-green-700' : 'text-red-700']">
                  {{ bankBalanceDiff === 0 ? '✅ ตรงกัน' : (bankBalanceDiff > 0 ? '+' : '') + formatCurrency(bankBalanceDiff) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Supplementary -->
          <div class="flex gap-6 text-sm text-gray-600 border-t border-gray-100 pt-3">
            <span>เงินสดในมือ (โอน/ถอน): <strong>{{ formatCurrency(closingTransferCash) }}</strong></span>
            <span>ค่าบริการสะสม: <strong class="text-green-700">{{ formatCurrency(closingServiceFeeCash) }}</strong></span>
            <span class="text-gray-400">Step 1 — {{ managerStep1Data?.completedTransactions ?? 0 }} รายการสำเร็จ</span>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- SECTION D — รายการธุรกรรม (Collapsible)                          -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section class="mb-5">
        <!-- Collapsible Header -->
        <button
          class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          :class="showTransactions ? 'rounded-b-none border-b-0' : ''"
          @click="showTransactions = !showTransactions"
        >
          <div class="flex items-center gap-3">
            <component :is="showTransactions ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ completedTransactions.length }} รายการ</span>
          </div>
          <div class="flex items-center gap-2">
            <BaseBadge
              :variant="txnsWithIssues > 0 ? 'warning' : 'success'"
              size="sm"
            >
              {{ txnsWithIssues > 0 ? `⚠️ ${txnsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
            </BaseBadge>
          </div>
        </button>

        <!-- Expanded content -->
        <div
          v-if="showTransactions"
          class="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table v-if="completedTransactions.length > 0" class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">เวลา</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">ชื่อบัญชี</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">ค่าบริการ</th>
                  <th class="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                  <th class="text-center px-4 py-3 font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="(txn, idx) in completedTransactions"
                  :key="txn.id"
                  :class="[
                    'hover:bg-gray-50 transition-colors cursor-pointer',
                    txnIssueStatus[txn.id] ? 'bg-red-50 hover:bg-red-100' : '',
                  ]"
                  @click="openVerifyModal(txn)"
                >
                  <td class="px-4 py-3 text-gray-500">{{ (idx as number) + 1 }}</td>
                  <td class="px-4 py-3 text-gray-700">{{ formatTime(txn.datetime) }}</td>
                  <td class="px-4 py-3 text-gray-900 font-medium">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <div class="text-gray-900 text-sm">{{ getAccountName(txn) }}</div>
                    <div v-if="getChannelSubtitle(txn)" class="text-xs text-gray-400 mt-0.5">{{ getChannelSubtitle(txn) }}</div>
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(txn.amount) }}</td>
                  <td class="px-4 py-3 text-right text-gray-600">
                    <template v-if="txn.transactionType !== 'owner_deposit'">
                      {{ txn.commission ? formatCurrency(txn.commission) : '-' }}
                      <span v-if="txn.commissionType" class="text-xs text-gray-400 ml-1">
                        {{ txn.commissionType === 'cash' ? 'C' : 'T' }}
                      </span>
                    </template>
                    <template v-else>-</template>
                  </td>
                  <td class="px-4 py-3 text-center" @click.stop>
                    <div class="flex flex-col items-center gap-1">
                      <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm" dot>
                        {{ getStatusLabel(txn.status) }}
                      </BaseBadge>
                      <BaseBadge v-if="txnIssueStatus[txn.id]" variant="warning" size="sm">พบปัญหา</BaseBadge>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center" @click.stop>
                    <div class="flex items-center justify-center gap-1">
                      <button
                        class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="ดูรายละเอียด"
                        @click="openVerifyModal(txn)"
                      >
                        <EyeIcon class="w-4 h-4" />
                      </button>
                      <button
                        :class="[
                          'px-2 py-1 rounded-lg text-xs font-medium transition-colors border',
                          txnIssueStatus[txn.id]
                            ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
                        ]"
                        @click="toggleTxnIssue(txn.id)"
                      >
                        <template v-if="txnIssueStatus[txn.id]">ยกเลิก</template>
                        <template v-else>
                          <ExclamationTriangleIcon class="w-3.5 h-3.5 inline mr-0.5" />
                          มีปัญหา
                        </template>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <EmptyState
              v-else
              icon="📋"
              title="ไม่มีรายการ"
              description="ยังไม่มีรายการธุรกรรมสำหรับวันนี้"
            />
          </div>

          <!-- Summary row -->
          <div v-if="completedTransactions.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>รวม {{ completedTransactions.length }} รายการ</span>
            <span v-if="txnsWithIssues > 0" class="text-amber-700 font-medium">⚠️ พบปัญหา {{ txnsWithIssues }} รายการ</span>
            <span v-else class="text-green-700">✅ ไม่พบปัญหา</span>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- SECTION B — ตรวจสอบยอดเงินสด (Auditor Cash Count)                -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section class="mb-5">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ตรวจสอบยอดเงินสด</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <!-- Table -->
          <div class="overflow-x-auto mb-4">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-100">
                  <th class="text-left py-2 pr-4 font-medium">รายการ</th>
                  <th class="text-right py-2 px-4 font-medium">คาดหวัง</th>
                  <th class="text-right py-2 px-4 font-medium text-gray-600">Manager นับ</th>
                  <th class="text-right py-2 px-4 font-medium text-red-700">Auditor นับ</th>
                  <th class="text-right py-2 pl-4 font-medium">ผลต่าง</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <!-- Row: เงินสดโอน/ถอน -->
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">เงินสดโอน/ถอน</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedTransferWithdrawal) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.transferWithdrawal ?? 0) }}</td>
                  <td class="py-2 px-4 text-right">
                    <div class="relative">
                      <input
                        v-model.number="auditorCashTransferWithdrawal"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500"
                      />
                    </div>
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="[
                      'font-medium text-sm',
                      auditorDiffTransferWithdrawal === null ? 'text-gray-400' :
                      auditorDiffTransferWithdrawal === 0 ? 'text-green-700' : 'text-red-700'
                    ]">
                      {{ formatDiff(auditorDiffTransferWithdrawal) }}
                    </span>
                  </td>
                </tr>
                <!-- Row: ค่าบริการเงินสด -->
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">ค่าบริการเงินสด</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedServiceFee) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.serviceFee ?? 0) }}</td>
                  <td class="py-2 px-4 text-right">
                    <div class="relative">
                      <input
                        v-model.number="auditorCashServiceFee"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500"
                      />
                    </div>
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="[
                      'font-medium text-sm',
                      auditorDiffServiceFee === null ? 'text-gray-400' :
                      auditorDiffServiceFee === 0 ? 'text-green-700' : 'text-red-700'
                    ]">
                      {{ formatDiff(auditorDiffServiceFee) }}
                    </span>
                  </td>
                </tr>
                <!-- Row: รวม -->
                <tr class="bg-gray-50 font-semibold border-t border-gray-200">
                  <td class="py-2 pr-4 text-gray-800">รวม</td>
                  <td class="py-2 px-4 text-right text-gray-800">{{ formatCurrency((step2Data?.expectedCash?.total ?? 0)) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(auditorCashTotal) }}</td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="[
                      'font-medium text-sm',
                      auditorDiffTotal === null ? 'text-gray-400' :
                      auditorDiffTotal === 0 ? 'text-green-700' : 'text-red-700 font-bold'
                    ]">
                      {{ formatDiff(auditorDiffTotal) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- SECTION E — รายละเอียดปัญหาที่พบ (ถ้ามี)                         -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <section class="mb-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">รายละเอียดปัญหาที่พบ (ถ้ามี)</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <BaseTextarea
            v-model="issueDetails"
            placeholder="ระบุปัญหาที่พบ เช่น รายการที่ X ยอดเงินไม่ตรงกับ Bank Statement... (ว่างได้ถ้าไม่พบปัญหา)"
            :rows="3"
          />
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════ -->
      <!-- Progress + Submit                                                 -->
      <!-- ══════════════════════════════════════════════════════════════════ -->
      <div v-if="txnsWithIssues > 0" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
        ⚠️ พบ {{ txnsWithIssues }} รายการมีปัญหาในรายการธุรกรรม
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <BaseButton variant="danger" @click="showRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <BaseButton
          variant="success"
          :disabled="!canSubmit"
          @click="showApproveConfirm = true"
        >
          <CheckCircleIcon class="w-4 h-4" />
          ยืนยันการตรวจสอบ
        </BaseButton>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Transaction Detail Modal                                          -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showVerifyModal"
      size="md"
      @close="showVerifyModal = false"
    >
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">รายละเอียดรายการ</h2>
          <BaseBadge
            v-if="verifyingTransaction"
            :variant="getStatusBadgeVariant(verifyingTransaction.status)"
            size="md"
            dot
          >
            {{ getStatusLabel(verifyingTransaction.status) }}
          </BaseBadge>
        </div>
      </template>

      <div v-if="verifyingTransaction" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <!-- Bank channel -->
          <template v-if="verifyingTransaction.channel === 'bank' || verifyingTransaction.channel === 'other'">
            <div class="col-span-2">
              <div class="text-gray-500">ธนาคาร</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.bankName || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">เลขบัญชี</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.accountNumber || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">ชื่อบัญชี</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.accountName || '-' }}</div>
            </div>
          </template>

          <!-- PromptPay channel -->
          <template v-else-if="verifyingTransaction.channel === 'promptpay'">
            <div class="col-span-2">
              <div class="text-gray-500">ช่องทาง</div>
              <div class="font-medium text-gray-900">พร้อมเพย์</div>
            </div>
            <div>
              <div class="text-gray-500">{{ verifyingTransaction.promptpayIdentifierType === 'idcard' ? 'เลขบัตรประชาชน' : 'หมายเลขโทรศัพท์' }}</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.promptpayIdentifier || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">ชื่อบัญชี</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.promptpayAccountName || verifyingTransaction.accountName || '-' }}</div>
            </div>
          </template>

          <div>
            <div class="text-gray-500">ประเภท</div>
            <div class="font-medium text-gray-900">{{ getTransactionTypeLabel(verifyingTransaction.transactionType) }}</div>
          </div>
          <div v-if="verifyingTransaction.transactionType === 'owner_deposit'">
            <div class="text-gray-500">ช่องทาง</div>
            <div class="font-medium text-gray-900">{{ getChannelLabel(verifyingTransaction.channel) }}</div>
          </div>
          <div>
            <div class="text-gray-500">วันที่/เวลา</div>
            <div class="font-medium text-gray-900">{{ formatDatetime(verifyingTransaction.datetime) }}</div>
          </div>
          <div>
            <div class="text-gray-500">จำนวนเงิน</div>
            <div class="font-bold text-gray-900 text-base">{{ formatCurrency(verifyingTransaction.amount) }}</div>
          </div>
          <div v-if="verifyingTransaction.commission && verifyingTransaction.transactionType !== 'owner_deposit'">
            <div class="text-gray-500">ค่าบริการ</div>
            <div class="font-medium text-green-700">
              {{ formatCurrency(verifyingTransaction.commission) }}
              <span class="text-xs text-gray-400">({{ verifyingTransaction.commissionType === 'cash' ? 'เงินสด' : 'โอน' }})</span>
            </div>
          </div>
          <div v-if="verifyingTransaction.destinationName">
            <div class="text-gray-500">ชื่อปลายทาง</div>
            <div class="font-medium text-gray-900">{{ verifyingTransaction.destinationName }}</div>
          </div>
          <div v-if="verifyingTransaction.destinationIdentifier">
            <div class="text-gray-500">หมายเลขบัญชี</div>
            <div class="font-medium text-gray-900">{{ verifyingTransaction.destinationIdentifier }}</div>
          </div>
          <div v-if="verifyingTransaction.customerName">
            <div class="text-gray-500">ชื่อลูกค้า</div>
            <div class="font-medium text-gray-900">{{ verifyingTransaction.customerName }}</div>
          </div>
        </div>

        <div v-if="verifyingTransaction.notes" class="bg-gray-50 rounded-lg p-3">
          <div class="text-gray-500 mb-1">หมายเหตุ</div>
          <div class="text-gray-900">{{ verifyingTransaction.notes }}</div>
        </div>

        <!-- Balance Impact -->
        <div v-if="verifyingTransaction.balanceImpact && verifyingTransaction.status === 'completed'" class="border-t border-gray-100 pt-3">
          <div class="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">ผลกระทบต่อยอดเงิน</div>
          <div class="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div class="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium pb-1 border-b border-gray-200">
              <span>บัญชี</span>
              <span class="text-right">ก่อน</span>
              <span class="text-right">หลัง</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินในบัญชี</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.bankAccountBefore) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.bankAccountAfter >= verifyingTransaction.balanceImpact.bankAccountBefore ? 'text-gray-900' : 'text-red-600'">
                {{ formatCurrency(verifyingTransaction.balanceImpact.bankAccountAfter) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินสด (โอน/ถอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.transferCashBefore) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.transferCashAfter >= verifyingTransaction.balanceImpact.transferCashBefore ? 'text-green-700' : 'text-gray-900'">
                {{ formatCurrency(verifyingTransaction.balanceImpact.transferCashAfter) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">ค่าบริการ (เงินสด)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeBeforeCash) }}</span>
              <span class="text-right font-semibold text-green-700">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeAfterCash) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">ค่าบริการ (โอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeBeforeTransfer) }}</span>
              <span class="text-right font-semibold text-green-700">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeAfterTransfer) }}</span>
            </div>
          </div>
        </div>

        <!-- Issue toggle (only when not yet audited) -->
        <div v-if="!store.isAudited" class="border-t border-gray-100 pt-3">
          <div class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">ผลการตรวจสอบ</div>
          <div class="flex gap-2">
            <button
              :class="[
                'flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors',
                !txnIssueStatus[verifyingTransaction.id]
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
              ]"
              @click="() => { if (txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >
              ✅ ถูกต้อง
            </button>
            <button
              :class="[
                'flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors',
                txnIssueStatus[verifyingTransaction.id]
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50',
              ]"
              @click="() => { if (!txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
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

    <!-- Approve Confirm Dialog -->
    <ConfirmDialog
      :open="showApproveConfirm"
      title="ยืนยันการตรวจสอบ"
      message="ยืนยันผลการ Audit และส่งให้ Owner อนุมัติหรือไม่?"
      confirm-text="ยืนยันการตรวจสอบ"
      cancel-text="ยกเลิก"
      variant="success"
      @confirm="handleApproveAudit"
      @cancel="showApproveConfirm = false"
    />

    <!-- Reject Confirm Dialog -->
    <ConfirmDialog
      :open="showRejectConfirm"
      title="ส่งคืนให้ Manager แก้ไข"
      message="ต้องการส่งคืนรายการนี้ให้ Manager แก้ไขหรือไม่? กรุณาระบุรายละเอียดปัญหาในช่องด้านบนก่อน"
      confirm-text="ส่งคืนแก้ไข"
      cancel-text="ยกเลิก"
      variant="warning"
      @confirm="handleRejectAudit"
      @cancel="showRejectConfirm = false"
    />
  </PageWrapper>
</template>
