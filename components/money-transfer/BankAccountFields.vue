<template>
  <div class="bank-account-fields">
    <div class="fields-group">
      <!-- Account Type -->
      <div class="form-group">
        <label class="form-label">
          Account Type (ประเภทบัญชี)
          <span class="required">*</span>
        </label>
        <select v-model="localValue.accountType" class="form-control">
          <option value="">-- Select Account Type --</option>
          <option value="savings">Savings (ออมทรัพย์)</option>
          <option value="current">Current (กระแสรายวัน)</option>
          <option value="other">Other (อื่น ๆ)</option>
        </select>
      </div>

      <!-- Account Number -->
      <div class="form-group">
        <label class="form-label">
          Account Number (หมายเลขบัญชี)
          <span class="required">*</span>
        </label>
        <input
          v-model="localValue.accountNumber"
          type="text"
          class="form-control"
          placeholder="e.g., 123-4-56789-0"
          @input="handleAccountNumberInput"
        />
        <small class="form-text">Format: XXX-X-XXXXX-X (may vary by bank)</small>
      </div>

      <!-- Account Name -->
      <div class="form-group">
        <label class="form-label">
          Account Name (ชื่อบัญชี)
          <span class="required">*</span>
        </label>
        <input
          v-model="localValue.accountName"
          type="text"
          class="form-control"
          placeholder="Account holder name"
        />
        <small class="form-text">As shown on bank book or account statement</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: {
    accountType?: 'savings' | 'current' | 'other'
    accountNumber?: string
    accountName?: string
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
 * Handle account number input - allow digits and dashes only
 */
function handleAccountNumberInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value

  // Keep only digits and dashes
  value = value.replace(/[^\d-]/g, '')

  // Limit total length
  if (value.replace(/-/g, '').length > 20) {
    value = value.slice(0, -1)
  }

  localValue.value = {
    ...localValue.value,
    accountNumber: value,
  }
}
</script>

<style scoped lang="scss">
.bank-account-fields {
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

    .form-control {
      padding: 10px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      color: #212529;

      &:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }

      &[type='text'] {
        font-family: 'Courier New', monospace;
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
  .bank-account-fields {
    padding: 12px;

    .fields-group {
      gap: 12px;
    }

    .form-group {
      .form-label {
        font-size: 13px;
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
