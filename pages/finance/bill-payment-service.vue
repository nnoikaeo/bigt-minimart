<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">💳 บริการรับชำระบิล</h1>
      <p class="text-gray-600 mt-2">นับและตรวจสอบเงินจากบริการรับชำระบิล</p>
    </div>

    <!-- Main Content -->
    <div class="bg-white rounded-lg shadow">
      <!-- Breadcrumb -->
      <Breadcrumb
        :items="[
          { label: 'หน้าหลัก', route: '/' },
          { label: 'บันทึกรายวัน' },
          { label: 'บริการรับชำระบิล' },
        ]"
      />

      <!-- Content Area -->
      <div class="p-6">
        <!-- Info Box -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h3 class="text-lg font-semibold text-blue-900">📋 ขั้นตอนการบันทึก</h3>
          <ol class="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
            <li>นับเงินจากการชำระบิล (ประเภทต่างๆ)</li>
            <li>นับค่าบริการ (Service Fee)</li>
            <li>บันทึกรายการและยอดเงินในระบบ</li>
            <li>ส่งให้ Auditor ตรวจสอบและ Owner อนุมัติ</li>
          </ol>
        </div>

        <!-- Recording Form Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column: Input Form -->
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-800">📝 บันทึกข้อมูล</h2>

            <!-- Date Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
              <input
                v-model="formData.date"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Bill Payment Cash Section -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-semibold text-gray-800 mb-3">💵 เงินสดจากการชำระบิล</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-sm text-gray-600">ชำระบิลสาธารณูปโภค</label>
                  <input
                    v-model.number="formData.utilityBills"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-600">ชำระบิลโทรศัพท์</label>
                  <input
                    v-model.number="formData.telecomBills"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-600">ชำระบิลประกันภัย</label>
                  <input
                    v-model.number="formData.insuranceBills"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-600">ชำระบิลอื่นๆ</label>
                  <input
                    v-model.number="formData.otherBills"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <!-- Service Fee Section -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-semibold text-gray-800 mb-3">⚡ ค่าบริการ (Service Fee)</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-sm text-gray-600">ค่าบริการจากการชำระบิล</label>
                  <input
                    v-model.number="formData.serviceFeeCash"
                    type="number"
                    placeholder="0.00"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
              <textarea
                v-model="formData.notes"
                placeholder="เช่น มีปัญหาการชำระ, ตรวจสอบเพิ่มเติม, เป็นต้น"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                @click="submitForm"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                💾 บันทึก
              </button>
              <button
                @click="resetForm"
                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
              >
                🔄 ล้างข้อมูล
              </button>
            </div>
          </div>

          <!-- Right Column: Summary -->
          <div class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-800">📊 สรุปยอด</h2>

            <!-- Summary Cards -->
            <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <p class="text-sm text-green-700">เงินสดจากการชำระบิล</p>
              <p class="text-3xl font-bold text-green-900">{{ formatCurrency(totalBillPaymentCash) }}</p>
              <p class="text-xs text-green-600 mt-1">รวมทุกประเภท</p>
            </div>

            <!-- Breakdown -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 class="font-semibold text-gray-800 mb-2">📋 รายละเอียด</h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">สาธารณูปโภค:</span>
                  <span class="font-semibold">{{ formatCurrency(formData.utilityBills) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">โทรศัพท์:</span>
                  <span class="font-semibold">{{ formatCurrency(formData.telecomBills) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">ประกันภัย:</span>
                  <span class="font-semibold">{{ formatCurrency(formData.insuranceBills) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">อื่นๆ:</span>
                  <span class="font-semibold">{{ formatCurrency(formData.otherBills) }}</span>
                </div>
                <div class="border-t pt-1 mt-2 flex justify-between">
                  <span class="text-gray-700 font-semibold">รวม:</span>
                  <span class="font-bold text-green-600">{{ formatCurrency(totalBillPaymentCash) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <p class="text-sm text-yellow-700">ค่าบริการ (Service Fee)</p>
              <p class="text-3xl font-bold text-yellow-900">{{ formatCurrency(formData.serviceFeeCash) }}</p>
            </div>

            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p class="text-sm text-blue-700">รวมทั้งสิ้น</p>
              <p class="text-3xl font-bold text-blue-900">{{ formatCurrency(grandTotal) }}</p>
              <p class="text-xs text-blue-600 mt-1">เงินสด + ค่าบริการ</p>
            </div>

            <!-- Status Box -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 class="font-semibold text-gray-800 mb-2">📌 สถานะ</h3>
              <p class="text-sm text-gray-600">เมื่อบันทึกเรียบร้อย สถานะจะเป็น <span class="font-semibold text-blue-600">"submitted"</span></p>
              <p class="text-sm text-gray-600 mt-2">Auditor จะตรวจสอบและ Owner จะอนุมัติ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Form Data
const formData = ref({
  date: new Date().toISOString().split('T')[0],
  utilityBills: 0,
  telecomBills: 0,
  insuranceBills: 0,
  otherBills: 0,
  serviceFeeCash: 0,
  notes: '',
})

// Computed Properties
const totalBillPaymentCash = computed(() => {
  return (
    (formData.value.utilityBills || 0) +
    (formData.value.telecomBills || 0) +
    (formData.value.insuranceBills || 0) +
    (formData.value.otherBills || 0)
  )
})

const grandTotal = computed(() => {
  return totalBillPaymentCash.value + (formData.value.serviceFeeCash || 0)
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount)
}

const submitForm = () => {
  // TODO: Implement submit logic
  console.log('Submitting form:', formData.value)
  alert('✅ บันทึกเรียบร้อย (Demo)')
}

const resetForm = () => {
  formData.value = {
    date: new Date().toISOString().split('T')[0],
    utilityBills: 0,
    telecomBills: 0,
    insuranceBills: 0,
    otherBills: 0,
    serviceFeeCash: 0,
    notes: '',
  }
}
</script>
