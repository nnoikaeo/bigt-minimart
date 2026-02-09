<template>
  <div class="balance-display card">
    <h3 class="title">💰 ยอดเงินคงเหลือ (Current Balances)</h3>

    <div class="balance-grid">
      <!-- Bank Account -->
      <div class="balance-item bank">
        <div class="label">🏦 Bank Account</div>
        <div class="amount">{{ formatCurrency(balances.bankAccount) }}</div>
      </div>

      <!-- Transfer Cash -->
      <div class="balance-item transfer">
        <div class="label">💵 Transfer Cash</div>
        <div class="amount">{{ formatCurrency(balances.transferCash) }}</div>
      </div>

      <!-- Service Fee - Cash -->
      <div class="balance-item fee-cash">
        <div class="label">⚡ Service Fee (Cash)</div>
        <div class="amount">{{ formatCurrency(balances.serviceFeeCash) }}</div>
      </div>

      <!-- Service Fee - Transfer -->
      <div class="balance-item fee-transfer">
        <div class="label">📱 Service Fee (Transfer)</div>
        <div class="amount">{{ formatCurrency(balances.serviceFeeTransfer) }}</div>
      </div>
    </div>

    <!-- Sufficiency Indicator (if requiredAmount provided) -->
    <div v-if="requiredAmount !== undefined && requiredAmount > 0" class="sufficiency-check">
      <div class="check-header">
        <span class="label">ตรวจสอบเงินคงเหลือ (Balance Check)</span>
      </div>

      <div class="check-item">
        <span>จำนวนเงินที่ต้องการ (Required Amount):</span>
        <span class="amount">{{ formatCurrency(requiredAmount) }}</span>
      </div>

      <div class="check-result" :class="{ sufficient: hasSufficientBalance, insufficient: !hasSufficientBalance }">
        <div class="status-icon">
          {{ hasSufficientBalance ? '✅' : '❌' }}
        </div>
        <div class="status-text">
          {{ hasSufficientBalance ? 'Sufficient Balance' : 'Insufficient Balance' }}
        </div>
      </div>

      <!-- Shortfall Amount (if insufficient) -->
      <div v-if="!hasSufficientBalance" class="shortfall">
        <span>Shortfall Amount:</span>
        <span class="amount">{{ formatCurrency(shortfallAmount) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MoneyTransferBalance } from '~/types/repositories'

interface Props {
  balances: MoneyTransferBalance
  requiredAmount?: number
}

const props = defineProps<Props>()

/**
 * Check if balance is sufficient for the required amount
 */
const hasSufficientBalance = computed(() => {
  if (props.requiredAmount === undefined) return true
  return props.balances.bankAccount >= props.requiredAmount
})

/**
 * Calculate shortfall amount
 */
const shortfallAmount = computed(() => {
  if (props.requiredAmount === undefined) return 0
  return Math.max(0, props.requiredAmount - props.balances.bankAccount)
})

/**
 * Format number as Thai currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
</script>

<style scoped lang="scss">
.balance-display {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;

  .title {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #212529;
    border-bottom: 2px solid #007bff;
    padding-bottom: 10px;
  }

  .balance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;

    .balance-item {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      text-align: center;

      .label {
        font-size: 14px;
        color: #6c757d;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .amount {
        font-size: 20px;
        font-weight: 700;
        color: #212529;
      }

      &.bank {
        border-left: 4px solid #0d6efd;
      }

      &.transfer {
        border-left: 4px solid #198754;
      }

      &.fee-cash {
        border-left: 4px solid #ffc107;
      }

      &.fee-transfer {
        border-left: 4px solid #0dcaf0;
      }
    }
  }

  .sufficiency-check {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;

    .check-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e9ecef;

      .label {
        font-weight: 600;
        color: #212529;
        font-size: 14px;
      }
    }

    .check-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;

      .amount {
        font-weight: 600;
        color: #212529;
      }
    }

    .check-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      font-weight: 600;
      font-size: 16px;

      &.sufficient {
        background: #d1e7dd;
        color: #0f5132;
        border: 1px solid #badbcc;

        .status-icon {
          font-size: 24px;
        }
      }

      &.insufficient {
        background: #f8d7da;
        color: #842029;
        border: 1px solid #f5c2c7;

        .status-icon {
          font-size: 24px;
        }
      }

      .status-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .status-text {
        flex: 1;
      }
    }

    .shortfall {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff3cd;
      border: 1px solid #ffecb5;
      border-radius: 4px;
      padding: 12px;
      font-size: 14px;
      color: #664d03;

      .amount {
        font-weight: 700;
        color: #664d03;
      }
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .balance-display {
    padding: 15px;

    .balance-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;

      .balance-item {
        padding: 12px;

        .label {
          font-size: 12px;
        }

        .amount {
          font-size: 16px;
        }
      }
    }

    .sufficiency-check {
      padding: 12px;

      .check-result {
        padding: 12px;
        font-size: 14px;
      }
    }
  }
}
</style>
