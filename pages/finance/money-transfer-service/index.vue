<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useDailyRecordSettingsStore } from '~/stores/daily-record-settings'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { ROLES } from '~/types/permissions'
import type { UnifiedWorkflowStatus } from '~/types/shared-workflow'
import type { WorkflowStep } from '~/components/shared/WorkflowProgressBar.vue'
import type { BalanceCardItem } from '~/components/shared/CompactBalanceSummary.vue'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('MoneyTransferIndex')
const store = useMoneyTransferStore()
const settingsStore = useDailyRecordSettingsStore()
const router = useRouter()
const route = useRoute()
const { hasAnyRole } = usePermissions()
const { currentUser } = useCurrentUser()
const { formatCurrency } = useMoneyTransferHelpers()

// ─── Date ─────────────────────────────────────────────────────────────────────
const selectedDate = ref<string>(
  (route.query.date as string) || (new Date().toISOString().split('T')[0] ?? '')
)

// ─── Page-level alerts ────────────────────────────────────────────────────────
const errorMessage = ref('')

// ─── Role detection ───────────────────────────────────────────────────────────
const isManagerOrAsst = computed(() => hasAnyRole([ROLES.MANAGER, ROLES.ASSISTANT_MANAGER]))
const isAuditor = computed(() => hasAnyRole([ROLES.AUDITOR]))
const isOwner = computed(() => hasAnyRole([ROLES.OWNER]))
const isApproved = computed(() => store.isApproved)
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isStep1InProgress = computed(() => workflowStatus.value === 'step1_in_progress')
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')

// ─── Workflow Progress Bar config ─────────────────────────────────────────────
const MT_WORKFLOW_STEPS: WorkflowStep[] = [
  { label: 'บันทึก', shortLabel: 'บันทึก', key: 'record' },
  { label: 'ตรวจนับ', shortLabel: 'นับ', key: 'verify' },
  { label: 'ตรวจสอบ', shortLabel: 'ตรวจสอบ', key: 'audit' },
  { label: 'อนุมัติ', shortLabel: 'อนุมัติ', key: 'approve' },
]
const MT_STATUS_TO_STEP_MAP: Record<UnifiedWorkflowStatus, number> = {
  step1_in_progress: 0,
  step1_completed: 1,
  step2_completed: 2,
  step2_completed_with_notes: 2,
  audited: 3,
  audited_with_issues: 3,
  approved: 3,
  approved_with_notes: 3,
  needs_correction: 2,
}

// ─── CompactBalanceSummary cards (for non-manager views) ─────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(selectedDate.value))

const totalDeposits = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'owner_deposit' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
)
const totalTransfers = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'transfer' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
)
const totalWithdrawals = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'withdrawal' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
)
const totalCash = computed(() =>
  totalTransfers.value - totalWithdrawals.value + (store.currentBalance?.serviceFeeCash ?? 0)
)
const openingBalance = computed(() => store.currentBalance?.openingBalance ?? 0)
const openingSourceLabel = computed(() => {
  const map: Record<string, string> = { carryover: 'จากเมื่อวาน', manual: 'กำหนดเอง' }
  return map[store.currentBalance?.openingBalanceSource ?? ''] || ''
})
const totalCommission = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.status === 'completed' && t.transactionType !== 'owner_deposit')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)
const todayStats = computed(() => {
  const txns = dateTransactions.value
  return {
    total: txns.length,
    completed: txns.filter((t: any) => t.status === 'completed').length,
  }
})

const mtPrimaryCards = computed<BalanceCardItem[]>(() => [
  {
    label: 'เงินในบัญชีเริ่มต้น',
    value: openingBalance.value,
    colorClass: 'text-gray-700',
    subtitle: openingSourceLabel.value || undefined,
  },
  { label: 'รวมเงินโอน', value: totalTransfers.value, colorClass: 'text-red-600' },
  {
    label: 'เงินในบัญชีคงเหลือ',
    value: store.currentBalance?.bankAccount ?? 0,
    colorClass: 'text-gray-900',
    valueSize: 'text-xl',
    cardClass: 'border-gray-300 bg-gray-50',
    labelClass: 'text-gray-600 font-medium',
  },
  {
    label: 'เงินสดคงเหลือ',
    value: totalCash.value,
    colorClass: 'text-blue-800',
    cardClass: 'border-blue-200 bg-blue-50/40',
    labelClass: 'text-blue-600 font-medium',
  },
])
const mtSecondaryCards = computed<BalanceCardItem[]>(() => [
  { label: 'รวมเงินฝาก', value: totalDeposits.value, colorClass: 'text-blue-700' },
  { label: 'รวมเงินถอน', value: totalWithdrawals.value, colorClass: 'text-purple-700' },
  { label: 'รวมค่าบริการ (เงินสด)', value: store.currentBalance?.serviceFeeCash ?? 0, colorClass: 'text-green-700' },
  { label: 'รวมค่าบริการ (เงินโอน)', value: store.currentBalance?.serviceFeeTransfer ?? 0, colorClass: 'text-green-700' },
])

// ─── Status Banner ────────────────────────────────────────────────────────────
const showStatusBanner = computed(() => {
  if (isApproved.value) return false
  if (isAuditor.value && isNeedsCorrection.value) return false
  if (isManagerOrAsst.value && !isStep1InProgress.value && !store.isStep2Complete) return true
  if (isManagerOrAsst.value && store.isStep2Complete) return true
  if (isAuditor.value && (store.isAudited || !store.isStep2Complete)) return true
  if (isOwner.value && !store.isAudited) return true
  if (isNeedsCorrection.value) return true
  return false
})

const statusBannerContent = computed(() => {
  const ws = workflowStatus.value
  if (ws === 'step1_in_progress') return { title: '⏳ Manager กำลังบันทึกรายการ', description: 'Manager/AM กำลังบันทึกรายการโอนเงินประจำวัน', classes: 'border-blue-200 bg-blue-50 text-blue-800' }
  if (ws === 'step1_completed') return { title: '⏳ รอ Manager ตรวจนับเงินสด', description: 'Manager/AM กำลังดำเนินการตรวจนับเงินสด (Step 2)', classes: 'border-blue-200 bg-blue-50 text-blue-800' }
  if (ws === 'step2_completed') return { title: '⏳ รอ Auditor ตรวจสอบ', description: 'รายการนี้อยู่ระหว่างรอการตรวจสอบจาก Auditor', classes: 'border-orange-200 bg-orange-50 text-orange-800' }
  if (ws === 'audited' && !isOwner.value) return { title: '⏳ รอ Owner อนุมัติ', description: 'รายการนี้ผ่านการตรวจสอบแล้ว อยู่ระหว่างรอ Owner อนุมัติ', classes: 'border-yellow-200 bg-yellow-50 text-yellow-800' }
  if (ws === 'needs_correction') return {
    title: '🔄 รอแก้ไข',
    description: isAuditor.value ? 'Owner ส่งคืนให้ตรวจสอบใหม่ — กรุณาตรวจสอบและส่งผลอีกครั้ง' : 'Owner ส่งคืนให้ Auditor ตรวจสอบใหม่ — รอ Auditor ดำเนินการ',
    classes: 'border-red-200 bg-red-50 text-red-800',
  }
  return null
})

// ─── Date change ──────────────────────────────────────────────────────────────
async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchBalanceByDate(selectedDate.value)
    await store.fetchPreviousDayBalance(selectedDate.value)
    await store.initDailySummary(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.initializeStore()
    if (selectedDate.value) {
      await store.fetchTransactionsByDate(selectedDate.value)
      await store.fetchBalanceByDate(selectedDate.value)
      await store.fetchPreviousDayBalance(selectedDate.value)
      await store.initDailySummary(selectedDate.value)
      await store.fetchDailySummary(selectedDate.value)
    }
    await settingsStore.fetchMoneyTransferFees()
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  }
})
</script>

<template>
  <PageWrapper
    title="บริการโอนเงิน"
    description="บันทึกรายการและตรวจนับเงินสด"
    icon="🏦"
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

    <!-- Page-level error -->
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <!-- ── Workflow Progress Bar ──────────────────────────────────────────── -->
    <WorkflowProgressBar
      v-if="!isApproved"
      :steps="MT_WORKFLOW_STEPS"
      :current-status="workflowStatus"
      :status-to-step-map="MT_STATUS_TO_STEP_MAP"
      class="mb-4"
    />

    <!-- ── Quick Glance Summary ───────────────────────────────────────────── -->
    <QuickGlanceSummary
      v-if="!(isManagerOrAsst && isStep1InProgress)"
      :date="selectedDate"
      :total-transactions="todayStats.total"
      :success-count="todayStats.completed"
      :total-commission="totalCommission"
      :workflow-status="workflowStatus"
      class="mb-4"
    />

    <!-- ── Balance Cards — compact (non-manager step1 views) ─────────────── -->
    <CompactBalanceSummary
      v-if="!(isManagerOrAsst && isStep1InProgress)"
      :primary-cards="mtPrimaryCards"
      :secondary-cards="mtSecondaryCards"
      class="mb-6"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Owner Approval Section (placed first — most important for Owner role)  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <MoneyTransferOwnerApprovalSection
      v-if="(isOwner && store.isAudited) || isApproved"
      :date="selectedDate"
      :is-needs-correction="isNeedsCorrection"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Manager Recording Section                                              -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <MoneyTransferManagerRecordingSection
      v-if="isManagerOrAsst"
      :date="selectedDate"
      :current-user="currentUser"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Cash Verification Section (Step 2)                                     -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <MoneyTransferCashVerificationSection
      v-if="isManagerOrAsst && store.isStep1Complete"
      :date="selectedDate"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Auditor Review Section                                                  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <MoneyTransferAuditorReviewSection
      v-if="isAuditor"
      :date="selectedDate"
      :is-needs-correction="isNeedsCorrection"
    />

    <!-- ── Status Banner — no action available ────────────────────────────── -->
    <div
      v-if="showStatusBanner && statusBannerContent"
      class="rounded-xl border px-5 py-4 flex items-start gap-3 mb-4"
      :class="statusBannerContent.classes"
    >
      <div>
        <p class="font-semibold">{{ statusBannerContent.title }}</p>
        <p class="text-sm mt-0.5 opacity-80">{{ statusBannerContent.description }}</p>
      </div>
    </div>
  </PageWrapper>
</template>
