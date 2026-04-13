<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { ROLES } from '~/types/permissions'
import type { WorkflowStep } from '~/components/shared/WorkflowProgressBar.vue'
import type { BillPaymentWorkflowStatus } from '~/types/bill-payment'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('BillPaymentIndex')
const store = useBillPaymentStore()
const router = useRouter()
const route = useRoute()
const { hasAnyRole } = usePermissions()
const { currentUser } = useCurrentUser()

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

// ─── Workflow ─────────────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isStep1InProgress = computed(() => workflowStatus.value === 'step1_in_progress')
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')
const isApproved = computed(() => store.isApproved)

// ─── Workflow Progress Bar config ─────────────────────────────────────────────
const BP_WORKFLOW_STEPS: WorkflowStep[] = [
  { label: 'บันทึก', shortLabel: 'บันทึก', key: 'record' },
  { label: 'ตรวจนับ', shortLabel: 'นับ', key: 'verify' },
  { label: 'Auditor', shortLabel: 'Audit', key: 'audit' },
  { label: 'Owner', shortLabel: 'Owner', key: 'approve' },
]

const BP_STATUS_TO_STEP_MAP: Record<BillPaymentWorkflowStatus, number> = {
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
  if (ws === 'step1_in_progress')
    return { title: '⏳ Manager กำลังบันทึกรายการ', description: 'Manager/AM กำลังบันทึกรายการรับชำระบิลประจำวัน', classes: 'border-blue-200 bg-blue-50 text-blue-800' }
  if (ws === 'step1_completed')
    return { title: '⏳ รอ Manager ตรวจนับเงินสด', description: 'Manager/AM กำลังดำเนินการตรวจนับเงินสด (Step 2)', classes: 'border-blue-200 bg-blue-50 text-blue-800' }
  if (ws === 'step2_completed' || ws === 'step2_completed_with_notes')
    return { title: '⏳ รอ Auditor ตรวจสอบ', description: 'รายการนี้อยู่ระหว่างรอการตรวจสอบจาก Auditor', classes: 'border-orange-200 bg-orange-50 text-orange-800' }
  if ((ws === 'audited' || ws === 'audited_with_issues') && !isOwner.value)
    return { title: '⏳ รอ Owner อนุมัติ', description: 'รายการนี้ผ่านการตรวจสอบแล้ว อยู่ระหว่างรอ Owner อนุมัติ', classes: 'border-yellow-200 bg-yellow-50 text-yellow-800' }
  if (ws === 'needs_correction')
    return {
      title: '🔄 รอแก้ไข',
      description: isAuditor.value
        ? 'Owner ส่งคืนให้ตรวจสอบใหม่ — กรุณาตรวจสอบและส่งผลอีกครั้ง'
        : 'Owner ส่งคืนให้ Auditor ตรวจสอบใหม่ — รอ Auditor ดำเนินการ',
      classes: 'border-red-200 bg-red-50 text-red-800',
    }
  return null
})

// ─── Date change ──────────────────────────────────────────────────────────────
async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchBalanceByDate(selectedDate.value)
    await store.initDailySummary(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
    logger.error('handleDateChange failed', err)
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.initializeStore()
    if (selectedDate.value) {
      await store.fetchTransactionsByDate(selectedDate.value)
      await store.fetchBalanceByDate(selectedDate.value)
      await store.initDailySummary(selectedDate.value)
      await store.fetchDailySummary(selectedDate.value)
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
    logger.error('onMounted failed', err)
  }
})
</script>

<template>
  <PageWrapper
    title="บริการรับชำระบิล"
    description="บันทึกรายการและตรวจนับเงินสด"
    icon="💳"
    :loading="store.isLoading"
    :error="store.error ?? undefined"
  >
    <template #actions>
      <BaseButton variant="secondary" size="sm" @click="router.push('/finance/bill-payment-history')">
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

    <!-- ── Workflow Progress Bar ──────────────────────────────────────────────── -->
    <WorkflowProgressBar
      v-if="!(isManagerOrAsst && isStep1InProgress) && !isApproved"
      :steps="BP_WORKFLOW_STEPS"
      :current-status="workflowStatus"
      :status-to-step-map="BP_STATUS_TO_STEP_MAP"
      class="mb-4"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Owner Approval Section (placed first — most important for Owner role)  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BillPaymentOwnerApprovalSection
      v-if="(isOwner && store.isAudited) || isApproved"
      :date="selectedDate"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Manager Recording Section (Step 1)                                     -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BillPaymentManagerRecordingSection
      v-if="isManagerOrAsst"
      :date="selectedDate"
      :current-user="currentUser"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Cash Verification Section (Step 2)                                     -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BillPaymentCashVerificationSection
      v-if="isManagerOrAsst && store.isStep1Complete"
      :date="selectedDate"
      :current-user="currentUser"
    />

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Auditor Review Section                                                  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BillPaymentAuditorReviewSection
      v-if="isAuditor"
      :date="selectedDate"
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
