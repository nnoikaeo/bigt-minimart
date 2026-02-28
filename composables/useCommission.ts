import type { Ref } from 'vue'
import { useDailyRecordSettingsStore } from '~/stores/daily-record-settings'

/**
 * Commission calculation with auto (fee-tier based) / manual override toggle.
 * Automatically fetches fee tiers on mount.
 *
 * Used in: TransactionForm.vue, transaction-recording.vue (Favorite Transfer)
 *
 * @param amount - reactive ref containing the transfer amount (may be string from v-model)
 */
export function useCommission(amount: Ref<number>) {
  const settingsStore = useDailyRecordSettingsStore()

  const isManual = ref(false)
  const manualValue = ref(0)

  const autoCommission = computed(() =>
    settingsStore.calculateFee(Number(amount.value)).totalFee
  )

  const effectiveCommission = computed(() =>
    isManual.value ? manualValue.value : autoCommission.value
  )

  function reset() {
    isManual.value = false
    manualValue.value = 0
  }

  onMounted(async () => {
    await settingsStore.fetchMoneyTransferFees()
  })

  return { isManual, manualValue, autoCommission, effectiveCommission, reset }
}
