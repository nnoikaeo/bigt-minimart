<script setup lang="ts">
import { ref } from 'vue'

export interface BalanceCardItem {
  label: string
  value: number
  icon?: string
  colorClass?: string
  subtitle?: string
  cardClass?: string
  labelClass?: string
  valueSize?: string
}

interface Props {
  primaryCards: BalanceCardItem[]
  secondaryCards?: BalanceCardItem[]
  collapsible?: boolean
  defaultExpanded?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  secondaryCards: () => [],
  collapsible: true,
  defaultExpanded: false,
  title: '📊 ยอดเงิน',
})

const isExpanded = ref(props.defaultExpanded)

function toggle() {
  isExpanded.value = !isExpanded.value
}

function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ฿'
  )
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-semibold text-gray-700">{{ title }}</h2>
      <button
        v-if="collapsible && secondaryCards.length > 0"
        type="button"
        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        @click="toggle"
      >
        {{ isExpanded ? '▲ ย่อ' : '▼ ดูเพิ่ม' }}
      </button>
    </div>

    <!-- Row 1: Primary cards (always visible) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <BaseCard
        v-for="(card, index) in primaryCards"
        :key="index"
        :class="['text-center', card.cardClass]"
      >
        <div :class="['text-xs mb-1', card.labelClass || 'text-gray-500']">
          {{ card.label }}
        </div>
        <div :class="[card.valueSize || 'text-lg', 'font-bold', card.colorClass || 'text-gray-700']">
          {{ formatCurrency(card.value) }}
        </div>
        <div v-if="card.subtitle" class="text-xs text-gray-400 mt-0.5">
          {{ card.subtitle }}
        </div>
      </BaseCard>
    </div>

    <!-- Row 2: Secondary cards (expandable) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[500px] opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-[500px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isExpanded && secondaryCards.length > 0" class="overflow-hidden">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <BaseCard
            v-for="(card, index) in secondaryCards"
            :key="index"
            :class="['text-center', card.cardClass]"
          >
            <div :class="['text-xs mb-1', card.labelClass || 'text-gray-500']">
              {{ card.label }}
            </div>
            <div :class="[card.valueSize || 'text-lg', 'font-bold', card.colorClass || 'text-gray-700']">
              {{ formatCurrency(card.value) }}
            </div>
            <div v-if="card.subtitle" class="text-xs text-gray-400 mt-0.5">
              {{ card.subtitle }}
            </div>
          </BaseCard>
        </div>
      </div>
    </Transition>
  </div>
</template>
