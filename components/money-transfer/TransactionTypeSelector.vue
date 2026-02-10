<template>
  <div class="transaction-type-selector">
    <label class="selector-label">Transaction Type (ประเภทธุรกรรม)</label>

    <div class="radio-group">
      <div class="radio-item">
        <input
          id="type-transfer"
          v-model="localValue"
          type="radio"
          value="transfer"
          class="radio-input"
        />
        <label for="type-transfer" class="radio-label">
          <span class="icon">📤</span>
          <span class="text">
            <strong>Transfer (โอนเงิน)</strong>
            <small>Send money to customer's account</small>
          </span>
        </label>
      </div>

      <div class="radio-item">
        <input
          id="type-withdrawal"
          v-model="localValue"
          type="radio"
          value="withdrawal"
          class="radio-input"
        />
        <label for="type-withdrawal" class="radio-label">
          <span class="icon">💸</span>
          <span class="text">
            <strong>Withdrawal (ถอนเงิน)</strong>
            <small>Customer withdraws cash</small>
          </span>
        </label>
      </div>

      <div class="radio-item">
        <input
          id="type-owner-deposit"
          v-model="localValue"
          type="radio"
          value="owner_deposit"
          class="radio-input"
        />
        <label for="type-owner-deposit" class="radio-label">
          <span class="icon">💰</span>
          <span class="text">
            <strong>Owner Deposit (ฝากเงิน)</strong>
            <small>Owner deposits funds to bank account</small>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})
</script>

<style scoped lang="scss">
.transaction-type-selector {
  margin-bottom: 20px;

  .selector-label {
    display: block;
    margin-bottom: 12px;
    font-weight: 600;
    color: #212529;
    font-size: 14px;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .radio-item {
      position: relative;

      .radio-input {
        position: absolute;
        opacity: 0;
        cursor: pointer;

        &:checked + .radio-label {
          background: #e7f1ff;
          border-color: #0d6efd;
          color: #0d6efd;

          .icon {
            font-size: 24px;
          }
        }

        &:focus + .radio-label {
          outline: 2px solid #0d6efd;
          outline-offset: 2px;
        }
      }

      .radio-label {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 15px;
        background: white;
        border: 2px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0d6efd;
          background: #f8f9fa;
        }

        .icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 2px;

          strong {
            font-size: 14px;
            color: #212529;
          }

          small {
            font-size: 12px;
            color: #6c757d;
          }
        }
      }
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .transaction-type-selector {
    .selector-label {
      font-size: 13px;
    }

    .radio-group {
      .radio-item {
        .radio-label {
          padding: 10px 12px;
          font-size: 13px;

          .icon {
            font-size: 18px;
          }

          .text {
            strong {
              font-size: 13px;
            }

            small {
              font-size: 11px;
            }
          }
        }
      }
    }
  }
}
</style>
