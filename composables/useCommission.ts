import type { Ref } from 'vue'
import { useDailyRecordSettingsStore } from '~/stores/daily-record-settings'

/**
 * Commission calculation with auto (fee-tier based) / manual override toggle.
 * Automatically fetches fee tiers on mount.
 *
 * Used in: TransactionForm.vue (money-transfer), TransactionForm.vue (bill-payment)
 *
 * @param amount      - reactive ref containing the transaction amount (may be string from v-model)
 * @param options.serviceType - 'money-transfer' (default) | 'bill-payment'
 * @param options.billType    - reactive ref for bill type (required when serviceType='bill-payment')
 */
export function useCommission(
  amount: Ref<number>,
  options?: {
    serviceType?: 'money-transfer' | 'bill-payment'
    billType?: Ref<string>
  }
) {
  const settingsStore = useDailyRecordSettingsStore()
  const serviceType = options?.serviceType ?? 'money-transfer'

  const isManual = ref(false)
  const manualValue = ref(0)

  const autoCommission = computed(() => {
    if (serviceType === 'bill-payment') {
      const bt = options?.billType?.value ?? 'other'
      return settingsStore.calculateBillPaymentFee(Number(amount.value), bt).totalFee
    }
    return settingsStore.calculateFee(Number(amount.value)).totalFee
  })

  const effectiveCommission = computed(() =>
    isManual.value ? manualValue.value : autoCommission.value
  )

  function reset() {
    isManual.value = false
    manualValue.value = 0
  }

  onMounted(async () => {
    if (serviceType === 'bill-payment') {
      await settingsStore.fetchBillPaymentFees()
    } else {
      await settingsStore.fetchMoneyTransferFees()
    }
  })

  return { isManual, manualValue, autoCommission, effectiveCommission, reset }
}
