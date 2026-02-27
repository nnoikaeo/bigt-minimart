<template>
  <div class="promptpay-fields">
    <div class="fields-group">
      <!-- Identifier Type Selector -->
      <div class="form-group">
        <label class="form-label">PromptPay Identifier Type (ประเภทรหัส)</label>
        <div class="radio-group">
          <div class="radio-item">
            <input
              id="identifier-phone"
              v-model="localValue.promptpayIdentifierType"
              type="radio"
              value="phone"
              class="radio-input"
            />
            <label for="identifier-phone" class="radio-label">
              ☎️ Phone Number (เบอร์โทรศัพท์)
            </label>
          </div>

          <div class="radio-item">
            <input
              id="identifier-idcard"
              v-model="localValue.promptpayIdentifierType"
              type="radio"
              value="id_card"
              class="radio-input"
            />
            <label for="identifier-idcard" class="radio-label">
              🪪 ID Card Number (หมายเลขบัตรประชาชน)
            </label>
          </div>
        </div>
      </div>

      <!-- PromptPay Identifier Input -->
      <div class="form-group">
        <label class="form-label">
          {{ identifierLabel }}
          <span class="required">*</span>
        </label>
        <input
          v-model="localValue.promptpayIdentifier"
          type="text"
          class="form-control"
          :placeholder="identifierPlaceholder"
          @input="handleIdentifierInput"
        />
        <small class="form-text">{{ identifierFormat }}</small>
      </div>

      <!-- PromptPay Account Name -->
      <div class="form-group">
        <label class="form-label">Account Name (ชื่อบัญชี)</label>
        <input
          v-model="localValue.promptpayAccountName"
          type="text"
          class="form-control"
          placeholder="Account holder name (optional)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: {
    promptpayIdentifierType?: 'phone' | 'id_card'
    promptpayIdentifier?: string
    promptpayAccountName?: string
  }
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

/**
 * Get label for identifier input
 */
const identifierLabel = computed(() => {
  if (localValue.value.promptpayIdentifierType === 'phone') {
    return 'Phone Number (เบอร์โทรศัพท์)'
  }
  return 'ID Card Number (หมายเลขบัตรประชาชน)'
})

/**
 * Get placeholder text
 */
const identifierPlaceholder = computed(() => {
  if (localValue.value.promptpayIdentifierType === 'phone') {
    return 'Format: XXX-XXX-XXXX (e.g., 081-234-5678)'
  }
  return 'Format: X-XXXX-XXXXX-XX-X (e.g., 1-2345-67890-12-3)'
})

/**
 * Get format description
 */
const identifierFormat = computed(() => {
  if (localValue.value.promptpayIdentifierType === 'phone') {
    return 'Format: Phone number with dashes (e.g., 081-234-5678)'
  }
  return 'Format: ID card number with dashes (e.g., 1-2345-67890-12-3)'
})

/**
 * Handle identifier input with auto-formatting
 */
function handleIdentifierInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Remove non-digits

  if (localValue.value.promptpayIdentifierType === 'phone') {
    // Format as XXX-XXX-XXXX
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length >= 3) {
      value = value.slice(0, 3) + '-' + value.slice(3)
    }
    if (value.length >= 7) {
      value = value.slice(0, 7) + '-' + value.slice(7)
    }
  } else if (localValue.value.promptpayIdentifierType === 'id_card') {
    // Format as X-XXXX-XXXXX-XX-X
    if (value.length > 13) value = value.slice(0, 13)
    if (value.length >= 1) {
      value = value.slice(0, 1) + '-' + value.slice(1)
    }
    if (value.length >= 6) {
      value = value.slice(0, 6) + '-' + value.slice(6)
    }
    if (value.length >= 12) {
      value = value.slice(0, 12) + '-' + value.slice(12)
    }
    if (value.length >= 15) {
      value = value.slice(0, 15) + '-' + value.slice(15)
    }
  }

  localValue.value = {
    ...localValue.value,
    promptpayIdentifier: value,
  }
}
</script>

<style scoped lang="scss">
.promptpay-fields {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;

  .fields-group {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .form-label {
      font-weight: 600;
      color: #212529;
      font-size: 14px;

      .required {
        color: #dc3545;
        margin-left: 2px;
      }
    }

    .radio-group {
      display: flex;
      gap: 12px;

      .radio-item {
        position: relative;

        .radio-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;

          &:checked + .radio-label {
            background: white;
            color: #0d6efd;
            border-color: #0d6efd;
          }
        }

        .radio-label {
          display: inline-block;
          padding: 8px 12px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0d6efd;
          }
        }
      }
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      font-family: 'Courier New', monospace;

      &:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
    }

    .form-text {
      font-size: 12px;
      color: #6c757d;
      margin-top: 2px;
    }
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .promptpay-fields {
    padding: 12px;

    .fields-group {
      gap: 12px;
    }

    .form-group {
      .form-label {
        font-size: 13px;
      }

      .radio-group {
        flex-direction: column;
        gap: 8px;
      }

      .form-control {
        font-size: 13px;
      }

      .form-text {
        font-size: 11px;
      }
    }
  }
}
</style>
