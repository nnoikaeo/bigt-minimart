<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
    <div class="max-w-2xl mx-auto py-8">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">⚙️ Setup</h1>
        <p class="text-gray-600 mb-6">Initialize test users for login</p>

        <!-- Status Alert -->
        <div v-if="status" :class="[
          'p-4 rounded-lg mb-6',
          status.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        ]">
          <p :class="[
            'font-semibold',
            status.success ? 'text-green-800' : 'text-yellow-800'
          ]">
            {{ status.success ? '✅' : '⚠️' }} {{ statusMessage }}
          </p>
          <p v-if="statusDetails" class="text-sm mt-2" :class="[
            status.success ? 'text-green-700' : 'text-yellow-700'
          ]">{{ statusDetails }}</p>
          
          <!-- Show results table if available -->
          <div v-if="status.results && status.results.length > 0" class="mt-3">
            <p class="text-xs font-semibold mb-2">📊 Results:</p>
            <div class="text-xs space-y-1 bg-white bg-opacity-50 p-2 rounded">
              <div v-for="(result, i) in status.results" :key="i" class="flex justify-between">
                <span>{{ result.email }}</span>
                <span :class="result.status === 'created' ? 'text-green-600' : result.status === 'already-exists' ? 'text-blue-600' : 'text-red-600'">
                  {{ result.status === 'created' ? '✅ Created' : result.status === 'already-exists' ? '⏭️ Exists' : '❌ Error' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Initialize Buttons -->
        <div v-if="!status || !status.success" class="space-y-4 mb-8">
          <div>
            <button
              @click="initializeUsers"
              :disabled="loading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <span v-if="loading">⏳ Initializing Firebase Users...</span>
              <span v-else>🚀 Step 1: Create Firebase Auth Users</span>
            </button>
            <p class="text-sm text-gray-600 mt-2">
              Creates test users in Firebase Authentication
            </p>
          </div>

          <div>
            <button
              @click="seedFirestore"
              :disabled="loadingFirestore"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <span v-if="loadingFirestore">⏳ Seeding Firestore...</span>
              <span v-else>🌱 Step 2: Seed Firestore (Hybrid Approach)</span>
            </button>
            <p class="text-sm text-gray-600 mt-2">
              Populates Firestore with roles and permissions from users.json
            </p>
          </div>
        </div>

        <!-- Success Action -->
        <div v-if="status && status.success" class="mb-8">
          <NuxtLink 
            to="/login"
            class="block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            ✅ Go to Login Page
          </NuxtLink>
          <p class="text-sm text-green-700 mt-2 text-center font-semibold">
            All test users ready! Use any of the credentials to login.
          </p>
        </div>

        <!-- Test Credentials -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-blue-900 mb-4">📋 Test Credentials</h2>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p class="text-sm text-yellow-900"><strong>⚠️ Important:</strong> Create Firebase Auth users with these exact emails</p>
            <p class="text-xs text-yellow-800 mt-1">These must match the Firestore data from Step 2</p>
          </div>
          
          <div class="space-y-3">
            <div class="bg-white p-3 rounded border border-blue-200">
              <p class="font-semibold text-blue-900">Owner (เจ้าของ)</p>
              <p class="text-sm text-gray-700"><strong>Email:</strong> nop@bigt.co.th</p>
              <p class="text-sm text-gray-700"><strong>Password:</strong> password123</p>
            </div>

            <div class="bg-white p-3 rounded border border-blue-200">
              <p class="font-semibold text-blue-900">Manager (ผู้จัดการ)</p>
              <p class="text-sm text-gray-700"><strong>Email:</strong> lek@bigt.co.th</p>
              <p class="text-sm text-gray-700"><strong>Password:</strong> password123</p>
            </div>

            <div class="bg-white p-3 rounded border border-blue-200">
              <p class="font-semibold text-blue-900">Cashier (เก็บเงิน)</p>
              <p class="text-sm text-gray-700"><strong>Email:</strong> kook@bigt.co.th</p>
              <p class="text-sm text-gray-700"><strong>Password:</strong> password123</p>
            </div>

            <div class="bg-white p-3 rounded border border-blue-200">
              <p class="font-semibold text-blue-900">Assistant Manager (ผู้ช่วย ผจก.)</p>
              <p class="text-sm text-gray-700"><strong>Email:</strong> pung@bigt.co.th</p>
              <p class="text-sm text-gray-700"><strong>Password:</strong> password123</p>
            </div>

            <div class="bg-white p-3 rounded border border-blue-200">
              <p class="font-semibold text-blue-900">Auditor (ผู้ตรวจสอบ)</p>
              <p class="text-sm text-gray-700"><strong>Email:</strong> tip@bigt.co.th</p>
              <p class="text-sm text-gray-700"><strong>Password:</strong> password123</p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-blue-200">
            <NuxtLink 
              to="/login"
              class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              → Go to Login
            </NuxtLink>
          </div>
        </div>

        <!-- Manual Setup Instructions -->
        <details class="border border-gray-300 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">
            ℹ️ If automatic setup doesn't work (Manual Setup Guide)
          </summary>
          
          <div class="mt-4 text-sm text-gray-700 space-y-3">
            <p><strong>Option A: Firebase Console (Recommended)</strong></p>
            <ol class="list-decimal list-inside space-y-2 ml-2">
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" class="text-blue-600 hover:underline">Firebase Console</a></li>
              <li>Select project: <strong>bigt-minimart</strong></li>
              <li>Click <strong>Authentication</strong> → <strong>Users</strong></li>
              <li>Click <strong>Create user</strong> button (top right)</li>
              <li>Create 5 users with emails from the Test Credentials section above:
                <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>nop@bigt.co.th</li>
                  <li>lek@bigt.co.th</li>
                  <li>kook@bigt.co.th</li>
                  <li>pung@bigt.co.th</li>
                  <li>tip@bigt.co.th</li>
                </ul>
              </li>
              <li>Use password: <code class="bg-gray-100 px-1 rounded">password123</code> for all</li>
              <li>Return to this page and refresh</li>
            </ol>

            <p class="mt-4"><strong>Option B: Service Account Setup</strong></p>
            <ol class="list-decimal list-inside space-y-2 ml-2">
              <li>Get service account key from Firebase Console</li>
              <li>Set <code class="bg-gray-100 px-1 rounded">FIREBASE_SERVICE_ACCOUNT_KEY</code> environment variable</li>
              <li>Click "Initialize Test Users" button above</li>
            </ol>

            <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
              <p class="text-yellow-900"><strong>⚠️ Note:</strong> Currently, the service account key is not configured.</p>
              <p class="text-yellow-800 mt-2">Use the Firebase Console method (Option A) for quickest setup.</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

interface ApiResponse {
  success: boolean
  message?: string
  createdCount?: number
  existingCount?: number
  results?: Array<{
    email: string
    status: 'created' | 'already-exists' | 'error'
    message?: string
  }>
  hint?: string
}

const loading = ref(false)
const loadingFirestore = ref(false)
const status = ref<ApiResponse | null>(null)
const statusMessage = ref('')
const statusDetails = ref('')

const initializeUsers = async () => {
  loading.value = true
  status.value = null
  statusMessage.value = ''
  statusDetails.value = ''

  try {
    const response = await fetch('/api/init-users', {
      method: 'POST'
    })

    const data: ApiResponse = await response.json()
    status.value = data

    if (data.success) {
      statusMessage.value = data.message || '✅ Users initialized successfully'
      statusDetails.value = `Created: ${data.createdCount}, Already existed: ${data.existingCount}`
    } else {
      statusMessage.value = data.message || '⚠️ Setup encountered an issue'
      statusDetails.value = data.hint || 'Check console for details or try manual setup'
    }
  } catch (error: any) {
    status.value = { success: false }
    statusMessage.value = '❌ Error: ' + error.message
    statusDetails.value = 'Please check the browser console for more details'
  } finally {
    loading.value = false
  }
}

const seedFirestore = async () => {
  loadingFirestore.value = true
  statusMessage.value = ''
  statusDetails.value = ''

  try {
    console.log('[Setup] Calling /api/admin/seed-firestore...')
    const response = await fetch('/api/admin/seed-firestore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('[Setup] Seed response:', data)

    if (data.success) {
      status.value = { success: true }
      statusMessage.value = '✅ Firestore Seeded Successfully (Hybrid Approach)'
      statusDetails.value = data.message || `${data.data?.created || 0} users created in Firestore`
      
      if (data.data?.errors?.length > 0) {
        statusDetails.value += ` (${data.data.errors.length} errors)`
      }
    } else {
      status.value = { success: false }
      statusMessage.value = '⚠️ Firestore seeding issue'
      statusDetails.value = data.error || 'See console for details'
    }
  } catch (error: any) {
    console.error('[Setup] Seed error:', error)
    status.value = { success: false }
    statusMessage.value = '❌ Error seeding Firestore'
    statusDetails.value = error.message || 'Check browser console'
  } finally {
    loadingFirestore.value = false
  }
}
</script>
