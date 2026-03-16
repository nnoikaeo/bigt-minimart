<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMoneyTransferHelpers } from '~/composables/useMoneyTransferHelpers'

interface Props {
  openingBalance: number
  totalDeposit: number
  totalTransfer: number
  totalWithdrawal: number
  serviceFeeCash: number
  serviceFeeTransfer: number
  bankAccountBalance: number
  cashBalance: number
  openingSource?: string
}

const props = withDefaults(defineProps<Props>(), {
  openingSource: '',
})

const { formatCurrency } = useMoneyTransferHelpers()

const isExpanded = ref(false)

function toggle() {
  isExpanded.value = !isExpanded.value
}

const openingSourceLabel = computed(() => {
  const map: Record<string, string> = {
    carryover: 'จากเมื่อวาน',
    manual: 'กำหนดเอง',
  }
  return map[props.openingSource] || ''
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-semibold text-gray-700">📊 ยอดเงิน</h2>
      <button
        type="button"
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        @click="toggle"
      >
        {{ isExpanded ? '▲ ย่อ' : '▼ ดูเพิ่ม' }}
      </button>
    </div>

    <!-- Row 1: Primary 4 cards (always visible) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- เริ่มต้น -->
      <BaseCard class="text-center">
        <div class="text-xs text-gray-500 mb-1">เงินในบัญชีเริ่มต้น</div>
        <div class="text-lg font-bold text-gray-700">
          {{ formatCurrency(openingBalance) }}
        </div>
        <div v-if="openingSourceLabel" class="text-xs text-gray-400 mt-0.5">
          {{ openingSourceLabel }}
        </div>
      </BaseCard>

      <!-- รวมโอน -->
      <BaseCard class="text-center">
        <div class="text-xs text-gray-500 mb-1">รวมเงินโอน</div>
        <div class="text-lg font-bold text-red-600">
          {{ formatCurrency(totalTransfer) }}
        </div>
      </BaseCard>

      <!-- บัญชีคงเหลือ -->
      <BaseCard class="text-center border-gray-300 bg-gray-50">
        <div class="text-xs text-gray-600 mb-1 font-medium">เงินในบัญชีคงเหลือ</div>
        <div class="text-xl font-bold text-gray-900">
          {{ formatCurrency(bankAccountBalance) }}
        </div>
      </BaseCard>

      <!-- เงินสดคงเหลือ -->
      <BaseCard class="text-center border-blue-200 bg-blue-50/40">
        <div class="text-xs text-blue-600 mb-1 font-medium">เงินสดคงเหลือ</div>
        <div class="text-lg font-bold text-blue-800">
          {{ formatCurrency(cashBalance) }}
        </div>
      </BaseCard>
    </div>

    <!-- Row 2: Detail 4 cards (expanded only) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[500px] opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-[500px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isExpanded" class="overflow-hidden">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <!-- รวมฝาก -->
          <BaseCard class="text-center">
            <div class="text-xs text-gray-500 mb-1">รวมเงินฝาก</div>
            <div class="text-lg font-bold text-blue-700">
              {{ formatCurrency(totalDeposit) }}
            </div>
          </BaseCard>

          <!-- รวมถอน -->
          <BaseCard class="text-center">
            <div class="text-xs text-gray-500 mb-1">รวมเงินถอน</div>
            <div class="text-lg font-bold text-purple-700">
              {{ formatCurrency(totalWithdrawal) }}
            </div>
          </BaseCard>

          <!-- ค่าบริการ (เงินสด) -->
          <BaseCard class="text-center">
            <div class="text-xs text-gray-500 mb-1">รวมค่าบริการ (เงินสด)</div>
            <div class="text-lg font-bold text-green-700">
              {{ formatCurrency(serviceFeeCash) }}
            </div>
          </BaseCard>

          <!-- ค่าบริการ (เงินโอน) -->
          <BaseCard class="text-center">
            <div class="text-xs text-gray-500 mb-1">รวมค่าบริการ (เงินโอน)</div>
            <div class="text-lg font-bold text-green-700">
              {{ formatCurrency(serviceFeeTransfer) }}
            </div>
          </BaseCard>
        </div>
      </div>
    </Transition>
  </div>
</template>
