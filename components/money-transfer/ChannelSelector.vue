<template>
  <div class="channel-selector">
    <label class="selector-label">Payment Channel (ช่องทางชำระเงิน)</label>

    <div class="radio-group">
      <div class="radio-item">
        <input
          id="channel-promptpay"
          v-model="localValue"
          type="radio"
          value="promptpay"
          class="radio-input"
        />
        <label for="channel-promptpay" class="radio-label">
          <span class="icon">📱</span>
          <span class="text">
            <strong>PromptPay (พร้อมเพย์)</strong>
            <small>Phone number or ID card number</small>
          </span>
        </label>
      </div>

      <div class="radio-item">
        <input
          id="channel-bank"
          v-model="localValue"
          type="radio"
          value="bank"
          class="radio-input"
        />
        <label for="channel-bank" class="radio-label">
          <span class="icon">🏦</span>
          <span class="text">
            <strong>Bank Account (บัญชีธนาคาร)</strong>
            <small>Bank account number with account type</small>
          </span>
        </label>
      </div>

      <div class="radio-item">
        <input
          id="channel-other"
          v-model="localValue"
          type="radio"
          value="other"
          class="radio-input"
        />
        <label for="channel-other" class="radio-label">
          <span class="icon">⚙️</span>
          <span class="text">
            <strong>Other (อื่น ๆ)</strong>
            <small>Other payment methods</small>
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
.channel-selector {
  margin-bottom: 20px;

  .selector-label {
    display: block;
    margin-bottom: 12px;
    font-weight: 600;
    color: #212529;
    font-size: 14px;
  }

  .radio-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;

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
        gap: 10px;
        padding: 12px;
        background: white;
        border: 2px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 100%;

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
            font-size: 13px;
            color: #212529;
          }

          small {
            font-size: 11px;
            color: #6c757d;
          }
        }
      }
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .channel-selector {
    .selector-label {
      font-size: 13px;
    }

    .radio-group {
      grid-template-columns: 1fr;
      gap: 10px;

      .radio-item {
        .radio-label {
          padding: 10px;

          .icon {
            font-size: 18px;
          }

          .text {
            strong {
              font-size: 12px;
            }

            small {
              font-size: 10px;
            }
          }
        }
      }
    }
  }
}
</style>
