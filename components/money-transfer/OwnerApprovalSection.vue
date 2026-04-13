<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { ROLES } from '~/types/permissions'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  isNeedsCorrection: boolean
}>()

const logger = useLogger('OwnerApprovalSection')
const store = useMoneyTransferStore()
const { hasAnyRole } = usePermissions()

const isOwner = computed(() => hasAnyRole([ROLES.OWNER]))

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Decision state ───────────────────────────────────────────────────────────
type CardDecision = 'approved' | 'approved_with_notes' | 'needs_correction'
const decisionCard = ref<CardDecision | null>(null)
const pendingDecision = ref<CardDecision | null>(null)
const pendingNotes = ref('')
const showConfirmDialog = ref(false)
const isSubmitting = ref(false)

const { formatCurrency, formatDatetime, formatTime, getStatusBadgeVariant, getStatusLabel, getTransactionTypeLabel } = useMoneyTransferHelpers()

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))

// ─── Step 2 diffs ─────────────────────────────────────────────────────────────
const step2 = computed(() => store.currentSummary?.step2)
const step2Diff = computed(() => step2.value?.differences?.total ?? 0)

// ─── Audit data ───────────────────────────────────────────────────────────────
const auditData = computed(() => store.currentSummary?.auditorVerification)
const auditHasIssues = computed(() => auditData.value?.auditResult !== 'no_issues')

// ─── Step 1 summary items ─────────────────────────────────────────────────────
const step1Badge = computed(() => {
  const s1 = store.currentSummary?.step1
  if (!s1) return undefined
  return {
    label: `${s1.completedTransactions} / ${s1.totalTransactions} รายการ สำเร็จ`,
    variant: 'success' as const,
  }
})

const step1SummaryItems = computed(() => {
  const s1 = store.currentSummary?.step1
  if (!s1) return []
  return [
    { label: 'ยอดรวมโอน', value: formatCurrency(s1.totalAmount), colorClass: 'bg-blue-50' },
    { label: 'ค่าบริการ', value: formatCurrency(s1.totalCommission), colorClass: 'bg-green-50' },
    { label: 'Draft / ยกเลิก', value: `${s1.draftTransactions} รายการ`, colorClass: s1.draftTransactions > 0 ? 'bg-yellow-50' : 'bg-gray-50' },
  ]
})

// ─── Step 2 summary items ─────────────────────────────────────────────────────
const step2Badge = computed(() => {
  if (!step2.value) return undefined
  const variant: 'warning' | 'success' = step2.value.hasDiscrepancies ? 'warning' : 'success'
  return {
    label: step2.value.hasDiscrepancies ? 'มีส่วนต่าง ⚠️' : 'ตรงกัน ✅',
    variant,
  }
})

const step2SummaryItems = computed(() => {
  if (!step2.value) return []
  const diff = step2Diff.value
  return [
    { label: 'คาดหวัง', value: formatCurrency(step2.value.expectedCash?.total ?? 0), colorClass: 'bg-gray-50' },
    { label: 'นับจริง', value: formatCurrency(step2.value.actualCash?.total ?? 0), colorClass: 'bg-gray-50' },
    {
      label: 'ส่วนต่าง',
      value: diff === 0 ? '0 ฿' : (diff > 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`),
      colorClass: diff === 0 ? 'bg-green-50' : 'bg-yellow-50',
    },
  ]
})

// ─── Audit summary items ──────────────────────────────────────────────────────
const auditBadge = computed(() => {
  if (!auditData.value) return undefined
  const variant: 'warning' | 'success' = auditHasIssues.value ? 'warning' : 'success'
  return {
    label: auditHasIssues.value ? 'มีปัญหา ⚠️' : 'ผ่าน ✅',
    variant,
  }
})

const auditSummaryItems = computed(() => {
  const a = auditData.value
  if (!a) return []
  return [
    { label: 'Auditor', value: a.completedByName ?? '-', colorClass: 'bg-indigo-50' },
    { label: 'Bank Statement', value: formatCurrency(a.bankStatementAmount ?? 0), colorClass: 'bg-blue-50' },
    { label: 'รายการที่ตรวจ', value: `${a.transactionsVerified} รายการ`, colorClass: 'bg-gray-50' },
    { label: 'พบปัญหา', value: `${a.transactionsWithIssues} รายการ`, colorClass: a.transactionsWithIssues > 0 ? 'bg-orange-50' : 'bg-gray-50' },
  ]
})

// ─── Confirm dialog helpers ────────────────────────────────────────────────────
const confirmTitle = computed(() => {
  if (pendingDecision.value === 'needs_correction') return 'ยืนยันส่งคืนแก้ไข?'
  if (pendingDecision.value === 'approved_with_notes') return 'ยืนยันการอนุมัติพร้อมหมายเหตุ?'
  return 'ยืนยันการอนุมัติ?'
})

const confirmMessage = computed(() => {
  if (pendingDecision.value === 'needs_correction') return 'ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?'
  return 'ต้องการอนุมัติรายการประจำวันนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้'
})

const confirmText = computed(() => {
  if (pendingDecision.value === 'needs_correction') return 'ส่งคืนแก้ไข'
  return 'ยืนยันอนุมัติ'
})

const confirmVariant = computed(() =>
  pendingDecision.value === 'needs_correction' ? 'danger' : 'warning'
)

// ─── Decision mapping: OwnerDecisionCard → MT API ─────────────────────────────
const decisionApiMap: Record<CardDecision, string> = {
  approved: 'approve',
  approved_with_notes: 'approve_with_notes',
  needs_correction: 'request_correction',
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
function handleDecisionSubmit(decision: CardDecision, notes: string) {
  pendingDecision.value = decision
  pendingNotes.value = notes
  showConfirmDialog.value = true
}

async function handleConfirmedSubmit() {
  if (!pendingDecision.value) return
  isSubmitting.value = true
  try {
    await store.submitOwnerApproval(props.date, {
      decision: decisionApiMap[pendingDecision.value],
      ownerNotes: pendingNotes.value || undefined,
    })
    const labels: Record<CardDecision, string> = {
      approved: 'อนุมัติเรียบร้อยแล้ว ✅',
      approved_with_notes: 'อนุมัติพร้อมหมายเหตุเรียบร้อยแล้ว ✅',
      needs_correction: 'ส่งคืนแก้ไขเรียบร้อย',
    }
    successMessage.value = labels[pendingDecision.value]
    showConfirmDialog.value = false
    decisionCard.value = null
    logger.log('Owner approval submitted', { decision: pendingDecision.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to submit owner approval', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="mb-4">
    <BaseAlert v-if="successMessage" variant="success" :message="successMessage" :auto-close="true" class="mb-4" @close="successMessage = ''" />
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-base font-semibold text-gray-700">✅ การอนุมัติ Owner</h2>
      <BaseBadge v-if="store.isApproved" variant="success" size="sm">✅ อนุมัติแล้ว</BaseBadge>
      <BaseBadge v-else variant="warning" size="sm">⏳ รออนุมัติ</BaseBadge>
    </div>

    <!-- Already Approved Banner -->
    <div v-if="store.isApproved" class="rounded-xl border border-green-200 bg-green-50 p-6 mb-6 flex items-start gap-4">
      <CheckCircleIcon class="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-green-800 text-lg">อนุมัติแล้ว ✅</p>
        <p class="text-sm text-green-700 mt-1">วันที่ {{ date }} — ได้รับการอนุมัติเรียบร้อยแล้ว</p>
        <p v-if="store.currentSummary?.ownerApproval?.ownerNotes" class="text-sm text-green-700 mt-1">
          หมายเหตุ: {{ store.currentSummary?.ownerApproval?.ownerNotes }}
        </p>
      </div>
    </div>

    <!-- Needs Correction Banner -->
    <BaseAlert
      v-if="isNeedsCorrection && !store.isApproved"
      variant="warning"
      message="ส่งคืนแก้ไขแล้ว — รอ Auditor/Manager ดำเนินการ"
      class="mb-4"
    />

    <!-- ── Step 1 Summary Card ──────────────────────────────────────────────── -->
    <WorkflowStepSummaryCard
      :step-number="1"
      title="Manager บันทึกรายการ"
      :badge="step1Badge"
      :summary-items="step1SummaryItems"
      class="mb-3"
    >
      <EmptyState v-if="dateTransactions.length === 0" title="ไม่มีรายการ" />
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-gray-500 text-xs">
            <th class="py-2 text-left font-medium">#</th>
            <th class="py-2 text-left font-medium">เวลา</th>
            <th class="py-2 text-left font-medium">ประเภท</th>
            <th class="py-2 text-right font-medium">จำนวน</th>
            <th class="py-2 text-right font-medium">ค่าบริการ</th>
            <th class="py-2 text-center font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(txn, idx) in dateTransactions"
            :key="txn.id"
            class="border-b border-gray-100 last:border-0"
          >
            <td class="py-2 text-gray-400">{{ Number(idx) + 1 }}</td>
            <td class="py-2 text-gray-600">{{ formatTime(txn.timestamp) }}</td>
            <td class="py-2 text-gray-800">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
            <td class="py-2 text-right font-medium text-gray-900">{{ formatCurrency(txn.amount) }}</td>
            <td class="py-2 text-right text-green-700">{{ formatCurrency(txn.commission ?? 0) }}</td>
            <td class="py-2 text-center">
              <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm">
                {{ getStatusLabel(txn.status) }}
              </BaseBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </WorkflowStepSummaryCard>

    <!-- ── Step 2 Summary Card ──────────────────────────────────────────────── -->
    <WorkflowStepSummaryCard
      :step-number="2"
      title="Manager ตรวจนับเงิน"
      :badge="step2Badge"
      :summary-items="step2SummaryItems"
      class="mb-3"
    >
      <div v-if="step2" class="space-y-3 text-sm">
        <!-- Breakdown grid -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">ถอน/โอน คาดหวัง</p>
            <p class="font-medium text-gray-900">{{ formatCurrency(step2.expectedCash?.transferWithdrawal ?? 0) }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">ค่าบริการ คาดหวัง</p>
            <p class="font-medium text-gray-900">{{ formatCurrency(step2.expectedCash?.serviceFee ?? 0) }}</p>
          </div>
          <div :class="step2Diff === 0 ? 'bg-green-50' : 'bg-yellow-50'" class="rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">ส่วนต่างรวม</p>
            <p class="font-medium" :class="step2Diff === 0 ? 'text-green-700' : 'text-yellow-700'">
              {{ step2Diff === 0 ? '0 ฿' : (step2Diff > 0 ? `+${formatCurrency(step2Diff)}` : `-${formatCurrency(Math.abs(step2Diff))}`) }}
            </p>
          </div>
        </div>
        <div v-if="step2.verificationNotes" class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 mb-1">หมายเหตุ</p>
          <p class="text-gray-700 whitespace-pre-wrap">{{ step2.verificationNotes }}</p>
        </div>
      </div>
      <EmptyState v-else title="ยังไม่มีข้อมูลตรวจนับ" />
    </WorkflowStepSummaryCard>

    <!-- ── Audit Summary Card ───────────────────────────────────────────────── -->
    <WorkflowStepSummaryCard
      :step-number="3"
      title="ผลการตรวจสอบ Auditor"
      :badge="auditBadge"
      :summary-items="auditSummaryItems"
      class="mb-4"
    >
      <div v-if="auditData" class="space-y-3 text-sm">
        <div class="bg-gray-50 rounded-lg p-3 space-y-2">
          <div v-if="auditData.completedAt" class="flex justify-between">
            <span class="text-gray-500">เวลาตรวจสอบ</span>
            <span class="text-gray-700">{{ formatDatetime(auditData.completedAt as string) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Bank Balance ตรงกัน</span>
            <BaseBadge :variant="auditData.bankBalanceMatches ? 'success' : 'warning'" size="sm">
              {{ auditData.bankBalanceMatches ? '✅ ตรงกัน' : '⚠️ ไม่ตรงกัน' }}
            </BaseBadge>
          </div>
        </div>
        <div v-if="auditData.auditNotes" class="bg-blue-50 rounded-lg p-3">
          <p class="text-xs text-blue-600 mb-1 font-medium">หมายเหตุ Auditor</p>
          <p class="text-gray-700 whitespace-pre-wrap">{{ auditData.auditNotes }}</p>
        </div>
        <div v-if="auditData.issuesFound && auditData.issuesFound.length > 0" class="bg-orange-50 rounded-lg p-3">
          <p class="text-xs text-orange-600 mb-2 font-medium">ปัญหาที่พบ</p>
          <ul class="space-y-1">
            <li v-for="(issue, i) in auditData.issuesFound" :key="i" class="text-sm text-gray-700">• {{ issue }}</li>
          </ul>
        </div>
        <div v-if="store.currentSummary?.correctionNotes" class="bg-red-50 rounded-lg p-3">
          <p class="text-xs text-red-600 mb-1 font-medium">หมายเหตุส่งคืนแก้ไข</p>
          <p class="text-gray-700 whitespace-pre-wrap">{{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
      <EmptyState v-else title="ยังไม่มีข้อมูล Audit" />
    </WorkflowStepSummaryCard>

    <!-- ── Owner Decision Card (only when not yet approved) ────────────────── -->
    <section v-if="!store.isApproved" class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 class="font-semibold text-gray-900">การตัดสินใจของ Owner</h3>
      </div>
      <div class="p-4">
        <OwnerDecisionCard
          v-model="decisionCard"
          :is-submitting="isSubmitting"
          @submit="handleDecisionSubmit"
        />
      </div>
    </section>

    <!-- ── Confirm Dialog ──────────────────────────────────────────────────── -->
    <ConfirmDialog
      :open="showConfirmDialog"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmText"
      :variant="confirmVariant"
      :loading="isSubmitting"
      @confirm="handleConfirmedSubmit"
      @cancel="showConfirmDialog = false"
    />
  </section>
</template>
