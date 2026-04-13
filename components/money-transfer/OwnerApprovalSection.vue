<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS, ROLES } from '~/types/permissions'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

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
const decision = ref<'approve' | 'approve_with_notes' | 'request_correction' | ''>('')
const ownerNotes = ref('')
const correctionReason = ref('')
const showOwnerApproveConfirm = ref(false)
const showOwnerRejectConfirm = ref(false)
const isSubmittingAction = ref(false)

// ─── Sticky action bar ────────────────────────────────────────────────────────
const ownerActionsRef = ref<HTMLElement | null>(null)
const isOwnerActionsVisible = ref(true)
let stickyObserver: IntersectionObserver | null = null

const { formatCurrency, formatDatetime } = useMoneyTransferHelpers()

// ─── Computed ─────────────────────────────────────────────────────────────────
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

const showStickyOwnerActions = computed(
  () => store.isAudited && !store.isApproved && !props.isNeedsCorrection && !isOwnerActionsVisible.value
)

// ─── Pre-fill when returning to needs_correction ──────────────────────────────
watch(() => store.currentSummary, (summary) => {
  if (summary?.workflowStatus === 'needs_correction' && summary.ownerApproval) {
    decision.value = 'request_correction'
    correctionReason.value = summary.ownerApproval.ownerNotes || ''
  }
}, { immediate: true })

// ─── Sticky observer ──────────────────────────────────────────────────────────
onMounted(() => {
  stickyObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === ownerActionsRef.value) {
        isOwnerActionsVisible.value = entry.isIntersecting
      }
    }
  }, { threshold: 0.1 })
})

watch(ownerActionsRef, (el, oldEl) => {
  if (oldEl) stickyObserver?.unobserve(oldEl)
  if (el) stickyObserver?.observe(el)
})

onBeforeUnmount(() => {
  stickyObserver?.disconnect()
  stickyObserver = null
})

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleSubmitApproval() {
  if (!canApprove.value) return
  isSubmittingAction.value = true
  try {
    await store.submitOwnerApproval(props.date, {
      decision: decision.value,
      ownerNotes: decision.value === 'request_correction'
        ? (correctionReason.value || 'ขอให้แก้ไข')
        : ownerNotes.value,
    })
    successMessage.value = decision.value === 'request_correction' ? 'ส่งคืนแก้ไขเรียบร้อย' : 'อนุมัติเรียบร้อยแล้ว ✅'
    showOwnerApproveConfirm.value = false
    logger.log('Owner approval submitted', { decision: decision.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to submit owner approval', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function handleRequestCorrection() {
  isSubmittingAction.value = true
  try {
    await store.submitOwnerApproval(props.date, {
      decision: 'request_correction',
      ownerNotes: correctionReason.value || 'ขอให้แก้ไข',
    })
    successMessage.value = 'ส่งคืนแก้ไขเรียบร้อย'
    showOwnerRejectConfirm.value = false
    logger.log('Owner requested correction')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to request correction', err)
  } finally {
    isSubmittingAction.value = false
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
        <p class="text-sm text-green-700 mt-1">วันที่ {{ date }} — ได้รับการอนุมัติจาก Owner เรียบร้อยแล้ว</p>
        <p v-if="store.currentSummary?.ownerApproval?.ownerNotes" class="text-sm text-green-700 mt-1">
          หมายเหตุ: {{ store.currentSummary?.ownerApproval?.ownerNotes }}
        </p>
      </div>
    </div>

    <!-- Audit Summary (when waiting for owner approval) -->
    <div v-if="!store.isApproved && auditData" class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div class="flex items-center gap-3 mb-3">
        <div class="flex items-center gap-3 p-3 rounded-lg border flex-1" :class="auditResultLabel.containerClass">
          <CheckCircleIcon class="w-5 h-5 shrink-0" />
          <div>
            <p class="font-semibold text-sm">ผล Audit: {{ auditResultLabel.text }}</p>
            <p class="text-xs opacity-80 mt-0.5">
              โดย {{ auditData?.completedByName ?? '-' }}
              <template v-if="auditData?.completedAt"> · {{ formatDatetime(auditData?.completedAt as string) }}</template>
            </p>
          </div>
        </div>
      </div>
      <div v-if="auditData?.auditNotes" class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <span class="text-xs text-gray-400 block mb-1">หมายเหตุ Auditor:</span>
        {{ auditData.auditNotes }}
      </div>
    </div>

    <!-- Owner Decision Card (only when not yet approved) -->
    <section v-if="!store.isApproved" class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600" />
        <h3 class="font-semibold text-gray-900">การตัดสินใจของ Owner</h3>
      </div>
      <div class="p-4 space-y-3">
        <div class="grid grid-cols-3 gap-2">
          <label
            class="flex flex-col gap-1 p-3 rounded-lg border transition-colors"
            :class="[decision === 'approve' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300', isNeedsCorrection ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
          >
            <div class="flex items-center gap-2">
              <input v-model="decision" type="radio" value="approve" class="accent-green-600 shrink-0" :disabled="isNeedsCorrection" />
              <p class="font-medium text-sm text-gray-900">อนุมัติ ✅</p>
            </div>
            <p class="text-xs text-gray-500 pl-5">บันทึกเป็นที่สิ้นสุด</p>
          </label>
          <label
            class="flex flex-col gap-1 p-3 rounded-lg border transition-colors"
            :class="[decision === 'approve_with_notes' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300', isNeedsCorrection ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
          >
            <div class="flex items-center gap-2">
              <input v-model="decision" type="radio" value="approve_with_notes" class="accent-blue-600 shrink-0" :disabled="isNeedsCorrection" />
              <p class="font-medium text-sm text-gray-900">อนุมัติพร้อมหมายเหตุ</p>
            </div>
            <p class="text-xs text-gray-500 pl-5">มีข้อสังเกตเพิ่มเติม</p>
          </label>
          <label
            class="flex flex-col gap-1 p-3 rounded-lg border transition-colors"
            :class="[decision === 'request_correction' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300', isNeedsCorrection ? 'cursor-not-allowed' : 'cursor-pointer']"
          >
            <div class="flex items-center gap-2">
              <input v-model="decision" type="radio" value="request_correction" class="accent-red-600 shrink-0" :disabled="isNeedsCorrection" />
              <p class="font-medium text-sm text-gray-900">ขอให้แก้ไข</p>
            </div>
            <p class="text-xs text-gray-500 pl-5">ส่งคืน Auditor/Manager</p>
          </label>
        </div>
        <div v-if="decision === 'approve_with_notes'">
          <BaseTextarea v-model="ownerNotes" placeholder="ระบุหมายเหตุหรือข้อสังเกต..." :rows="2" />
        </div>
        <div v-if="decision === 'request_correction'">
          <BaseTextarea v-model="correctionReason" placeholder="ระบุสิ่งที่ต้องแก้ไข..." :rows="2" :disabled="isNeedsCorrection" />
        </div>
      </div>
    </section>

    <!-- Action Buttons (hidden when already sent for correction) -->
    <div v-if="!store.isApproved && !isNeedsCorrection" ref="ownerActionsRef" class="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
      <BaseButton variant="danger" :disabled="isSubmittingAction" @click="showOwnerRejectConfirm = true">
        <XCircleIcon class="w-4 h-4" />
        ส่งคืนแก้ไข
      </BaseButton>
      <ActionButton
        :permission="PERMISSIONS.EDIT_FINANCE"
        variant="primary"
        :loading="isSubmittingAction"
        :disabled="!canApprove || isSubmittingAction"
        @click="showOwnerApproveConfirm = true"
      >
        <CheckCircleIcon class="w-4 h-4" />
        {{ decision === 'request_correction' ? 'ส่งคืน' : 'อนุมัติ ✅' }}
      </ActionButton>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Sticky Action Bar (mobile)                                             -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showStickyOwnerActions"
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between z-50 sm:hidden"
      >
        <BaseButton variant="danger" size="sm" :disabled="isSubmittingAction" @click="showOwnerRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <ActionButton
          :permission="PERMISSIONS.EDIT_FINANCE"
          variant="primary"
          size="sm"
          :loading="isSubmittingAction"
          :disabled="!canApprove || isSubmittingAction"
          @click="showOwnerApproveConfirm = true"
        >
          <CheckCircleIcon class="w-4 h-4" />
          {{ decision === 'request_correction' ? 'ส่งคืน' : 'อนุมัติ ✅' }}
        </ActionButton>
      </div>
    </Teleport>

    <!-- Owner Approve Confirm -->
    <ConfirmDialog
      :open="showOwnerApproveConfirm"
      :title="decision === 'request_correction' ? 'ยืนยันส่งคืนแก้ไข?' : 'ยืนยันการอนุมัติ?'"
      :message="decision === 'request_correction' ? 'ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?' : 'ต้องการอนุมัติรายการประจำวันนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้'"
      :confirm-text="decision === 'request_correction' ? 'ส่งคืนแก้ไข' : 'ยืนยันอนุมัติ'"
      :variant="decision === 'request_correction' ? 'danger' : 'warning'"
      :loading="isSubmittingAction"
      @confirm="handleSubmitApproval"
      @cancel="showOwnerApproveConfirm = false"
    />

    <!-- Owner Reject Confirm -->
    <ConfirmDialog
      :open="showOwnerRejectConfirm"
      title="ยืนยันส่งคืนแก้ไข?"
      message="ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?"
      confirm-text="ส่งคืน"
      variant="danger"
      :loading="isSubmittingAction"
      @confirm="handleRequestCorrection"
      @cancel="showOwnerRejectConfirm = false"
    />
  </section>
</template>
