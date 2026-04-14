<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import { PERMISSIONS } from '~/types/permissions'
import type { BillPaymentTransaction, BillPaymentTransactionStatus } from '~/types/bill-payment'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  currentUser: { uid: string; displayName: string }
}>()

const emit = defineEmits<{
  'step1-completed': []
}>()

const logger = useLogger('BPManagerRecordingSection')
const store = useBillPaymentStore()
const { can } = usePermissions()
const {
  formatAmount,
  formatTime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
} = useBillPaymentHelpers()

// ─── Workflow ─────────────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')
const isStep1InProgress = computed(() => workflowStatus.value === 'step1_in_progress')

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))

const totalOwnerDeposit = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'owner_deposit' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0)
)

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Step 1 completion ────────────────────────────────────────────────────────
const isCompletingStep1 = ref(false)

// ─── Opening Balance ──────────────────────────────────────────────────────────
const showOpeningBalanceModal = ref(false)
const openingSource = ref<'carryover' | 'manual'>('carryover')
const manualOpeningAmount = ref<number>(0)
const isSettingOpeningBalance = ref(false)

const isOpeningSet = computed(() => store.currentBalance?.openingBalanceSource != null)
const carryoverAmount = computed(() => store.previousDayBalance?.bankAccount ?? 0)
const canCompleteStep1 = computed(
  () => isOpeningSet.value && dateTransactions.value.length > 0 && !isCompletingStep1.value
)

function openOpeningBalanceModal() {
  openingSource.value = 'carryover'
  manualOpeningAmount.value = 0
  showOpeningBalanceModal.value = true
}

async function handleSetOpeningBalance() {
  const amount = Number(
    openingSource.value === 'carryover' ? carryoverAmount.value : manualOpeningAmount.value
  )
  isSettingOpeningBalance.value = true
  try {
    await store.setOpeningBalance(props.date, amount, openingSource.value, props.currentUser.uid)
    showOpeningBalanceModal.value = false
    successMessage.value = `กำหนดยอดเงินเริ่มต้น ${formatAmount(amount)} สำเร็จ`
    logger.log('Opening balance set', { amount, source: openingSource.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to set opening balance', err)
  } finally {
    isSettingOpeningBalance.value = false
  }
}

// ─── Transaction modal ────────────────────────────────────────────────────────
const showTransactionModal = ref(false)
const editingTransaction = ref<BillPaymentTransaction | null>(null)

function openNewTransaction() {
  if (!isOpeningSet.value) {
    openOpeningBalanceModal()
    return
  }
  editingTransaction.value = null
  showTransactionModal.value = true
}

function openEditTransaction(txn: BillPaymentTransaction) {
  editingTransaction.value = txn
  showTransactionModal.value = true
}

function closeModal() {
  showTransactionModal.value = false
  editingTransaction.value = null
}

async function handleFormSubmit(formData: {
  transactionType: 'bill_payment' | 'owner_deposit'
  billType?: 'utility' | 'telecom' | 'insurance' | 'other'
  amount: number
  commission: number
  customerName?: string
  status: BillPaymentTransactionStatus
  statusNote?: string
  notes?: string
}) {
  errorMessage.value = ''
  try {
    const payload = {
      date: props.date,
      ...formData,
      recordedBy: props.currentUser.uid,
      recordedAt: new Date().toISOString(),
    }

    if (editingTransaction.value) {
      await store.updateTransaction(editingTransaction.value.id, payload)
      successMessage.value = 'แก้ไขรายการสำเร็จ'
    } else {
      await store.createTransaction(payload)
      successMessage.value = 'เพิ่มรายการสำเร็จ'
    }

    closeModal()
    logger.log('Transaction saved for', props.date)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleFormSubmit', err)
  }
}

// ─── Delete transaction ───────────────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deletingTransactionId = ref('')

function promptDelete(id: string) {
  deletingTransactionId.value = id
  showDeleteConfirm.value = true
}

async function handleDeleteExecute() {
  errorMessage.value = ''
  try {
    await store.deleteDraftTransaction(deletingTransactionId.value)
    successMessage.value = 'ลบรายการสำเร็จ'
    logger.log('Deleted transaction', deletingTransactionId.value)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ลบรายการไม่สำเร็จ'
    logger.error('handleDeleteExecute', err)
  } finally {
    showDeleteConfirm.value = false
    deletingTransactionId.value = ''
  }
}

// ─── Status change ────────────────────────────────────────────────────────────
const showStatusModal = ref(false)
const statusChangeTarget = ref<{ id: string; currentStatus: BillPaymentTransactionStatus } | null>(null)
const newStatus = ref<BillPaymentTransactionStatus>('completed')
const statusChangeNote = ref('')
const isChangingStatus = ref(false)

function openStatusModal(txnId: string, currentStatus: BillPaymentTransactionStatus) {
  statusChangeTarget.value = { id: txnId, currentStatus }
  newStatus.value = currentStatus
  statusChangeNote.value = ''
  showStatusModal.value = true
}

async function handleStatusChange() {
  if (!statusChangeTarget.value) return
  isChangingStatus.value = true
  errorMessage.value = ''
  try {
    await store.changeTransactionStatus(
      statusChangeTarget.value.id,
      newStatus.value,
      statusChangeNote.value || undefined
    )
    successMessage.value = 'เปลี่ยนสถานะรายการสำเร็จ'
    showStatusModal.value = false
    logger.log(`Status changed ${statusChangeTarget.value.id} → ${newStatus.value}`)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleStatusChange', err)
  } finally {
    isChangingStatus.value = false
  }
}

async function handleCompleteDraft(txnId: string) {
  errorMessage.value = ''
  try {
    await store.completeDraftTransaction(txnId)
    successMessage.value = 'ดำเนินการรายการสำเร็จ'
    logger.log('Draft completed', txnId)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleCompleteDraft', err)
  }
}

// ─── Complete Step 1 ──────────────────────────────────────────────────────────
async function handleCompleteStep1() {
  if (!canCompleteStep1.value || !can(PERMISSIONS.EDIT_FINANCE)) return
  isCompletingStep1.value = true
  errorMessage.value = ''
  try {
    await store.completeStep1(props.date)
    await store.fetchDailySummary(props.date)
    successMessage.value = 'ขั้นตอนที่ 1 เสร็จสมบูรณ์ กรุณาตรวจนับเงินสด'
    logger.log('Step 1 completed for', props.date)
    emit('step1-completed')
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ไม่สามารถดำเนินการได้'
    logger.error('handleCompleteStep1', err)
  } finally {
    isCompletingStep1.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await store.fetchPreviousDayBalance(props.date)
})
</script>

<template>
  <div>
    <!-- ── Alerts ──────────────────────────────────────────────────────────── -->
    <BaseAlert
      v-if="successMessage"
      variant="success"
      :message="successMessage"
      :auto-close="true"
      class="mb-4"
      @close="successMessage = ''"
    />
    <BaseAlert
      v-if="errorMessage"
      variant="error"
      :message="errorMessage"
      class="mb-4"
      @close="errorMessage = ''"
    />

    <!-- ── Needs Correction Banner ─────────────────────────────────────────── -->
    <div
      v-if="isNeedsCorrection && store.currentSummary?.correctionNotes"
      class="mb-4 rounded-xl border border-red-300 bg-red-50 px-5 py-4"
    >
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p class="font-semibold text-red-800">ส่งกลับให้แก้ไข</p>
          <p class="mt-1 text-sm text-red-700">{{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
    </div>

    <!-- ── Draft / On-Hold Alert ─────────────────────────────────────────── -->
    <div
      v-if="store.getDraftTransactions.length > 0 || store.getOnHoldTransactions.length > 0"
      class="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-4"
    >
      <div class="mb-2 flex items-center gap-2">
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-600" />
        <p class="font-semibold text-yellow-800">มีรายการที่รอดำเนินการ</p>
      </div>
      <ul class="space-y-2">
        <li
          v-for="txn in [...store.getDraftTransactions, ...store.getOnHoldTransactions]"
          :key="txn.id"
          class="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-white px-4 py-2 text-sm"
        >
          <div class="flex items-center gap-2 min-w-0">
            <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm">
              {{ getStatusLabel(txn.status) }}
            </BaseBadge>
            <span class="truncate text-gray-700">
              {{ formatTransactionType(txn.transactionType) }}
              {{ txn.customerName ? `— ${txn.customerName}` : '' }}
              · {{ formatAmount(txn.amount) }}
            </span>
            <span v-if="txn.statusNote" class="text-xs text-gray-400">({{ txn.statusNote }})</span>
          </div>
          <div class="flex shrink-0 gap-2">
            <ActionButton
              v-if="txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="primary"
              size="sm"
              @click="handleCompleteDraft(txn.id)"
            >
              <template #icon><CheckCircleIcon class="h-4 w-4" /></template>
              ดำเนินการ
            </ActionButton>
            <ActionButton
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              title="เปลี่ยนสถานะ"
              @click="openStatusModal(txn.id, txn.status)"
            >
              <EllipsisVerticalIcon class="h-4 w-4" />
            </ActionButton>
            <ActionButton
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              title="ลบ"
              class="text-red-500 hover:text-red-700"
              @click="promptDelete(txn.id)"
            >
              <TrashIcon class="h-4 w-4" />
            </ActionButton>
          </div>
        </li>
      </ul>
    </div>

    <!-- ── Opening Balance prompt ──────────────────────────────────────────── -->
    <section v-if="!isOpeningSet" class="mb-4">
      <div class="flex items-center justify-between gap-4 rounded-xl border border-blue-300 bg-blue-50 px-5 py-4">
        <div>
          <div class="font-semibold text-blue-900">💳 กำหนดยอดเงินในบัญชีเริ่มต้น</div>
          <div class="mt-0.5 text-sm text-blue-700">กรุณากำหนดยอดเงินก่อนเริ่มบันทึกรายการ</div>
        </div>
        <ActionButton :permission="PERMISSIONS.EDIT_FINANCE" variant="primary" @click="openOpeningBalanceModal">
          กำหนดยอดเงินเริ่มต้น
        </ActionButton>
      </div>
    </section>

    <!-- ── Balance Cards ──────────────────────────────────────────────────── -->
    <CompactBalanceSummary
      :primary-cards="[
        { label: 'เงินเริ่มต้น', value: store.currentBalance?.openingBalance ?? 0, colorClass: 'text-gray-700' },
        { label: 'รวมรับชำระ', value: store.currentBalance?.billPaymentCash ?? 0, colorClass: 'text-green-700' },
        { label: 'เงินในบัญชีคงเหลือ', value: store.currentBalance?.bankAccount ?? 0, colorClass: 'text-blue-700' },
        { label: 'เงินสดคงเหลือ', value: (store.currentBalance?.billPaymentCash ?? 0) + (store.currentBalance?.serviceFeeCash ?? 0), colorClass: 'text-emerald-700' },
      ]"
      :secondary-cards="[
        { label: 'รวมฝากเงิน', value: totalOwnerDeposit, colorClass: 'text-purple-700' },
        { label: 'ค่าธรรมเนียม', value: store.currentBalance?.serviceFeeCash ?? 0, colorClass: 'text-yellow-700' },
      ]"
      :collapsible="!isStep1InProgress"
      :default-expanded="isStep1InProgress"
      title="📊 ยอดเงินปัจจุบัน"
      class="mb-6"
    />

    <!-- ── Transaction List ───────────────────────────────────────────────── -->
    <section class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-700">
          📝 รายการวันที่ {{ date }}
          <span class="ml-1 text-sm font-normal text-gray-400">
            ({{ dateTransactions.length }} รายการ)
          </span>
        </h2>
        <ActionButton
          :permission="PERMISSIONS.EDIT_FINANCE"
          variant="primary"
          size="sm"
          @click="openNewTransaction"
        >
          <template #icon><PlusIcon class="h-4 w-4" /></template>
          รายการใหม่
        </ActionButton>
      </div>

      <EmptyState
        v-if="dateTransactions.length === 0"
        title="ยังไม่มีรายการ"
        description="กดปุ่ม 'รายการใหม่' เพื่อเริ่มบันทึกรายการรับชำระบิล"
        class="py-10"
      />

      <div v-else class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead class="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left">#</th>
              <th class="px-4 py-3 text-left">ประเภท</th>
              <th class="px-4 py-3 text-left">ลูกค้า</th>
              <th class="px-4 py-3 text-right">จำนวนเงิน</th>
              <th class="px-4 py-3 text-right">ค่าธรรมเนียม</th>
              <th class="px-4 py-3 text-center">สถานะ</th>
              <th class="px-4 py-3 text-left">เวลา</th>
              <th class="px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(txn, idx) in dateTransactions"
              :key="txn.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-400">{{ Number(idx) + 1 }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">
                  {{ formatTransactionType(txn.transactionType) }}
                </div>
                <div v-if="txn.billType" class="text-xs text-gray-400">
                  {{ formatBillType(txn.billType) }}
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ txn.customerName || '-' }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-800">
                {{ formatAmount(txn.amount) }}
              </td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ txn.transactionType === 'bill_payment' ? formatAmount(txn.commission) : '-' }}
              </td>
              <td class="px-4 py-3 text-center">
                <BaseBadge :variant="getStatusBadgeVariant(txn.status)">
                  {{ getStatusLabel(txn.status) }}
                </BaseBadge>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatTime(txn.timestamp) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <ActionButton
                    :permission="PERMISSIONS.EDIT_FINANCE"
                    variant="ghost"
                    size="sm"
                    title="แก้ไข"
                    @click="openEditTransaction(txn)"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    :permission="PERMISSIONS.EDIT_FINANCE"
                    variant="ghost"
                    size="sm"
                    title="เปลี่ยนสถานะ"
                    @click="openStatusModal(txn.id, txn.status)"
                  >
                    <EllipsisVerticalIcon class="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    :permission="PERMISSIONS.EDIT_FINANCE"
                    variant="ghost"
                    size="sm"
                    title="ลบ"
                    class="text-red-500 hover:text-red-700"
                    @click="promptDelete(txn.id)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── Step 1 Complete Button ─────────────────────────────────────────── -->
    <section class="flex flex-col items-end gap-3 border-t border-gray-100 pt-4">
      <!-- Checklist -->
      <div class="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <h3 class="mb-3 text-sm font-semibold text-gray-700">
          {{ canCompleteStep1 ? '✅ พร้อมยืนยันบันทึกรายการแล้ว' : '📋 เงื่อนไขก่อนยืนยันบันทึกรายการ' }}
        </h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2" :class="isOpeningSet ? 'text-green-700' : 'text-gray-500'">
            <span class="text-base">{{ isOpeningSet ? '✅' : '⬜' }}</span>
            ตั้ง Opening Balance แล้ว
          </li>
          <li class="flex items-center gap-2" :class="dateTransactions.length > 0 ? 'text-green-700' : 'text-gray-500'">
            <span class="text-base">{{ dateTransactions.length > 0 ? '✅' : '⬜' }}</span>
            มีรายการอย่างน้อย 1 รายการ
            <span class="text-gray-400">(ปัจจุบัน: {{ dateTransactions.length }} รายการ)</span>
          </li>
        </ul>
      </div>
      <ActionButton
        :permission="PERMISSIONS.EDIT_FINANCE"
        variant="primary"
        :disabled="!canCompleteStep1"
        :loading="isCompletingStep1"
        @click="handleCompleteStep1"
      >
        ไปขั้นตอนที่ 2 →
      </ActionButton>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Add / Edit Transaction
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showTransactionModal"
      :title="editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'"
      @close="closeModal"
    >
      <BillPaymentTransactionForm
        :editing-data="editingTransaction"
        @submit="handleFormSubmit"
        @cancel="closeModal"
      />
    </BaseModal>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Opening Balance
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showOpeningBalanceModal" title="💳 กำหนดยอดเงินในบัญชีเริ่มต้น" size="md" @close="showOpeningBalanceModal = false">
      <div class="space-y-4">
        <label :class="['flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors', openingSource === 'carryover' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
          <input v-model="openingSource" type="radio" value="carryover" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">🔄 ใช้ยอดคงเหลือจากเมื่อวาน (Carry-over)</div>
            <div class="mt-0.5 text-sm text-gray-500">ยอดเงินคงเหลือ ณ สิ้นวันเมื่อวาน</div>
            <div class="mt-2 text-lg font-bold text-blue-700">
              <span v-if="store.previousDayBalance">{{ formatAmount(carryoverAmount) }}</span>
              <span v-else class="text-sm font-normal text-gray-400">ไม่พบข้อมูลวันก่อนหน้า</span>
            </div>
          </div>
        </label>
        <label :class="['flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors', openingSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
          <input v-model="openingSource" type="radio" value="manual" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">✏️ กำหนดเอง</div>
            <div class="mt-0.5 text-sm text-gray-500">ระบุยอดเงินเริ่มต้นด้วยตนเอง</div>
            <div v-if="openingSource === 'manual'" class="mt-3" @click.stop>
              <div class="relative">
                <BaseInput v-model="manualOpeningAmount" type="number" placeholder="0" min="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">บาท</span>
              </div>
            </div>
          </div>
        </label>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showOpeningBalanceModal = false">ยกเลิก</BaseButton>
          <BaseButton
            variant="primary"
            :disabled="openingSource === 'manual' && manualOpeningAmount < 0"
            :loading="isSettingOpeningBalance"
            @click="handleSetOpeningBalance"
          >
            💾 ยืนยันยอดเงินเริ่มต้น
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Status Change
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showStatusModal"
      title="เปลี่ยนสถานะรายการ"
      size="sm"
      @close="showStatusModal = false"
    >
      <div class="space-y-4">
        <FormField label="สถานะใหม่" required>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="opt in [
                { value: 'completed', label: 'สำเร็จ', color: 'text-green-700' },
                { value: 'on_hold',   label: 'พักรายการ', color: 'text-orange-600' },
                { value: 'cancelled', label: 'ยกเลิก', color: 'text-gray-600' },
              ]"
              :key="opt.value"
              class="flex cursor-pointer items-center gap-2"
            >
              <input
                v-model="newStatus"
                type="radio"
                :value="opt.value"
                class="accent-red-600"
              />
              <span class="text-sm" :class="opt.color">{{ opt.label }}</span>
            </label>
          </div>
        </FormField>
        <FormField label="หมายเหตุ (ไม่บังคับ)">
          <BaseInput
            v-model="statusChangeNote"
            type="text"
            placeholder="เหตุผลในการเปลี่ยนสถานะ"
          />
        </FormField>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showStatusModal = false">ยกเลิก</BaseButton>
          <BaseButton
            variant="primary"
            :loading="isChangingStatus"
            :disabled="!newStatus || newStatus === statusChangeTarget?.currentStatus"
            @click="handleStatusChange"
          >
            บันทึก
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CONFIRM DIALOG: Delete
    ════════════════════════════════════════════════════════════════════════════ -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="ลบรายการ"
      message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      confirm-text="ลบ"
      variant="danger"
      @confirm="handleDeleteExecute"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
