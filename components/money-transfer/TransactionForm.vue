<template>
  <div class="space-y-4 px-1">

    <!-- ── ประเภทรายการ ─────────────────────────────────────── -->
    <div class="flex rounded-lg border border-gray-200 overflow-hidden">
      <button
        v-for="t in transactionTypes"
        :key="t.value"
        type="button"
        class="flex-1 py-2.5 text-sm font-medium transition-colors"
        :class="formData.transactionType === t.value
          ? 'bg-primary text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'"
        @click="formData.transactionType = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- ── ช่องทาง (แสดงเฉพาะโอนเงิน) ──────────────────────────── -->
    <div v-if="formData.transactionType === 'transfer'" class="flex rounded-lg border border-gray-200 overflow-hidden">
      <button
        v-for="c in channels"
        :key="c.value"
        type="button"
        class="flex-1 py-2 text-sm font-medium transition-colors"
        :class="formData.channel === c.value
          ? 'bg-primary text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'"
        @click="formData.channel = c.value"
      >
        {{ c.label }}
      </button>
    </div>

    <!-- ── ปลายทาง (แสดงเฉพาะโอนเงิน) ─────────────────────────── -->
    <div v-if="formData.transactionType === 'transfer'" class="space-y-3">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">ปลายทาง</p>

      <!-- ธนาคาร -->
      <template v-if="formData.channel === 'bank'">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ธนาคาร <span class="text-red-500">*</span></label>
          <select
            v-model="formData.bankName"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- เลือกธนาคาร --</option>
            <option v-for="bank in bankList" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">เลขบัญชี <span class="text-red-500">*</span></label>
          <input
            v-model="formData.accountNumber"
            type="text"
            inputmode="numeric"
            placeholder="xxx-x-xxxxx-x"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
          <input
            v-model="formData.accountName"
            type="text"
            placeholder="ชื่อเจ้าของบัญชี"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </template>

      <!-- พร้อมเพย์ -->
      <template v-if="formData.channel === 'promptpay'">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="formData.promptpayIdentifierType" type="radio" value="phone" class="accent-blue-600" />
              <span class="text-sm text-gray-700">หมายเลขโทรศัพท์</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="formData.promptpayIdentifierType" type="radio" value="id_card" class="accent-blue-600" />
              <span class="text-sm text-gray-700">หมายเลขบัตรประชาชน</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ formData.promptpayIdentifierType === 'phone' ? 'หมายเลขโทรศัพท์' : 'หมายเลขบัตรประชาชน' }}
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.promptpayIdentifier"
            type="text"
            inputmode="numeric"
            :placeholder="formData.promptpayIdentifierType === 'phone' ? '0812345678' : '1234567890123'"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
          <input
            v-model="formData.accountName"
            type="text"
            placeholder="ชื่อเจ้าของบัญชี"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </template>
    </div>

    <!-- ── จำนวนเงิน + ค่าบริการ ─────────────────────────────── -->
    <div class="grid grid-cols-2 gap-3">
      <!-- จำนวนเงิน -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท) <span class="text-red-500">*</span></label>
        <div class="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary">
          <input
            v-model.number="formData.amount"
            type="number"
            inputmode="numeric"
            placeholder="0"
            min="0"
            step="1"
            class="flex-1 px-3 py-2 text-sm outline-none min-w-0"
          />
        </div>
      </div>

      <!-- ค่าบริการ (ซ่อนถ้าฝากเงิน) -->
      <div v-if="formData.transactionType !== 'owner_deposit'">
        <label class="flex text-sm font-medium text-gray-700 mb-1 items-center gap-1">
          ค่าบริการ (บาท)
          <button
            type="button"
            :title="isCommissionManual ? 'รีเซ็ตเป็นอัตโนมัติ' : 'คำนวณอัตโนมัติ'"
            class="transition-colors leading-none"
            :class="isCommissionManual ? 'text-gray-400 hover:text-blue-500' : 'text-blue-500'"
            @click="resetCommission"
          >
            🔄
          </button>
        </label>
        <div
          class="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-primary"
          :class="isCommissionManual ? 'border-amber-400' : 'border-gray-300'"
        >
          <input
            v-model.number="commissionInput"
            type="number"
            inputmode="numeric"
            placeholder="0"
            min="0"
            step="1"
            class="flex-1 px-3 py-2 text-sm outline-none min-w-0"
            @input="isCommissionManual = true"
          />
          <!-- Commission type inline buttons — แสดงเมื่อมีค่าบริการ -->
          <template v-if="effectiveCommission > 0">
            <button
              type="button"
              class="px-3 py-2 text-xs font-medium transition-colors border-l"
              :class="[
                isCommissionManual ? 'border-amber-400' : 'border-gray-300',
                formData.commissionType === 'cash'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              ]"
              @click="formData.commissionType = 'cash'"
            >
              สด
            </button>
            <button
              type="button"
              class="px-3 py-2 text-xs font-medium transition-colors border-l"
              :class="[
                isCommissionManual ? 'border-amber-400' : 'border-gray-300',
                formData.commissionType === 'transfer'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              ]"
              @click="formData.commissionType = 'transfer'"
            >
              โอน
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ── หมายเหตุ ────────────────────────────────────────────── -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
      <textarea
        v-model="formData.notes"
        rows="2"
        placeholder="บันทึกเพิ่มเติม..."
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
    </div>

    <!-- ── สถานะยอดเงิน ─────────────────────────────────────────── -->
    <div
      v-if="formData.amount > 0"
      class="rounded-lg px-3 py-2.5 text-sm flex items-center justify-between gap-2"
      :class="bannerInfo.ok
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-amber-50 border border-amber-200 text-amber-800'"
    >
      <!-- ยอดปัจจุบัน → ยอดหลังรายการ -->
      <div class="flex items-center gap-2 font-medium">
        <span>{{ bannerInfo.ok ? '✅' : '⚠️' }}</span>
        <span class="text-xs opacity-70">{{ bannerInfo.balanceLabel }}</span>
        <span>{{ formatCurrency(bannerInfo.current) }}</span>
        <span class="opacity-50">→</span>
        <span :class="bannerInfo.ok ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'">
          {{ formatCurrency(bannerInfo.after) }}
        </span>
      </div>
      <!-- สถานะการบันทึก (ไม่แสดงอีกต่อไป) -->
    </div>

    <!-- ── Status Change Section ──────────────────────────────── -->
    <div v-if="isStatusChangeMode && statusChange" class="space-y-3 border-t border-gray-200 pt-4">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">เปลี่ยนสถานะ</p>

      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500">สถานะปัจจุบัน:</span>
        <BaseBadge :variant="getStatusBadgeVariant(statusChange.currentStatus)">
          {{ getStatusLabel(statusChange.currentStatus) }}
        </BaseBadge>
      </div>

      <!-- completed → edit_only / on_hold -->
      <div v-if="statusChange.currentStatus === 'completed'" class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2 p-2.5 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer">
          <input v-model="statusTarget" type="radio" value="edit_only" class="text-blue-600 focus:ring-blue-500" />
          <span class="font-medium text-sm text-blue-800">แก้ไขรายการ</span>
        </label>
        <label class="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer">
          <input v-model="statusTarget" type="radio" value="on_hold" class="text-amber-600 focus:ring-amber-500" />
          <span class="font-medium text-sm text-amber-800">พักรายการ</span>
        </label>
      </div>

      <!-- on_hold → completed / cancelled -->
      <div v-if="statusChange.currentStatus === 'on_hold'" class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2 p-2.5 rounded-lg border border-green-200 bg-green-50 cursor-pointer">
          <input v-model="statusTarget" type="radio" value="completed" class="text-green-600 focus:ring-green-500" />
          <span class="font-medium text-sm text-green-800">สำเร็จ</span>
        </label>
        <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
          <input v-model="statusTarget" type="radio" value="cancelled" class="text-gray-600 focus:ring-gray-500" />
          <span class="font-medium text-sm text-gray-700">ยกเลิก</span>
        </label>
      </div>

      <!-- Previous note (read-only) -->
      <div v-if="previousStatusNote" class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <span class="text-gray-500">หมายเหตุล่าสุด:</span>
        <span class="text-gray-700 ml-1">{{ previousStatusNote }}</span>
      </div>

      <!-- Required note (only for actual status changes, not edit_only) -->
      <div v-if="needsStatusNote">
        <label class="block text-sm font-medium text-gray-700 mb-1">เหตุผล <span class="text-red-500">*</span></label>
        <textarea
          v-model="statusNote"
          rows="2"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="ระบุเหตุผลในการเปลี่ยนสถานะ..."
        />
      </div>
    </div>

    <!-- ── Error ──────────────────────────────────────────────── -->
    <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <!-- ── Buttons ────────────────────────────────────────────── -->
    <div class="flex gap-3 pt-1">
      <button
        type="button"
        class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        @click="emit('cancel')"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="isSubmitting ? 'bg-primary/60' : 'bg-primary hover:bg-primary-dark'"
        :disabled="isSubmitting || formData.amount <= 0 || alreadyEdited"
        @click="handleSubmit"
      >
        <svg v-if="isSubmitting" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>{{ isStatusChangeMode ? (isEditOnly ? '💾 บันทึกการแก้ไข' : '💾 บันทึกและเปลี่ยนสถานะ') : '💾 บันทึก' }}</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { MoneyTransferBalance } from '~/types/repositories'
import { BANK_LIST } from '~/constants/banks'

// ── Props & Emits ─────────────────────────────────────────────
interface Props {
  currentBalance: MoneyTransferBalance
  recordedBy: string
  recordedByName: string
  editingData?: any
  presetType?: 'transfer' | 'withdrawal' | 'owner_deposit'
  statusChange?: {
    currentStatus: 'completed' | 'on_hold'
  }
}

interface Emits {
  (e: 'submit', transaction: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ── Static data ───────────────────────────────────────────────
const transactionTypes = [
  { value: 'transfer' as const, label: 'โอนเงิน' },
  { value: 'withdrawal' as const, label: 'ถอนเงิน' },
  { value: 'owner_deposit' as const, label: 'ฝากเงิน' },
]

const channels = [
  { value: 'bank' as const, label: 'ธนาคาร' },
  { value: 'promptpay' as const, label: 'พร้อมเพย์' },
]

const bankList = BANK_LIST

// ── Form state ────────────────────────────────────────────────
const formData = ref({
  transactionType: (props.presetType ?? props.editingData?.transactionType ?? 'transfer') as 'transfer' | 'withdrawal' | 'owner_deposit',
  channel: (props.editingData?.channel ?? 'bank') as 'bank' | 'promptpay',
  bankName: props.editingData?.bankName ?? '',
  accountNumber: props.editingData?.accountNumber ?? '',
  accountName: props.editingData?.accountName ?? '',
  promptpayIdentifierType: (props.editingData?.promptpayIdentifierType ?? 'phone') as 'phone' | 'id_card',
  promptpayIdentifier: props.editingData?.promptpayIdentifier ?? '',
  amount: props.editingData?.amount ?? 0,
  commissionType: (props.editingData?.commissionType ?? 'cash') as 'cash' | 'transfer',
  notes: props.editingData?.notes ?? '',
})

// ── Fee settings store ────────────────────────────────────────
const settingsStore = useDailyRecordSettingsStore()

onMounted(async () => {
  // Load fee tiers from server (fast local JSON read).
  // Falls back to built-in defaults if the file doesn't exist yet.
  await settingsStore.fetchMoneyTransferFees()
})

// ── Commission auto-calc ──────────────────────────────────────
const commissionAmount = computed(() => Number(formData.value.amount))
const {
  isManual: isCommissionManual,
  manualValue: manualCommission,
  effectiveCommission,
  reset: resetCommission,
} = useCommission(commissionAmount)

// Pre-fill commission when editing an existing transaction
if (props.editingData?.commission != null && props.editingData.commission > 0) {
  manualCommission.value = props.editingData.commission
  isCommissionManual.value = true
}

const commissionInput = computed({
  get: () => effectiveCommission.value,
  set: (val: number) => {
    manualCommission.value = val
    isCommissionManual.value = true
  },
})

// ── Balance check ─────────────────────────────────────────────
/**
 * โอนเงิน  → ต้องมียอดในบัญชีธนาคาร (bankAccount) เพียงพอ
 * ถอนเงิน  → ต้องมียอดเงินสด (transferCash) เพียงพอ
 * ฝากเงิน  → เพิ่มยอดเงินสดเสมอ ถือว่าสำเร็จเสมอ
 */
const hasSufficientBalance = computed(() => {
  const { transactionType } = formData.value
  const amt = Number(formData.value.amount)
  if (transactionType === 'transfer') return Number(props.currentBalance.bankAccount) >= amt
  if (transactionType === 'withdrawal') return Number(props.currentBalance.transferCash) >= amt
  return true // owner_deposit always completes
})

/** ข้อความและยอดที่แสดงใน banner ตามประเภทรายการ */
const bannerInfo = computed(() => {
  const { transactionType } = formData.value
  const amt = Number(formData.value.amount)
  const bankAccount = Number(props.currentBalance.bankAccount)
  const transferCash = Number(props.currentBalance.transferCash)

  if (transactionType === 'transfer') {
    return {
      balanceLabel: 'ยอดเงินในบัญชี',
      current: bankAccount,
      after: bankAccount - amt,
      ok: hasSufficientBalance.value,
    }
  }
  if (transactionType === 'withdrawal') {
    return {
      balanceLabel: 'ยอดเงินสด',
      current: transferCash,
      after: transferCash - amt,
      ok: hasSufficientBalance.value,
    }
  }
  // owner_deposit — เพิ่มยอดในบัญชีธนาคาร
  return {
    balanceLabel: 'ยอดเงินในบัญชี',
    current: bankAccount,
    after: bankAccount + amt,
    ok: true,
  }
})

// ── Helpers ───────────────────────────────────────────────────
const { formatCurrency, getStatusLabel, getStatusBadgeVariant } = useMoneyTransferHelpers()

// ── Status Change ────────────────────────────────────────────
// Auto-pre-select edit_only only when completed + has previous note
const statusTarget = ref<'edit_only' | 'on_hold' | 'completed' | 'cancelled' | ''>(
  props.statusChange?.currentStatus === 'completed' && props.editingData?.statusNote ? 'edit_only' : ''
)
const statusNote = ref('')
const previousStatusNote = computed(() => props.editingData?.statusNote ?? '')
const alreadyEdited = computed(() => isEditOnly.value && !!previousStatusNote.value)
const isStatusChangeMode = computed(() => !!props.statusChange)
const isEditOnly = computed(() => statusTarget.value === 'edit_only')
const needsStatusNote = computed(() => isStatusChangeMode.value && statusTarget.value !== '' && !alreadyEdited.value)

// ── Validation & Submit ───────────────────────────────────────
const isSubmitting = ref(false)
const errorMessage = ref('')

function handleSubmit() {
  errorMessage.value = ''

  if (formData.value.amount <= 0) {
    errorMessage.value = 'กรุณากรอกจำนวนเงิน'
    return
  }

  if (formData.value.transactionType === 'transfer') {
    if (formData.value.channel === 'bank') {
      if (!formData.value.bankName) {
        errorMessage.value = 'กรุณาเลือกธนาคาร'
        return
      }
      if (!formData.value.accountNumber) {
        errorMessage.value = 'กรุณากรอกเลขบัญชี'
        return
      }
    }
    if (formData.value.channel === 'promptpay') {
      if (!formData.value.promptpayIdentifier) {
        errorMessage.value = 'กรุณากรอกหมายเลขพร้อมเพย์'
        return
      }
    }
  }

  // Status change validation
  if (isStatusChangeMode.value) {
    if (!statusTarget.value) {
      errorMessage.value = 'กรุณาเลือกการดำเนินการ'
      return
    }
    if (needsStatusNote.value && !statusNote.value.trim()) {
      errorMessage.value = 'กรุณาระบุเหตุผลในการเปลี่ยนสถานะ'
      return
    }
  }

  // Capture datetime at submit time; keep original if editing a draft
  const datetime = props.editingData?.datetime ?? new Date().toISOString()

  const transactionData: Record<string, any> = {
    datetime,
    transactionType: formData.value.transactionType,
    channel: formData.value.transactionType === 'transfer' ? formData.value.channel : undefined,
    amount: formData.value.amount,
    commission: effectiveCommission.value,
    commissionType: formData.value.commissionType,
    notes: formData.value.notes,
    recordedBy: props.recordedBy,
    recordedByName: props.recordedByName,
    status: isStatusChangeMode.value
      ? (isEditOnly.value ? props.statusChange!.currentStatus : statusTarget.value)
      : (hasSufficientBalance.value ? 'completed' : 'draft'),
    // Save statusNote for edit_only (persisted on transaction record)
    ...(isStatusChangeMode.value && statusNote.value.trim() ? { statusNote: statusNote.value.trim() } : {}),
  }

  // Attach status change info for the parent handler (not for edit_only)
  if (isStatusChangeMode.value && statusTarget.value && !isEditOnly.value) {
    transactionData._statusChange = {
      status: statusTarget.value,
      statusNote: statusNote.value.trim(),
    }
  }

  if (formData.value.transactionType === 'transfer') {
    if (formData.value.channel === 'bank') {
      transactionData.bankName = formData.value.bankName
      transactionData.accountNumber = formData.value.accountNumber
      transactionData.accountName = formData.value.accountName
      transactionData.destinationName = formData.value.accountName
      transactionData.destinationIdentifier = formData.value.accountNumber
    } else if (formData.value.channel === 'promptpay') {
      transactionData.promptpayIdentifierType = formData.value.promptpayIdentifierType
      transactionData.promptpayIdentifier = formData.value.promptpayIdentifier
      transactionData.accountName = formData.value.accountName
      transactionData.destinationName = formData.value.accountName
      transactionData.destinationIdentifier = formData.value.promptpayIdentifier
    }
  }

  isSubmitting.value = true
  try {
    emit('submit', transactionData)
  } finally {
    isSubmitting.value = false
  }
}

// ── Sync editing data when prop changes ───────────────────────
watch(
  () => props.editingData,
  (val) => {
    if (!val) return
    formData.value.transactionType = val.transactionType ?? 'transfer'
    formData.value.channel = val.channel ?? 'bank'
    formData.value.bankName = val.bankName ?? ''
    formData.value.accountNumber = val.accountNumber ?? ''
    formData.value.accountName = val.accountName ?? ''
    formData.value.promptpayIdentifierType = val.promptpayIdentifierType ?? 'phone'
    formData.value.promptpayIdentifier = val.promptpayIdentifier ?? ''
    formData.value.amount = val.amount ?? 0
    formData.value.commissionType = val.commissionType ?? 'cash'
    formData.value.notes = val.notes ?? ''
    if (val.commission != null) {
      manualCommission.value = val.commission
      isCommissionManual.value = true
    }
  },
  { immediate: false }
)
</script>
