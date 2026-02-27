<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS } from '~/types/permissions'
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('OwnerApproval')
const store = useMoneyTransferStore()
const router = useRouter()
usePermissions()

// ─── State ───────────────────────────────────────────────────────────────────
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] ?? '')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Expandable sections
const expandStep1 = ref(false)
const expandStep2 = ref(false)
const expandAudit = ref(false)

// Owner decision
const decision = ref<'approve' | 'approve_with_notes' | 'request_correction' | ''>('')
const ownerNotes = ref('')
const correctionReason = ref('')

// Confirm dialogs
const showApproveConfirm = ref(false)
const showRejectConfirm = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────
const allTransactions = computed(() =>
  store.getTransactionsByDate(selectedDate.value)
)

const step2Data = computed(() => store.currentSummary?.step2)
const auditData = computed(() => store.currentSummary?.auditorVerification)

const auditResultLabel = computed(() => {
  const result = auditData.value?.auditResult
  if (result === 'no_issues') return { text: 'ไม่พบปัญหา', colorClass: 'text-green-700', containerClass: 'bg-green-50 border-green-200 text-green-700' }
  if (result === 'minor_issues') return { text: 'พบปัญหาเล็กน้อย', colorClass: 'text-yellow-700', containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
  if (result === 'major_issues') return { text: 'พบปัญหาสำคัญ', colorClass: 'text-red-700', containerClass: 'bg-red-50 border-red-200 text-red-700' }
  return { text: 'ตรวจสอบแล้ว', colorClass: 'text-blue-700', containerClass: 'bg-blue-50 border-blue-200 text-blue-700' }
})

const canApprove = computed(() =>
  decision.value !== '' &&
  (decision.value !== 'approve_with_notes' || ownerNotes.value.trim() !== '') &&
  (decision.value !== 'request_correction' || correctionReason.value.trim() !== '')
)

const totalCommission = computed(() =>
  allTransactions.value.reduce((sum: number, t: any) => sum + (t.commissionAmount ?? 0), 0)
)

const successCount = computed(() =>
  allTransactions.value.filter((t: any) => t.status === 'completed').length
)

const failedCount = computed(() =>
  allTransactions.value.filter((t: any) => t.status === 'failed').length
)

// ─── Methods ──────────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(value)
}

function formatDateTime(dt: string | Date | undefined): string {
  if (!dt) return '-'
  const str = typeof dt === 'string' ? dt : dt.toISOString()
  return new Date(str).toLocaleString('th-TH', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getTransactionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    promptpay: 'PromptPay',
    bank_transfer: 'โอนผ่านธนาคาร',
    withdrawal: 'ถอนเงิน',
    owner_deposit: 'Owner Deposit',
  }
  return map[type] ?? type
}

async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
    decision.value = ''
    ownerNotes.value = ''
    correctionReason.value = ''
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
}

async function handleSubmitApproval() {
  if (!canApprove.value) return
  isSubmitting.value = true
  try {
    await store.submitOwnerApproval(selectedDate.value, {
      decision: decision.value,
      ownerNotes: ownerNotes.value,
      correctionReason: correctionReason.value,
    })
    successMessage.value =
      decision.value === 'request_correction'
        ? 'ส่งคืนแก้ไขเรียบร้อย'
        : 'อนุมัติเรียบร้อยแล้ว ✅'
    showApproveConfirm.value = false
    logger.log('Owner approval submitted', { decision: decision.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to submit owner approval', err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleRequestCorrection() {
  isSubmitting.value = true
  try {
    await store.submitOwnerApproval(selectedDate.value, {
      decision: 'request_correction',
      correctionReason: correctionReason.value || 'ขอให้แก้ไข',
      ownerNotes: ownerNotes.value,
    })
    successMessage.value = 'ส่งคืนแก้ไขเรียบร้อย'
    showRejectConfirm.value = false
    logger.log('Owner requested correction')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to request correction', err)
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
    title="อนุมัติ Owner (WF 2.3)"
    description="ตรวจสอบและอนุมัติผลการนับเงินบริการโอนเงินประจำวัน"
    icon="✅"
    :loading="store.isLoading"
    :error="store.error"
  >
    <template #actions>
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

    <!-- Prerequisite: Auditor must have completed review -->
    <BaseAlert
      v-if="!store.isAudited"
      variant="warning"
      title="รอ Auditor ตรวจสอบ"
      message="กรุณารอให้ Auditor ดำเนินการ Workflow 2.2 ให้เสร็จสิ้นก่อน"
      :dismissible="false"
      class="mb-6"
    />

    <!-- Already Approved Banner -->
    <div v-if="store.isApproved" class="rounded-xl border border-green-200 bg-green-50 p-6 mb-6 flex items-start gap-4">
      <CheckCircleIcon class="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-green-800 text-lg">อนุมัติแล้ว ✅</p>
        <p class="text-sm text-green-700 mt-1">
          วันที่ {{ selectedDate }} — ได้รับการอนุมัติจาก Owner เรียบร้อยแล้ว
        </p>
        <p v-if="store.currentSummary?.ownerApproval?.ownerNotes" class="text-sm text-green-700 mt-1">
          หมายเหตุ: {{ store.currentSummary?.ownerApproval?.ownerNotes }}
        </p>
      </div>
    </div>

    <template v-if="store.isAudited">
      <!-- ─── Transaction Summary Card ─────────────────────────── -->
      <section class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <DocumentTextIcon class="w-5 h-5 text-gray-600" />
          <h2 class="font-semibold text-gray-900">สรุปรายการ</h2>
          <span class="ml-auto text-sm text-gray-500">{{ selectedDate }}</span>
        </div>

        <div class="p-6 space-y-6">
          <!-- Step 1 Summary -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
                <h3 class="font-medium text-gray-900">Step 1: Manager บันทึกรายการ</h3>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="text-gray-500">{{ allTransactions.length }} รายการ</span>
                <span class="text-green-700">{{ successCount }} สำเร็จ</span>
                <span v-if="failedCount" class="text-red-600">{{ failedCount }} ล้มเหลว</span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-blue-50 rounded-lg p-3 text-center">
                <p class="text-xs text-blue-600 mb-1">รายรับ Bank</p>
                <p class="font-semibold text-blue-900">{{ formatCurrency(store.currentBalance?.bankAccount ?? 0) }} ฿</p>
              </div>
              <div class="bg-green-50 rounded-lg p-3 text-center">
                <p class="text-xs text-green-600 mb-1">เงินสดจากโอน</p>
                <p class="font-semibold text-green-900">{{ formatCurrency(store.currentBalance?.transferCash ?? 0) }} ฿</p>
              </div>
              <div class="bg-yellow-50 rounded-lg p-3 text-center">
                <p class="text-xs text-yellow-600 mb-1">ค่าบริการ (เงินสด)</p>
                <p class="font-semibold text-yellow-900">{{ formatCurrency(store.currentBalance?.serviceFeeCash ?? 0) }} ฿</p>
              </div>
              <div class="bg-purple-50 rounded-lg p-3 text-center">
                <p class="text-xs text-purple-600 mb-1">ค่าบริการ (โอน)</p>
                <p class="font-semibold text-purple-900">{{ formatCurrency(store.currentBalance?.serviceFeeTransfer ?? 0) }} ฿</p>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <BanknotesIcon class="w-4 h-4 text-gray-500" />
              <span>ค่าบริการรวม: <span class="font-semibold text-gray-900">{{ formatCurrency(totalCommission) }} บาท</span></span>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Step 2 Summary -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">2</span>
              <h3 class="font-medium text-gray-900">Step 2: Manager ตรวจนับเงิน</h3>
            </div>
            <div v-if="step2Data" class="space-y-2 text-sm">
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-600">เงินสดโอน/ถอน (นับจริง A)</span>
                <span class="font-medium">{{ formatCurrency(step2Data.actualCash?.transferWithdrawal ?? 0) }} ฿</span>
              </div>
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-600">ค่าบริการเงินสด (นับจริง B)</span>
                <span class="font-medium">{{ formatCurrency(step2Data.actualCash?.serviceFee ?? 0) }} ฿</span>
              </div>
              <div
                class="flex items-center justify-between py-1.5 px-3 rounded-lg"
                :class="step2Data.hasDiscrepancies ? 'bg-yellow-50' : 'bg-green-50'"
              >
                <span class="text-gray-600">ผลการตรวจนับ</span>
                <BaseBadge :variant="step2Data.hasDiscrepancies ? 'warning' : 'success'" size="sm">
                  {{ step2Data.hasDiscrepancies ? 'มีส่วนต่าง ⚠️' : 'ตรงกัน ✅' }}
                </BaseBadge>
              </div>
              <div v-if="step2Data.verificationNotes" class="py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-500 text-xs">หมายเหตุ Step 2:</span>
                <p class="text-gray-700 mt-0.5">{{ step2Data.verificationNotes }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">ไม่มีข้อมูล Step 2</p>
          </div>

          <hr class="border-gray-100" />

          <!-- Auditor Summary -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <ShieldCheckIcon class="w-5 h-5 text-indigo-600" />
              <h3 class="font-medium text-gray-900">Auditor Verification (WF 2.2)</h3>
            </div>
            <div v-if="auditData" class="space-y-2 text-sm">
              <div
                class="flex items-center gap-3 p-3 rounded-lg border"
                :class="auditResultLabel.containerClass"
              >
                <CheckCircleIcon class="w-5 h-5 shrink-0" />
                <div>
                  <p class="font-semibold">{{ auditResultLabel.text }}</p>
                  <p class="text-xs opacity-80 mt-0.5">Audited {{ formatDateTime(auditData.completedAt) }}</p>
                </div>
              </div>
              <div v-if="auditData.auditNotes" class="py-2 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-500 text-xs">Audit Notes:</span>
                <p class="text-gray-700 mt-0.5 whitespace-pre-wrap">{{ auditData.auditNotes }}</p>
              </div>
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-600">Bank Statement Verified</span>
                <span class="font-medium">{{ auditData.bankStatementVerified ? 'ใช่ ✅' : 'ไม่ใช่' }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">ไม่มีข้อมูล Audit</p>
          </div>
        </div>
      </section>

      <!-- ─── Expandable Detail Sections ────────────────────────── -->
      <section class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="font-semibold text-gray-900">รายละเอียดเพิ่มเติม</h2>
        </div>

        <!-- Step 1 Transaction List -->
        <div class="border-b border-gray-100">
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="expandStep1 = !expandStep1"
          >
            <div class="flex items-center gap-2">
              <DocumentTextIcon class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-900">Step 1 — รายการธุรกรรมทั้งหมด</span>
              <BaseBadge variant="default" size="sm">{{ allTransactions.length }} รายการ</BaseBadge>
            </div>
            <ChevronUpIcon v-if="expandStep1" class="w-4 h-4 text-gray-500" />
            <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
          </button>
          <div v-if="expandStep1" class="px-6 pb-4">
            <div class="overflow-x-auto rounded-lg border border-gray-200">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th class="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                    <th class="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                    <th class="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าบริการ</th>
                    <th class="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="(txn, idx) in allTransactions"
                    :key="txn.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-3 py-2.5 text-gray-500">{{ Number(idx) + 1 }}</td>
                    <td class="px-3 py-2.5 font-medium text-gray-900">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
                    <td class="px-3 py-2.5 text-right">{{ formatCurrency(txn.amount) }} ฿</td>
                    <td class="px-3 py-2.5 text-right">
                      <span v-if="txn.commissionAmount">{{ formatCurrency(txn.commissionAmount) }} ฿</span>
                      <span v-else class="text-gray-400">—</span>
                    </td>
                    <td class="px-3 py-2.5 text-center">
                      <BaseBadge
                        :variant="txn.status === 'completed' ? 'success' : txn.status === 'failed' ? 'error' : 'warning'"
                        size="sm"
                      >
                        {{ txn.status === 'completed' ? 'สำเร็จ' : txn.status === 'failed' ? 'ล้มเหลว' : 'รอ' }}
                      </BaseBadge>
                    </td>
                  </tr>
                  <tr v-if="!allTransactions.length">
                    <td colspan="5" class="px-3 py-6 text-center text-gray-400">ไม่มีรายการ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Step 2 Detail -->
        <div class="border-b border-gray-100">
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="expandStep2 = !expandStep2"
          >
            <div class="flex items-center gap-2">
              <BanknotesIcon class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-900">Step 2 — รายละเอียดการตรวจนับ</span>
            </div>
            <ChevronUpIcon v-if="expandStep2" class="w-4 h-4 text-gray-500" />
            <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
          </button>
          <div v-if="expandStep2" class="px-6 pb-4">
            <div v-if="step2Data" class="space-y-3 text-sm">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-xs text-gray-500 mb-1">ยอดที่ควรจะมี (A)</p>
                  <p class="font-medium">{{ formatCurrency(step2Data.expectedCash?.transferWithdrawal ?? 0) }} ฿</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-xs text-gray-500 mb-1">นับจริง (A)</p>
                  <p class="font-medium">{{ formatCurrency(step2Data.actualCash?.transferWithdrawal ?? 0) }} ฿</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-xs text-gray-500 mb-1">ยอดที่ควรจะมี (B)</p>
                  <p class="font-medium">{{ formatCurrency(step2Data.expectedCash?.serviceFee ?? 0) }} ฿</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-xs text-gray-500 mb-1">นับจริง (B)</p>
                  <p class="font-medium">{{ formatCurrency(step2Data.actualCash?.serviceFee ?? 0) }} ฿</p>
                </div>
              </div>
              <div v-if="step2Data.verificationNotes" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                <p class="text-gray-700">{{ step2Data.verificationNotes }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">ไม่มีข้อมูล</p>
          </div>
        </div>

        <!-- Audit Detail -->
        <div>
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="expandAudit = !expandAudit"
          >
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-900">Auditor — รายละเอียดการตรวจสอบ</span>
            </div>
            <ChevronUpIcon v-if="expandAudit" class="w-4 h-4 text-gray-500" />
            <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
          </button>
          <div v-if="expandAudit" class="px-6 pb-4">
            <div v-if="auditData" class="space-y-3 text-sm">
              <div class="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div class="flex justify-between">
                  <span class="text-gray-500">ผล Audit</span>
                  <span class="font-medium" :class="auditResultLabel.colorClass">{{ auditResultLabel.text }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Bank Statement Verified</span>
                  <span class="font-medium">{{ auditData.bankStatementVerified ? 'ใช่ ✅' : 'ไม่ใช่' }}</span>
                </div>
                <div v-if="auditData.completedAt" class="flex justify-between">
                  <span class="text-gray-500">เวลา Audit</span>
                  <span>{{ formatDateTime(auditData.completedAt) }}</span>
                </div>
              </div>
              <div v-if="auditData.auditNotes" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">Audit Notes</p>
                <p class="text-gray-700 whitespace-pre-wrap">{{ auditData.auditNotes }}</p>
              </div>
              <div v-if="auditData.issuesFound?.length" class="bg-yellow-50 rounded-lg p-3">
                <p class="text-xs text-yellow-600 mb-1">รายละเอียดปัญหา</p>
                <p class="text-yellow-800">{{ auditData.issuesFound?.join(', ') }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">ไม่มีข้อมูล</p>
          </div>
        </div>
      </section>

      <!-- ─── Owner Decision Card ────────────────────────────────── -->
      <section v-if="!store.isApproved" class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600" />
          <h2 class="font-semibold text-gray-900">การตัดสินใจของ Owner</h2>
        </div>

        <div class="p-6 space-y-4">
          <!-- Audit status chip -->
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-600">สถานะ Audit:</span>
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              :class="auditResultLabel.containerClass"
            >
              {{ auditResultLabel.text }}
            </span>
          </div>

          <!-- Decision Radio Options -->
          <div class="space-y-3">
            <!-- Option: Approve -->
            <label
              class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
              :class="decision === 'approve' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                v-model="decision"
                type="radio"
                value="approve"
                class="mt-0.5 accent-green-600"
              />
              <div>
                <p class="font-medium text-gray-900">อนุมัติ (Approve)</p>
                <p class="text-sm text-gray-500">ข้อมูลจะถูกบันทึกเป็นที่สิ้นสุด — Status: APPROVED ✅</p>
              </div>
            </label>

            <!-- Option: Approve with Notes -->
            <label
              class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
              :class="decision === 'approve_with_notes' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                v-model="decision"
                type="radio"
                value="approve_with_notes"
                class="mt-0.5 accent-blue-600"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">อนุมัติพร้อมหมายเหตุ (Approve with Notes)</p>
                <p class="text-sm text-gray-500">อนุมัติ แต่มีข้อสังเกตเพิ่มเติม</p>
                <div v-if="decision === 'approve_with_notes'" class="mt-3">
                  <BaseTextarea
                    v-model="ownerNotes"
                    placeholder="ระบุหมายเหตุหรือข้อสังเกต..."
                    :rows="3"
                  />
                </div>
              </div>
            </label>

            <!-- Option: Request Correction -->
            <label
              class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
              :class="decision === 'request_correction' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                v-model="decision"
                type="radio"
                value="request_correction"
                class="mt-0.5 accent-red-600"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">ขอให้แก้ไข (Request Correction)</p>
                <p class="text-sm text-gray-500">ส่งคืน Auditor/Manager เพื่อแก้ไข</p>
                <div v-if="decision === 'request_correction'" class="mt-3">
                  <BaseTextarea
                    v-model="correctionReason"
                    placeholder="ระบุสิ่งที่ต้องแก้ไข..."
                    :rows="3"
                  />
                </div>
              </div>
            </label>
          </div>

          <!-- Additional owner notes (shown when not approve_with_notes since that already has notes) -->
          <div v-if="decision !== 'approve_with_notes'" class="pt-2">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <BaseTextarea
              v-model="ownerNotes"
              placeholder="ความคิดเห็นของ Owner..."
              :rows="2"
            />
          </div>
        </div>
      </section>

      <!-- ─── Action Buttons ──────────────────────────────────────── -->
      <div v-if="!store.isApproved" class="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
        <BaseButton
          variant="secondary"
          @click="router.push('/finance/money-transfer-service/auditor-review')"
        >
          ⬅️ กลับหน้า Auditor
        </BaseButton>

        <div class="flex items-center gap-3">
          <BaseButton
            variant="danger"
            :disabled="isSubmitting"
            @click="showRejectConfirm = true"
          >
            <XCircleIcon class="w-4 h-4" />
            ส่งคืนแก้ไข
          </BaseButton>

          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="primary"
            :loading="isSubmitting"
            :disabled="!canApprove || isSubmitting"
            @click="showApproveConfirm = true"
          >
            <CheckCircleIcon class="w-4 h-4" />
            {{ decision === 'request_correction' ? 'ส่งคืน' : 'อนุมัติ ✅' }}
          </ActionButton>
        </div>
      </div>

      <!-- Approved state back button -->
      <div v-else class="flex justify-start py-4">
        <BaseButton
          variant="secondary"
          @click="router.push('/finance/money-transfer-service/transaction-recording')"
        >
          ⬅️ กลับหน้าหลัก
        </BaseButton>
      </div>
    </template>

    <!-- ─── Approve Confirm Dialog ─────────────────────────────── -->
    <ConfirmDialog
      :open="showApproveConfirm"
      :title="decision === 'request_correction' ? 'ยืนยันส่งคืนแก้ไข?' : 'ยืนยันการอนุมัติ?'"
      :message="decision === 'request_correction'
        ? 'ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?'
        : 'ต้องการอนุมัติรายการประจำวันนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้'"
      :confirm-label="decision === 'request_correction' ? 'ส่งคืนแก้ไข' : 'ยืนยันอนุมัติ'"
      :confirm-variant="decision === 'request_correction' ? 'danger' : 'primary'"
      :loading="isSubmitting"
      @confirm="handleSubmitApproval"
      @cancel="showApproveConfirm = false"
    />

    <!-- ─── Reject Confirm Dialog ──────────────────────────────── -->
    <ConfirmDialog
      :open="showRejectConfirm"
      title="ยืนยันส่งคืนแก้ไข?"
      message="ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?"
      confirm-label="ส่งคืน"
      confirm-variant="danger"
      :loading="isSubmitting"
      @confirm="handleRequestCorrection"
      @cancel="showRejectConfirm = false"
    />
  </PageWrapper>
</template>
