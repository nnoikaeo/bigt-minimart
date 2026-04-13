<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { ROLES } from '~/types/permissions'
import type { TableColumn } from '~/components/shared/TransactionTable.vue'
import type { CashVerificationRow } from '~/components/shared/CashVerificationTable.vue'
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  isNeedsCorrection: boolean
}>()

const logger = useLogger('AuditorReviewSection')
const store = useMoneyTransferStore()
const { hasAnyRole } = usePermissions()

const isAuditor = computed(() => hasAnyRole([ROLES.AUDITOR]))

// ─── Alert ────────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Auditor form state ───────────────────────────────────────────────────────
const txnIssueStatus = ref<Record<string, true>>({})
const auditorCashTransferWithdrawal = ref<number | null>(null)
const auditorCashServiceFee = ref<number | null>(null)
const bankStatementAmount = ref<number>(0)
const issueDetails = ref('')
const showAuditorTransactions = ref(false)
const showAuditorTxnsReadonly = ref(false)
const showAuditApproveConfirm = ref(false)
const showAuditWithIssuesConfirm = ref(false)
const showAuditRejectConfirm = ref(false)
const isSubmittingAction = ref(false)

// ─── Verify modal ─────────────────────────────────────────────────────────────
const showVerifyModal = ref(false)
const verifyingTransaction = ref<any>(null)

// ─── Sticky action bar ────────────────────────────────────────────────────────
const auditorActionsRef = ref<HTMLElement | null>(null)
const isAuditorActionsVisible = ref(true)
let stickyObserver: IntersectionObserver | null = null

// ─── Helpers ──────────────────────────────────────────────────────────────────
const {
  formatCurrency,
  formatTime,
  formatDatetime,
  getTransactionTypeLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  getAccountName,
  getChannelSubtitle,
  formatDiff,
} = useMoneyTransferHelpers()

// ─── Derived from transactions ────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))
const completedTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'completed')
)
const auditTransactionList = computed(() =>
  dateTransactions.value.filter((t: any) =>
    t.status === 'completed' || t.status === 'on_hold' || t.status === 'cancelled'
  )
)

const expectedTransferWithdrawal = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.transactionType !== 'owner_deposit')
    .reduce((sum: number, t: any) => {
      if (t.transactionType === 'transfer') return sum + t.amount
      if (t.transactionType === 'withdrawal') return sum - t.amount
      return sum
    }, 0)
)
const expectedServiceFee = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'cash')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)

const txnsWithIssues = computed(() => Object.keys(txnIssueStatus.value).length)
const canSubmitAudit = computed(
  () => auditorCashTransferWithdrawal.value !== null && auditorCashServiceFee.value !== null
)
const canSubmitAuditWithIssues = computed(
  () => canSubmitAudit.value && issueDetails.value.trim() !== ''
)
const openingBalance = computed(() => store.currentBalance?.openingBalance ?? 0)
const closingBalance = computed(
  () => store.currentSummary?.step1?.finalBalances?.bankAccount ?? store.currentBalance?.bankAccount ?? 0
)
const step2Data = computed(() => store.currentSummary?.step2)
const auditData = computed(() => store.currentSummary?.auditorVerification)

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
const auditorCashTotal = computed(
  () => (auditorCashTransferWithdrawal.value ?? 0) + (auditorCashServiceFee.value ?? 0)
)
const auditorDiffTotal = computed(() =>
  auditorDiffTransferWithdrawal.value !== null || auditorDiffServiceFee.value !== null
    ? (auditorDiffTransferWithdrawal.value ?? 0) + (auditorDiffServiceFee.value ?? 0)
    : null
)
const bankBalanceDiff = computed(() => bankStatementAmount.value - closingBalance.value)

const auditResultSummary = computed(() => {
  const audit = store.currentSummary?.auditorVerification
  const issues = audit?.transactionsWithIssues ?? 0
  const expected = store.currentSummary?.step2?.expectedCash?.total ?? 0
  const auditorTotal = audit?.auditorCash?.total ?? expected
  const hasCashDiff = auditorTotal !== expected
  const parts: string[] = []
  parts.push(issues > 0 ? `${issues} รายการมีปัญหา` : 'ไม่พบปัญหา')
  parts.push(hasCashDiff ? 'ยอดไม่ตรงกัน' : 'ยอดตรงกัน')
  return parts.join(' · ')
})

const mtAuditCashVerificationRows = computed<CashVerificationRow[]>(() => {
  const s2 = step2Data.value?.actualCash
  const aud = auditData.value?.auditorCash
  return [
    { label: 'A. เงินสดจากโอน/ถอนเงิน', expected: expectedTransferWithdrawal.value, managerActual: s2?.transferWithdrawal ?? null, auditorActual: aud?.transferWithdrawal ?? null },
    { label: 'B. ค่าบริการ (เงินสด)', expected: expectedServiceFee.value, managerActual: s2?.serviceFee ?? null, auditorActual: aud?.serviceFee ?? null },
  ]
})

const showStickyAuditorActions = computed(
  () => store.isStep2Complete && (!store.isAudited || props.isNeedsCorrection) && !isAuditorActionsVisible.value
)

const mtColumns: TableColumn[] = [
  { key: 'datetime', label: 'เวลา', formatter: (_v, row) => formatTime(row.datetime) },
  { key: 'transactionType', label: 'ประเภท', tdClass: 'font-medium text-gray-900', formatter: (v) => getTransactionTypeLabel(v) },
  { key: 'accountName', label: 'ชื่อบัญชี', component: 'account-name', hideOnMobile: true },
  { key: 'amount', label: 'จำนวนเงิน', align: 'right', tdClass: 'font-semibold text-gray-900', formatter: (v) => formatCurrency(v) },
  { key: 'commission', label: 'ค่าบริการ', align: 'right', component: 'commission' },
  { key: 'status', label: 'สถานะ', align: 'center', component: 'status' },
]

// ─── Pre-fill when returning to needs_correction ──────────────────────────────
watch(() => store.currentSummary, (summary) => {
  if (summary?.workflowStatus === 'needs_correction' && summary.auditorVerification) {
    const audit = summary.auditorVerification
    if (audit.auditorCash) {
      auditorCashTransferWithdrawal.value = audit.auditorCash.transferWithdrawal ?? null
      auditorCashServiceFee.value = audit.auditorCash.serviceFee ?? null
    }
    bankStatementAmount.value = audit.bankStatementAmount ?? 0
    issueDetails.value = audit.auditNotes || ''
    if (audit.txnIssueStatus) {
      txnIssueStatus.value = { ...audit.txnIssueStatus }
    }
  }
}, { immediate: true })

// ─── Sticky observer ──────────────────────────────────────────────────────────
onMounted(() => {
  stickyObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === auditorActionsRef.value) {
        isAuditorActionsVisible.value = entry.isIntersecting
      }
    }
  }, { threshold: 0.1 })
})

watch(auditorActionsRef, (el, oldEl) => {
  if (oldEl) stickyObserver?.unobserve(oldEl)
  if (el) stickyObserver?.observe(el)
})

onBeforeUnmount(() => {
  stickyObserver?.disconnect()
  stickyObserver = null
})

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

async function handleApproveAudit() {
  if (!canSubmitAudit.value) return
  isSubmittingAction.value = true
  try {
    const hasIssues = issueDetails.value.trim() !== '' || txnsWithIssues.value > 0
    await store.submitAudit(props.date, {
      transactionsVerified: auditTransactionList.value.length,
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
      txnIssueStatus: Object.keys(txnIssueStatus.value).length > 0 ? { ...txnIssueStatus.value } : undefined,
    })
    successMessage.value = 'Audit เสร็จสมบูรณ์ — ส่งให้ Owner อนุมัติได้เลย'
    showAuditApproveConfirm.value = false
    logger.log('Audit completed')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete audit', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function handleAuditWithIssues() {
  if (!canSubmitAuditWithIssues.value) return
  isSubmittingAction.value = true
  try {
    await store.submitAudit(props.date, {
      transactionsVerified: auditTransactionList.value.length,
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
      outcome: 'audited_with_issues',
      auditResult: 'minor_issues',
      auditNotes: issueDetails.value,
      issuesFound: issueDetails.value,
      txnIssueStatus: Object.keys(txnIssueStatus.value).length > 0 ? { ...txnIssueStatus.value } : undefined,
    })
    successMessage.value = 'ส่งให้ Owner อนุมัติแล้ว (มีหมายเหตุ)'
    showAuditWithIssuesConfirm.value = false
    logger.log('Audit completed with issues')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete audit with issues', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function handleRejectAudit() {
  isSubmittingAction.value = true
  try {
    await store.submitAudit(props.date, {
      transactionsVerified: auditTransactionList.value.length,
      transactionsWithIssues: txnsWithIssues.value,
      bankStatementVerified: bankStatementAmount.value > 0,
      auditResult: 'rejected',
      auditNotes: issueDetails.value || 'ส่งคืน Manager เพื่อแก้ไข',
      issuesFound: issueDetails.value || 'ส่งคืนแก้ไข',
    })
    successMessage.value = 'ส่งคืน Manager เพื่อแก้ไขแล้ว'
    showAuditRejectConfirm.value = false
    logger.log('Audit rejected')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to reject audit', err)
  } finally {
    isSubmittingAction.value = false
  }
}
</script>

<template>
  <div>
    <BaseAlert v-if="successMessage" variant="success" :message="successMessage" :auto-close="true" class="mb-4" @close="successMessage = ''" />
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Auditor Active Form                                                    -->
    <!-- Visible: Auditor + (step2 complete & NOT audited) OR needs_correction  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <section v-if="store.isStep2Complete && (!store.isAudited || isNeedsCorrection)" class="mt-6">
      <!-- Owner correction reason banner -->
      <div v-if="isNeedsCorrection && store.currentSummary?.ownerApproval?.ownerNotes" class="mb-4 p-4 rounded-xl border border-red-200 bg-red-50">
        <div class="flex items-start gap-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold text-red-800 text-sm">Owner ขอให้แก้ไข</p>
            <p class="text-sm text-red-700 mt-1">{{ store.currentSummary.ownerApproval.ownerNotes }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-base font-semibold text-gray-700">🔍 ตรวจสอบบริการโอนเงิน</h2>
        <BaseBadge v-if="isNeedsCorrection" variant="error" size="sm">🔄 ตรวจสอบใหม่</BaseBadge>
        <BaseBadge v-else variant="warning" size="sm">⏳ รอตรวจสอบ</BaseBadge>
      </div>

      <!-- Balance Snapshot + Bank Statement input -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h3>
        <BalanceSnapshot :opening-balance="openingBalance" :closing-balance="closingBalance">
          <div class="grid grid-cols-2 gap-4 text-sm">
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
        </BalanceSnapshot>
      </div>

      <!-- Transaction List (Collapsible) -->
      <div class="mb-5">
        <button
          class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          :class="showAuditorTransactions ? 'rounded-b-none border-b-0' : ''"
          @click="showAuditorTransactions = !showAuditorTransactions"
        >
          <div class="flex items-center gap-3">
            <component :is="showAuditorTransactions ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ auditTransactionList.length }} รายการ</span>
          </div>
          <BaseBadge :variant="txnsWithIssues > 0 ? 'warning' : 'success'" size="sm">
            {{ txnsWithIssues > 0 ? `⚠️ ${txnsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showAuditorTransactions" class="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
          <TransactionTable
            :transactions="auditTransactionList"
            :columns="mtColumns"
            :issued-ids="txnIssueStatus"
            empty-message="ยังไม่มีรายการธุรกรรมสำหรับวันนี้"
            @row-click="openVerifyModal"
          >
            <template #action-header>จัดการ</template>
            <template #col-account-name="{ row }">
              <div class="text-gray-900 text-sm">{{ getAccountName(row) }}</div>
              <div v-if="getChannelSubtitle(row)" class="text-xs text-gray-400 mt-0.5">{{ getChannelSubtitle(row) }}</div>
            </template>
            <template #col-commission="{ row }">
              <template v-if="row.transactionType !== 'owner_deposit'">
                {{ row.commission ? formatCurrency(row.commission) : '-' }}
                <span v-if="row.commissionType" class="text-xs text-gray-400 ml-1">{{ row.commissionType === 'cash' ? 'C' : 'T' }}</span>
              </template>
              <template v-else>-</template>
            </template>
            <template #col-status="{ row }">
              <div class="flex flex-col items-center gap-1">
                <BaseBadge :variant="getStatusBadgeVariant(row.status)" size="sm" dot>{{ getStatusLabel(row.status) }}</BaseBadge>
                <BaseBadge v-if="txnIssueStatus[row.id]" variant="warning" size="sm">พบปัญหา</BaseBadge>
              </div>
            </template>
            <template #actions="{ txn }">
              <button class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="ดูรายละเอียด" @click="openVerifyModal(txn)">
                <EyeIcon class="w-4 h-4" />
              </button>
              <button
                :class="['px-2 py-1 rounded-lg text-xs font-medium transition-colors border', txnIssueStatus[txn.id] ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50']"
                @click="toggleTxnIssue(txn.id)"
              >
                <template v-if="txnIssueStatus[txn.id]">ยกเลิก</template>
                <template v-else>
                  <ExclamationTriangleIcon class="w-3.5 h-3.5 inline mr-0.5" />
                  มีปัญหา
                </template>
              </button>
            </template>
          </TransactionTable>
          <div v-if="auditTransactionList.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>รวม {{ auditTransactionList.length }} รายการ</span>
            <span v-if="txnsWithIssues > 0" class="text-amber-700 font-medium">⚠️ พบปัญหา {{ txnsWithIssues }} รายการ</span>
            <span v-else class="text-green-700">✅ ไม่พบปัญหา</span>
          </div>
        </div>
      </div>

      <!-- Auditor Cash Count Table -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ตรวจสอบยอดเงินสด</h3>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="overflow-x-auto">
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
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">เงินสดโอน/ถอน</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedTransferWithdrawal) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.transferWithdrawal ?? 0) }}</td>
                  <td class="py-2 px-4 text-right">
                    <input v-model.number="auditorCashTransferWithdrawal" type="number" min="0" placeholder="0" class="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500" />
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="['font-medium text-sm', auditorDiffTransferWithdrawal === null ? 'text-gray-400' : auditorDiffTransferWithdrawal === 0 ? 'text-green-700' : 'text-red-700']">
                      {{ formatDiff(auditorDiffTransferWithdrawal) }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">ค่าบริการเงินสด</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedServiceFee) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.serviceFee ?? 0) }}</td>
                  <td class="py-2 px-4 text-right">
                    <input v-model.number="auditorCashServiceFee" type="number" min="0" placeholder="0" class="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500" />
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="['font-medium text-sm', auditorDiffServiceFee === null ? 'text-gray-400' : auditorDiffServiceFee === 0 ? 'text-green-700' : 'text-red-700']">
                      {{ formatDiff(auditorDiffServiceFee) }}
                    </span>
                  </td>
                </tr>
                <tr class="bg-gray-50 font-semibold border-t border-gray-200">
                  <td class="py-2 pr-4 text-gray-800">รวม</td>
                  <td class="py-2 px-4 text-right text-gray-800">{{ formatCurrency(step2Data?.expectedCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(auditorCashTotal) }}</td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="['font-medium text-sm', auditorDiffTotal === null ? 'text-gray-400' : auditorDiffTotal === 0 ? 'text-green-700' : 'text-red-700 font-bold']">
                      {{ formatDiff(auditorDiffTotal) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Issue Details -->
      <div class="mb-6">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">รายละเอียดปัญหาที่พบ (ถ้ามี)</h3>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <BaseTextarea v-model="issueDetails" placeholder="ระบุปัญหาที่พบ เช่น รายการที่ X ยอดเงินไม่ตรงกับ Bank Statement... (ว่างได้ถ้าไม่พบปัญหา)" :rows="3" />
        </div>
      </div>

      <div v-if="txnsWithIssues > 0" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
        ⚠️ พบ {{ txnsWithIssues }} รายการมีปัญหาในรายการธุรกรรม
      </div>

      <!-- Action Buttons -->
      <div ref="auditorActionsRef" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <BaseButton variant="danger" :disabled="isNeedsCorrection" @click="showAuditRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <div class="flex flex-col sm:flex-row gap-3">
          <BaseButton
            variant="secondary"
            class="border-amber-400 text-amber-700 hover:bg-amber-50"
            :disabled="!canSubmitAuditWithIssues"
            :title="!canSubmitAuditWithIssues ? 'กรอกรายละเอียดปัญหาก่อน' : ''"
            @click="showAuditWithIssuesConfirm = true"
          >
            <ExclamationTriangleIcon class="w-4 h-4" />
            ยืนยันพร้อมหมายเหตุ
          </BaseButton>
          <BaseButton variant="success" :disabled="!canSubmitAudit" @click="showAuditApproveConfirm = true">
            <CheckCircleIcon class="w-4 h-4" />
            {{ isNeedsCorrection ? 'ส่งตรวจสอบใหม่' : 'ยืนยันการตรวจสอบ' }}
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Audit Result — Read-only CollapsibleSection                            -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <CollapsibleSection
      v-if="store.isAudited && !(isAuditor && isNeedsCorrection)"
      icon="🔍"
      title="ผลตรวจสอบ Auditor"
      :badge="{ label: '✅ ตรวจสอบแล้ว', variant: 'success' }"
      :summary="auditResultSummary"
      :expanded="isAuditor"
      class="mt-4"
    >
      <!-- Balance Snapshot read-only -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h3>
        <BalanceSnapshot :opening-balance="openingBalance" :closing-balance="closingBalance">
          <div class="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-wrap">
            <span class="text-sm text-gray-600">รายการเดินบัญชี:</span>
            <template v-if="auditData?.bankStatementAmount">
              <span class="text-sm font-semibold text-blue-800">{{ formatCurrency(auditData.bankStatementAmount) }}</span>
              <span class="text-gray-400 text-xs">(Auditor กรอก)</span>
            </template>
            <BaseBadge :variant="auditData?.bankStatementVerified ? 'success' : 'warning'" size="sm">
              {{ auditData?.bankStatementVerified ? '✅ ตรวจสอบแล้ว' : '⚠️ ไม่ได้ตรวจสอบ' }}
            </BaseBadge>
          </div>
        </BalanceSnapshot>
      </div>

      <!-- Transaction List read-only -->
      <div class="mb-5">
        <button
          class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          :class="showAuditorTxnsReadonly ? 'rounded-b-none border-b-0' : ''"
          @click="showAuditorTxnsReadonly = !showAuditorTxnsReadonly"
        >
          <div class="flex items-center gap-3">
            <component :is="showAuditorTxnsReadonly ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ auditTransactionList.length }} รายการ</span>
          </div>
          <BaseBadge :variant="(auditData?.transactionsWithIssues ?? 0) > 0 ? 'warning' : 'success'" size="sm">
            {{ (auditData?.transactionsWithIssues ?? 0) > 0 ? `⚠️ ${auditData?.transactionsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showAuditorTxnsReadonly" class="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
          <TransactionTable
            :transactions="auditTransactionList"
            :columns="mtColumns"
            :issued-ids="auditData?.txnIssueStatus"
            empty-message="ยังไม่มีรายการธุรกรรมสำหรับวันนี้"
          >
            <template #col-account-name="{ row }">
              <div class="text-gray-900 text-sm">{{ getAccountName(row) }}</div>
              <div v-if="getChannelSubtitle(row)" class="text-xs text-gray-400 mt-0.5">{{ getChannelSubtitle(row) }}</div>
            </template>
            <template #col-commission="{ row }">
              <template v-if="row.transactionType !== 'owner_deposit'">
                {{ row.commission ? formatCurrency(row.commission) : '-' }}
                <span v-if="row.commissionType" class="text-xs text-gray-400 ml-1">{{ row.commissionType === 'cash' ? 'C' : 'T' }}</span>
              </template>
              <template v-else>-</template>
            </template>
            <template #col-status="{ row }">
              <div class="flex flex-col items-center gap-1">
                <BaseBadge :variant="getStatusBadgeVariant(row.status)" size="sm" dot>{{ getStatusLabel(row.status) }}</BaseBadge>
                <BaseBadge v-if="auditData?.txnIssueStatus?.[row.id]" variant="warning" size="sm">พบปัญหา</BaseBadge>
              </div>
            </template>
          </TransactionTable>
          <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>ตรวจสอบ <strong class="text-gray-900">{{ auditData?.transactionsVerified ?? 0 }}</strong> รายการ</span>
              <span :class="(auditData?.transactionsWithIssues ?? 0) > 0 ? 'text-amber-700 font-medium' : ''">
                มีปัญหา <strong>{{ auditData?.transactionsWithIssues ?? 0 }}</strong> รายการ
              </span>
              <span class="text-gray-400">·</span>
              <span class="text-xs text-gray-500">
                โดย <strong class="text-gray-700">{{ auditData?.completedByName ?? '-' }}</strong>
                <template v-if="auditData?.completedAt"> · {{ formatDatetime(auditData?.completedAt as string) }}</template>
              </span>
            </div>
            <div v-if="auditData?.auditNotes" class="text-xs text-gray-500">
              หมายเหตุ: <span class="text-gray-700">{{ auditData.auditNotes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cash Verification (Manager + Auditor columns) -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ตรวจสอบยอดเงินสด</h3>
        <CashVerificationTable :rows="mtAuditCashVerificationRows" mode="full-readonly" />
      </div>
    </CollapsibleSection>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Sticky Action Bar (mobile)                                             -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showStickyAuditorActions"
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between gap-2 z-50 sm:hidden"
      >
        <BaseButton variant="danger" size="sm" :disabled="isNeedsCorrection" @click="showAuditRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="sm"
          class="border-amber-400 text-amber-700 hover:bg-amber-50"
          :disabled="!canSubmitAuditWithIssues"
          @click="showAuditWithIssuesConfirm = true"
        >
          <ExclamationTriangleIcon class="w-4 h-4" />
          ยืนยัน+หมายเหตุ
        </BaseButton>
        <BaseButton variant="success" size="sm" :disabled="!canSubmitAudit" @click="showAuditApproveConfirm = true">
          <CheckCircleIcon class="w-4 h-4" />
          {{ isNeedsCorrection ? 'ส่งใหม่' : 'ยืนยัน' }}
        </BaseButton>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Verify Transaction Modal (Auditor)                                     -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showVerifyModal" size="md" @close="showVerifyModal = false">
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">รายละเอียดรายการ</h2>
          <BaseBadge v-if="verifyingTransaction" :variant="getStatusBadgeVariant(verifyingTransaction.status)" size="md" dot>
            {{ getStatusLabel(verifyingTransaction.status) }}
          </BaseBadge>
        </div>
      </template>
      <div v-if="verifyingTransaction" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <template v-if="verifyingTransaction.channel === 'bank' || verifyingTransaction.channel === 'other'">
            <div class="col-span-2"><div class="text-gray-500">ธนาคาร</div><div class="font-medium text-gray-900">{{ verifyingTransaction.bankName || '-' }}</div></div>
            <div><div class="text-gray-500">เลขบัญชี</div><div class="font-medium text-gray-900">{{ verifyingTransaction.accountNumber || '-' }}</div></div>
            <div><div class="text-gray-500">ชื่อบัญชี</div><div class="font-medium text-gray-900">{{ verifyingTransaction.accountName || '-' }}</div></div>
          </template>
          <template v-else-if="verifyingTransaction.channel === 'promptpay'">
            <div class="col-span-2"><div class="text-gray-500">ช่องทาง</div><div class="font-medium text-gray-900">พร้อมเพย์</div></div>
            <div><div class="text-gray-500">{{ verifyingTransaction.promptpayIdentifierType === 'idcard' ? 'เลขบัตรประชาชน' : 'หมายเลขโทรศัพท์' }}</div><div class="font-medium text-gray-900">{{ verifyingTransaction.promptpayIdentifier || '-' }}</div></div>
            <div><div class="text-gray-500">ชื่อบัญชี</div><div class="font-medium text-gray-900">{{ verifyingTransaction.promptpayAccountName || verifyingTransaction.accountName || '-' }}</div></div>
          </template>
          <div><div class="text-gray-500">ประเภท</div><div class="font-medium text-gray-900">{{ getTransactionTypeLabel(verifyingTransaction.transactionType) }}</div></div>
          <div><div class="text-gray-500">วันที่/เวลา</div><div class="font-medium text-gray-900">{{ formatDatetime(verifyingTransaction.datetime) }}</div></div>
          <div><div class="text-gray-500">จำนวนเงิน</div><div class="font-bold text-gray-900 text-base">{{ formatCurrency(verifyingTransaction.amount) }}</div></div>
          <div v-if="verifyingTransaction.commission && verifyingTransaction.transactionType !== 'owner_deposit'">
            <div class="text-gray-500">ค่าบริการ</div>
            <div class="font-medium text-green-700">{{ formatCurrency(verifyingTransaction.commission) }} <span class="text-xs text-gray-400">({{ verifyingTransaction.commissionType === 'cash' ? 'เงินสด' : 'โอน' }})</span></div>
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
              <span>บัญชี</span><span class="text-right">ก่อน</span><span class="text-right">หลัง</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินในบัญชี</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.bankAccountBefore) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.bankAccountAfter === verifyingTransaction.balanceImpact.bankAccountBefore ? 'text-gray-900' : verifyingTransaction.balanceImpact.bankAccountAfter > verifyingTransaction.balanceImpact.bankAccountBefore ? 'text-green-700' : 'text-red-600'">{{ formatCurrency(verifyingTransaction.balanceImpact.bankAccountAfter) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินสด (โอน/ถอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.transferCashBefore) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.transferCashAfter === verifyingTransaction.balanceImpact.transferCashBefore ? 'text-gray-900' : verifyingTransaction.balanceImpact.transferCashAfter > verifyingTransaction.balanceImpact.transferCashBefore ? 'text-green-700' : 'text-red-600'">{{ formatCurrency(verifyingTransaction.balanceImpact.transferCashAfter) }}</span>
            </div>
          </div>
        </div>
        <!-- Issue toggle (only when not yet audited) -->
        <div v-if="!store.isAudited" class="border-t border-gray-100 pt-3">
          <div class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">ผลการตรวจสอบ</div>
          <div class="flex gap-2">
            <button
              :class="['flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors', !txnIssueStatus[verifyingTransaction.id] ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-50']"
              @click="() => { if (txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >✅ ถูกต้อง</button>
            <button
              :class="['flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors', txnIssueStatus[verifyingTransaction.id] ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-300 hover:bg-red-50']"
              @click="() => { if (!txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >⚠️ มีปัญหา</button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showVerifyModal = false">ปิด</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Audit Approve Confirm -->
    <ConfirmDialog
      :open="showAuditApproveConfirm"
      title="ยืนยันการตรวจสอบ"
      message="ยืนยันผลการ Audit และส่งให้ Owner อนุมัติหรือไม่?"
      confirm-text="ยืนยันการตรวจสอบ"
      cancel-text="ยกเลิก"
      variant="success"
      :loading="isSubmittingAction"
      @confirm="handleApproveAudit"
      @cancel="showAuditApproveConfirm = false"
    />

    <!-- Audit With Issues Confirm -->
    <ConfirmDialog
      :open="showAuditWithIssuesConfirm"
      title="ยืนยันพร้อมหมายเหตุ"
      message="ยืนยันผลการ Audit (มีปัญหา/หมายเหตุ) และส่งให้ Owner อนุมัติหรือไม่? Owner จะเห็นหมายเหตุที่ระบุไว้"
      confirm-label="ยืนยัน"
      variant="warning"
      :loading="isSubmittingAction"
      @confirm="handleAuditWithIssues"
      @cancel="showAuditWithIssuesConfirm = false"
    />

    <!-- Audit Reject Confirm -->
    <ConfirmDialog
      :open="showAuditRejectConfirm"
      title="ส่งคืนให้ Manager แก้ไข"
      message="ต้องการส่งคืนรายการนี้ให้ Manager แก้ไขหรือไม่? กรุณาระบุรายละเอียดปัญหาในช่องด้านบนก่อน"
      confirm-text="ส่งคืนแก้ไข"
      cancel-text="ยกเลิก"
      variant="warning"
      :loading="isSubmittingAction"
      @confirm="handleRejectAudit"
      @cancel="showAuditRejectConfirm = false"
    />
  </div>
</template>
