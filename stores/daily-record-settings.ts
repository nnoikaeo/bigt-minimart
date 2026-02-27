// @ts-nocheck
/**
 * Daily Record Settings Store
 *
 * Manages settings for all daily-record features:
 * - money-transfer-fees: fee tiers for money transfer service
 *
 * Data is persisted via API (JSON file on server).
 */
import { defineStore } from 'pinia'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MoneyTransferFeeTier {
  id: number
  /** Display label, e.g. "1 – 999" */
  label: string
  minAmount: number
  /** Upper bound of this tier (within a single 10,000-block cycle) */
  maxAmount: number
  fee: number
}

export interface MoneyTransferFeeConfig {
  tiers: MoneyTransferFeeTier[]
  updatedAt: string | null
  updatedBy: string | null
}

export interface FeeBreakdownItem {
  cycle: number
  amount: number
  fee: number
}

// ─── Default Tiers ───────────────────────────────────────────────────────────

const DEFAULT_TIERS: MoneyTransferFeeTier[] = [
  { id: 1, label: '1 – 999',         minAmount: 1,    maxAmount: 999,   fee: 10 },
  { id: 2, label: '1,000 – 3,999',   minAmount: 1000, maxAmount: 3999,  fee: 20 },
  { id: 3, label: '4,000 – 6,999',   minAmount: 4000, maxAmount: 6999,  fee: 30 },
  { id: 4, label: '7,000 – 10,000',  minAmount: 7000, maxAmount: 10000, fee: 40 },
]

// ─── Store ───────────────────────────────────────────────────────────────────

export const useDailyRecordSettingsStore = defineStore('daily-record-settings', {
  state: () => ({
    /** Fee tiers for money transfer service */
    moneyTransferFees: {
      tiers: [...DEFAULT_TIERS] as MoneyTransferFeeTier[],
      updatedAt: null as string | null,
      updatedBy: null as string | null,
    } as MoneyTransferFeeConfig,

    isLoading: false,
    isSaving: false,
    error: null as string | null,
    successMessage: null as string | null,
  }),

  getters: {
    /** Return fee tiers sorted by minAmount */
    sortedTiers: (state: any): MoneyTransferFeeTier[] =>
      [...state.moneyTransferFees.tiers].sort((a, b) => a.minAmount - b.minAmount),
  },

  actions: {
    // ── Fetch ──────────────────────────────────────────────────────────────

    async fetchMoneyTransferFees(): Promise<void> {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean; data: MoneyTransferFeeConfig }>(
          '/api/settings/money-transfer-fees'
        )
        if (response.success) {
          this.moneyTransferFees = response.data
        }
      } catch (err: any) {
        console.error('[daily-record-settings] fetchMoneyTransferFees error:', err)
        this.error = err?.data?.message ?? err?.message ?? 'ไม่สามารถโหลดข้อมูลได้'
        // Keep default tiers on error so UI still works
      } finally {
        this.isLoading = false
      }
    },

    // ── Save ───────────────────────────────────────────────────────────────

    async saveMoneyTransferFees(
      tiers: MoneyTransferFeeTier[],
      updatedBy: string
    ): Promise<boolean> {
      this.isSaving = true
      this.error = null
      this.successMessage = null
      try {
        const response = await $fetch<{ success: boolean; data: MoneyTransferFeeConfig }>(
          '/api/settings/money-transfer-fees',
          {
            method: 'PUT',
            body: { tiers, updatedBy },
          }
        )
        if (response.success) {
          this.moneyTransferFees = response.data
          this.successMessage = 'บันทึกการตั้งค่าสำเร็จ'
          return true
        }
        return false
      } catch (err: any) {
        console.error('[daily-record-settings] saveMoneyTransferFees error:', err)
        this.error = err?.data?.message ?? err?.message ?? 'ไม่สามารถบันทึกข้อมูลได้'
        return false
      } finally {
        this.isSaving = false
      }
    },

    clearMessages(): void {
      this.error = null
      this.successMessage = null
    },

    // ── Fee Calculator ─────────────────────────────────────────────────────

    /**
     * Calculate the service fee for a given transfer amount.
     * Amounts over 10,000 are split into 10,000-block cycles.
     *
     * @param amount - Transfer amount in baht (positive integer)
     * @returns Total fee and breakdown per cycle
     */
    calculateFee(amount: number): { totalFee: number; breakdown: FeeBreakdownItem[] } {
      const tiers: MoneyTransferFeeTier[] = this.sortedTiers
      if (!tiers.length || amount <= 0) return { totalFee: 0, breakdown: [] }

      const CYCLE_SIZE = 10_000
      let remaining = Math.floor(amount)
      let totalFee = 0
      const breakdown: FeeBreakdownItem[] = []
      let cycle = 1

      while (remaining > 0) {
        const chunk = Math.min(remaining, CYCLE_SIZE)
        const fee = this._lookupFee(chunk, tiers)
        breakdown.push({ cycle, amount: chunk, fee })
        totalFee += fee
        remaining -= chunk
        cycle++
      }

      return { totalFee, breakdown }
    },

    /** Find the applicable fee for a given chunk amount (< CYCLE_SIZE) */
    _lookupFee(chunk: number, tiers: MoneyTransferFeeTier[]): number {
      // tiers are sorted ascending by minAmount
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (chunk >= tiers[i].minAmount) return tiers[i].fee
      }
      return tiers[0]?.fee ?? 0
    },
  },
})
