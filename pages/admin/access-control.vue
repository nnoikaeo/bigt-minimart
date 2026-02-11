<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">จัดการสิทธิ์การเข้าถึง</h1>
      <p class="mt-2 text-gray-600">จัดการผู้ใช้, บทบาท และสิทธิ์</p>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'users'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'users'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          <span class="flex items-center gap-2">
            👥
            จัดการผู้ใช้
          </span>
        </button>
        <button
          @click="activeTab = 'roles'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'roles'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          <span class="flex items-center gap-2">
            🔐
            บทบาท และ สิทธิ์
          </span>
        </button>
        <button
          @click="activeTab = 'menu'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'menu'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          <span class="flex items-center gap-2">
            🗂️
            จัดการเมนู Sidebar
          </span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="space-y-6">
      <!-- Users Tab -->
      <div v-show="activeTab === 'users'" class="space-y-6">
        <!-- Add User Button -->
        <div class="flex justify-end">
          <button
            @click="openUserModal('create')"
            class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            ✚ เพิ่ม
          </button>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div v-if="store.loading" class="p-8 text-center">
            <div class="inline-block animate-spin">
              🔄
            </div>
            <p class="mt-2 text-gray-600">กำลังโหลดผู้ใช้...</p>
          </div>

          <div v-else-if="store.error" class="p-8 text-center">
            <div class="text-red-600 text-sm">{{ store.error }}</div>
            <button
              @click="loadData"
              class="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              ลองใหม่
            </button>
          </div>

          <table v-else class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  ชื่อ
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  อีเมล
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  บทบาทหลัก
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  บทบาททั้งหมด
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  สถานะ
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="user in store.getAllUsers" :key="user.uid" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ user.displayName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                  >
                    {{ store.getRoleNameById(user.primaryRole) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="role in user.roles"
                      :key="role"
                      class="inline-flex px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                    >
                      {{ store.getRoleNameById(role) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    type="button"
                    @click="toggleUserStatus(user)"
                    :class="[
                      'relative inline-flex w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500',
                      user.isActive ? 'bg-green-500' : 'bg-gray-300',
                    ]"
                    :title="user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
                  >
                    <span
                      :class="[
                        'inline-block w-7 h-7 rounded-full bg-white transform transition-transform',
                        user.isActive ? 'translate-x-6' : 'translate-x-0',
                      ]"
                    />
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                  <button
                    @click="openUserModal('edit', user)"
                    class="text-blue-600 hover:text-blue-900 font-medium text-lg"
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  <button
                    @click="confirmDeleteUser(user)"
                    class="text-red-600 hover:text-red-900 font-medium text-lg"
                    title="ลบ"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!store.loading && store.getAllUsers.length === 0" class="p-8 text-center">
            <p class="text-gray-600">ไม่พบผู้ใช้ สร้างผู้ใช้คนแรกของคุณเพื่อเริ่มต้น</p>
          </div>
        </div>
      </div>

      <!-- Roles Tab -->
      <div v-show="activeTab === 'roles'" class="space-y-6">
        <!-- Roles Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="role in store.getAllRoles"
            :key="role.id"
            class="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
          >
            <h3 class="font-semibold text-gray-900">{{ role.name }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ role.description }}</p>
            <button
              @click="openPermissionsModal(role)"
              class="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              ตั้งค่าสิทธิ์ →
            </button>
          </div>
        </div>

        <div v-if="store.getAllRoles.length === 0" class="p-8 bg-white rounded-lg text-center">
          <p class="text-gray-600">ไม่พบบทบาท</p>
        </div>
      </div>

      <!-- Menu Tab -->
      <div v-show="activeTab === 'menu'" class="space-y-6">
        <!-- Loading State -->
        <div v-if="sidebarStore.loading" class="p-8 bg-white rounded-lg text-center">
          <div class="inline-block animate-spin">🔄</div>
          <p class="mt-2 text-gray-600">กำลังโหลดเมนู...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="sidebarStore.error" class="p-8 bg-white rounded-lg text-center">
          <div class="text-red-600 text-sm">{{ sidebarStore.error }}</div>
          <button
            @click="sidebarStore.loadSidebarMenu"
            class="mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            ลองใหม่
          </button>
        </div>

        <!-- Menu Content with Status Bar -->
        <div v-else class="space-y-2">
          <!-- Status Bar -->
          <div
            :class="[
              'rounded-lg p-4 flex items-center justify-between transition',
              dirtyPages.length > 0
                ? 'bg-yellow-50 border border-yellow-300'
                : 'bg-gray-50 border border-gray-200'
            ]"
          >
            <div class="text-sm" :class="dirtyPages.length > 0 ? 'text-yellow-800' : 'text-gray-600'">
              <span class="font-medium">
                <span v-if="dirtyPages.length > 0">⚠️ มี {{ dirtyPages.length }} pages ที่เปลี่ยนแปลง</span>
                <span v-else>✅ ไม่มีการเปลี่ยนแปลง</span>
              </span>
              <span v-if="dirtyPages.length > 0 && selectedDirtyPages.length > 0" class="ml-2">(เลือก {{ selectedDirtyPages.length }})</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="saveBatchPages"
                :disabled="dirtyPages.length === 0 || selectedDirtyPages.length === 0 || isSavingBatch"
                class="px-4 py-2 rounded-lg transition font-medium text-sm"
                :class="dirtyPages.length === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'"
              >
                <span v-if="isSavingBatch" class="inline-block animate-spin">🔄</span>
                <span v-else>💾 บันทึกที่เลือก ({{ selectedDirtyPages.length }})</span>
              </button>
              <button
                @click="resetChanges"
                :disabled="dirtyPages.length === 0 || isSavingBatch"
                class="px-4 py-2 rounded-lg transition font-medium text-sm"
                :class="dirtyPages.length === 0 ? 'border border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'"
              >
                🔄 รีเซ็ต
              </button>
            </div>
          </div>
          <div v-for="group in sidebarStore.sidebarMenu" :key="group.groupKey" class="bg-white rounded-lg shadow">
            <!-- Group Header with Collapse Toggle -->
            <div class="px-6 py-4 border-b border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition" @click="toggleGroupExpanded(group.groupKey)">
              <span class="text-xl transition-transform flex-shrink-0" :style="{ transform: isGroupExpanded(group.groupKey) ? 'rotate(0deg)' : 'rotate(-90deg)' }">
                ▼
              </span>
              <h3 class="text-base font-bold text-gray-900">
                {{ group.icon }} {{ group.groupName }} <span class="text-sm text-gray-500 font-normal">({{ group.pages.length }} หน้า)</span>
              </h3>
            </div>

            <!-- Pages in Group (Expandable Table) -->
            <div v-if="isGroupExpanded(group.groupKey)" class="border-t border-gray-200 overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-100">
                  <tr class="text-xs font-semibold text-gray-700">
                    <th class="px-3 py-3 text-center w-14">เลือก</th>
                    <th class="px-4 py-3 text-left min-w-56">ชื่อเพจ</th>
                    <th class="px-3 py-3 text-center w-20" title="เจ้าของ">เจ้าของ</th>
                    <th class="px-3 py-3 text-center w-20" title="ผู้จัดการ">ผู้จัดการ</th>
                    <th class="px-3 py-3 text-center w-20" title="ผู้ช่วยผู้จัดการ">ผู้ช่วย</th>
                    <th class="px-3 py-3 text-center w-20" title="ผู้ตรวจสอบ">ออดิท</th>
                    <th class="px-3 py-3 text-center w-20" title="แคชเชียร์">แคชเชียร์</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="page in group.pages"
                    :key="page.pageKey"
                    class="hover:bg-gray-50 transition"
                    :class="[
                      dirtyPages.includes(page.pageKey)
                        ? 'bg-yellow-50'
                        : 'bg-white',
                    ]"
                  >
                    <!-- Checkbox Column -->
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="isPageSelected(page.pageKey)"
                        @change="togglePageSelection(page.pageKey)"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>

                    <!-- Page Name Column -->
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <span v-if="page.icon" class="text-lg">{{ page.icon }}</span>
                        <span class="font-medium text-gray-900">{{ page.pageName }}</span>
                        <span
                          v-if="dirtyPages.includes(page.pageKey)"
                          class="inline-block w-2 h-2 bg-yellow-500 rounded-full"
                          title="มีการเปลี่ยนแปลง"
                        />
                      </div>
                    </td>

                    <!-- Role Checkboxes (Owner, Manager, Assistant Manager, Auditor, Cashier) -->
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="page.requiredRoles === null || page.requiredRoles.includes('owner')"
                        @change="(e) => togglePageRole(page, 'owner', (e.target as any).checked)"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="page.requiredRoles === null || page.requiredRoles.includes('manager')"
                        @change="(e) => togglePageRole(page, 'manager', (e.target as any).checked)"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="page.requiredRoles === null || page.requiredRoles.includes('assistant_manager')"
                        @change="(e) => togglePageRole(page, 'assistant_manager', (e.target as any).checked)"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="page.requiredRoles === null || page.requiredRoles.includes('auditor')"
                        @change="(e) => togglePageRole(page, 'auditor', (e.target as any).checked)"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="page.requiredRoles === null || page.requiredRoles.includes('cashier')"
                        @change="(e) => togglePageRole(page, 'cashier', (e.target as any).checked)"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div
      v-if="showUserModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeUserModal"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-900">
          {{ userModalMode === 'create' ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้' }}
        </h2>

        <form @submit.prevent="saveUser" class="space-y-4">
          <!-- Display Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ
            </label>
            <input
              v-model="userForm.displayName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              v-model="userForm.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <!-- Primary Role -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              บทบาทหลัก
            </label>
            <div class="space-y-2">
              <label v-for="role in store.getAllRoles" :key="role.id" class="flex items-center">
                <input
                  v-model="userForm.primaryRole"
                  type="radio"
                  :value="role.id"
                  class="w-4 h-4 text-green-600 border-gray-300 focus:ring-2 focus:ring-green-500"
                />
                <span class="ml-2 text-sm text-gray-700">{{ role.name }}</span>
              </label>
            </div>
          </div>

          <!-- Roles (Checkboxes) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              บทบาท (เลือกอย่างน้อย 1 บทบาท)
            </label>
            <div class="space-y-2">
              <label v-for="role in store.getAllRoles" :key="role.id" class="flex items-center">
                <input
                  v-model="userForm.roles"
                  type="checkbox"
                  :value="role.id"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span class="ml-2 text-sm text-gray-700">{{ role.name }}</span>
              </label>
            </div>
          </div>

          <!-- Submit -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeUserModal"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              {{ userModalMode === 'create' ? 'สร้าง' : 'บันทึก' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Permissions Modal -->
    <div
      v-if="showPermissionsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closePermissionsModal"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
        <h2 class="text-xl font-bold mb-4 text-gray-900">
          สิทธิ์สำหรับ <span class="text-green-600">{{ selectedRole?.name }}</span>
        </h2>

        <div class="space-y-4">
          <div v-for="permission in store.getAllPermissions" :key="permission.id" class="flex items-start">
            <input
              v-model="permissionsForm[permission.id]"
              type="checkbox"
              class="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div class="ml-3">
              <label class="font-medium text-gray-900">{{ permission.name }}</label>
              <p class="text-sm text-gray-600">{{ permission.description }}</p>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex gap-3 pt-6 border-t">
          <button
            @click="closePermissionsModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            ยกเลิก
          </button>
          <button
            @click="savePermissions"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            บันทึกสิทธิ์
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDeleteConfirm"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <h2 class="text-lg font-bold mb-4 text-gray-900">ยืนยันการลบ</h2>
        <p class="text-gray-600 mb-6">
          คุณแน่ใจหรือว่าต้องการลบ <strong>{{ userToDelete?.displayName }}</strong
          >? การกระทำนี้ไม่สามารถเลิกทำได้
        </p>
        <div class="flex gap-3">
          <button
            @click="closeDeleteConfirm"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            ยกเลิก
          </button>
          <button
            @click="deleteUser"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAccessControlStore } from '~/stores/access-control'
import { useSidebarStore } from '~/stores/sidebar'
import type { User, Role } from '~/types/access-control'
import type { SidebarPage } from '~/utils/sidebar-menu'

// Stores
const store = useAccessControlStore()
const sidebarStore = useSidebarStore()

// Tabs
const activeTab = ref<'users' | 'roles' | 'menu'>('users')

// User Modal
const showUserModal = ref(false)
const userModalMode = ref<'create' | 'edit'>('create')
const userForm = ref({
  displayName: '',
  email: '',
  roles: [] as string[],
  primaryRole: '',
  isActive: true,
})
const currentUserId = ref<string | null>(null)

// Permissions Modal
const showPermissionsModal = ref(false)
const selectedRole = ref<Role | null>(null)
const permissionsForm = ref<Record<string, boolean>>({})

// Delete Confirmation
const showDeleteConfirm = ref(false)
const userToDelete = ref<User | null>(null)

// Sidebar Menu Management
const isUpdatingPage = ref<string | null>(null)
const editingPages = ref<Record<string, SidebarPage>>({})
const originalPages = ref<Record<string, SidebarPage>>({})
const selectedPages = ref<Set<string>>(new Set())
const isSavingBatch = ref(false)
const expandedGroups = ref<Set<string>>(new Set())

/**
 * Track dirty pages (มีการเปลี่ยนแปลง)
 */
const dirtyPages = computed(() => {
  const dirty: string[] = []
  for (const [pageKey, editedPage] of Object.entries(editingPages.value)) {
    const original = originalPages.value[pageKey]
    if (!original) continue

    const editedRoles = editedPage.requiredRoles
    const originalRoles = original.requiredRoles

    // เปรียบเทียบ roles
    const rolesChanged =
      (editedRoles === null && originalRoles !== null) ||
      (editedRoles !== null && originalRoles === null) ||
      (editedRoles !== null &&
        originalRoles !== null &&
        JSON.stringify([...(editedRoles || [])].sort()) !== JSON.stringify([...(originalRoles || [])].sort()))

    if (rolesChanged) {
      dirty.push(pageKey)
    }
  }
  return dirty
})

/**
 * Get selected pages that are dirty
 */
const selectedDirtyPages = computed(() => {
  return Array.from(selectedPages.value).filter((pageKey) => dirtyPages.value.includes(pageKey))
})

/**
 * Initialize editing pages from sidebar menu on mount
 */
const initializeEditingPages = async () => {
  if (sidebarStore.sidebarMenu.length === 0) {
    await sidebarStore.loadSidebarMenu()
  }
  // Copy menu data to editing state
  for (const group of sidebarStore.sidebarMenu) {
    for (const page of group.pages) {
      editingPages.value[page.pageKey] = JSON.parse(JSON.stringify(page))
      originalPages.value[page.pageKey] = JSON.parse(JSON.stringify(page))
    }
  }
}

// =========================================================================
// Watchers
// =========================================================================

/**
 * Auto-sync primaryRole to roles
 * เมื่อเลือก primaryRole ให้เคลียร์ checkbox ทั้งหมด แล้วเลือกเฉพาะ primaryRole
 */
watch(
  () => userForm.value.primaryRole,
  (newPrimaryRole) => {
    // ถ้า primaryRole มีค่า ให้ set roles เป็น primaryRole เท่านั้น
    if (newPrimaryRole) {
      userForm.value.roles = [newPrimaryRole]
    }
  }
)

// =========================================================================
// Methods
// ===================================================================

/**
 * Load all data from store
 */
const loadData = async () => {
  console.log('[AccessControl Page] loadData called')
  console.log('[AccessControl Page] store instance:', store)
  console.log('[AccessControl Page] store.loadAllData type:', typeof store.loadAllData)
  
  try {
    console.log('[AccessControl Page] Calling store.loadAllData()')
    await store.loadAllData()
    console.log('[AccessControl Page] loadAllData completed successfully')
  } catch (error: any) {
    console.error('[AccessControl Page] loadData error:', error)
  }
}

/**
 * Toggle user active status
 * เปลี่ยนสถานะการทำงานของผู้ใช้และบันทึกอัตโนมัติ
 */
const toggleUserStatus = async (user: User) => {
  try {
    const result = await store.updateUser(user.uid, {
      displayName: user.displayName,
      email: user.email,
      roles: user.roles as any,
      primaryRole: user.primaryRole as any,
      isActive: !user.isActive,
    })
    if (!result.success) {
      alert(result.error || 'Failed to update user status')
    }
  } catch (error: any) {
    alert(error.message)
  }
}

/**
 * Open user modal for create or edit
 */
const openUserModal = (mode: 'create' | 'edit', user?: User) => {
  userModalMode.value = mode
  if (mode === 'create') {
    userForm.value = {
      displayName: '',
      email: '',
      roles: [],
      primaryRole: '',
      isActive: true,
    }
    currentUserId.value = null
  } else if (user) {
    userForm.value = {
      displayName: user.displayName,
      email: user.email,
      roles: user.roles,
      primaryRole: user.primaryRole,
      isActive: user.isActive,
    }
    currentUserId.value = user.uid
  }
  showUserModal.value = true
}

/**
 * Close user modal
 */
const closeUserModal = () => {
  showUserModal.value = false
}

/**
 * Save user (create or update)
 */
const saveUser = async () => {
  if (!userForm.value.displayName || !userForm.value.email || !userForm.value.primaryRole) {
    alert('Please fill in all fields')
    return
  }

  if (userForm.value.roles.length === 0) {
    alert('Please select at least one role')
    return
  }

  if (!userForm.value.roles.includes(userForm.value.primaryRole)) {
    alert('Primary role must be one of the selected roles')
    return
  }

  try {
    if (userModalMode.value === 'create') {
      const result = await store.createUser({
        email: userForm.value.email,
        displayName: userForm.value.displayName,
        roles: userForm.value.roles as any,
        primaryRole: userForm.value.primaryRole as any,
      })
      if (result.success) {
        closeUserModal()
      } else {
        alert(result.error)
      }
    } else if (currentUserId.value) {
      const result = await store.updateUser(currentUserId.value, {
        displayName: userForm.value.displayName,
        email: userForm.value.email,
        roles: userForm.value.roles as any,
        primaryRole: userForm.value.primaryRole as any,
        isActive: userForm.value.isActive,
      })
      if (result.success) {
        closeUserModal()
      } else {
        alert(result.error)
      }
    }
  } catch (error: any) {
    alert(error.message)
  }
}

/**
 * Open permissions modal
 */
const openPermissionsModal = async (role: Role) => {
  selectedRole.value = role
  await store.fetchRolePermissions(role.id)
  permissionsForm.value = { ...store.getRolePermissions(role.id) }
  showPermissionsModal.value = true
}

/**
 * Close permissions modal
 */
const closePermissionsModal = () => {
  showPermissionsModal.value = false
  selectedRole.value = null
}

/**
 * Save permissions
 */
const savePermissions = async () => {
  if (!selectedRole.value) return

  try {
    const result = await store.updateRolePermissions(selectedRole.value.id, permissionsForm.value)
    if (result.success) {
      closePermissionsModal()
    } else {
      alert(result.error)
    }
  } catch (error: any) {
    alert(error.message)
  }
}

/**
 * Confirm delete user
 */
const confirmDeleteUser = (user: User) => {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

/**
 * Close delete confirmation
 */
const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false
  userToDelete.value = null
}

/**
 * Delete user
 */
const deleteUser = async () => {
  if (!userToDelete.value) return

  try {
    const result = await store.deleteUser(userToDelete.value.uid)
    if (result.success) {
      closeDeleteConfirm()
    } else {
      alert(result.error)
    }
  } catch (error: any) {
    alert(error.message)
  }
}

// =========================================================================
// Lifecycle
// =========================================================================

/**
 * Toggle a specific role for a page
 */
const togglePageRole = (page: SidebarPage, roleId: string, isChecked: boolean) => {
  const pageKey = page.pageKey
  const current = editingPages.value[pageKey]

  if (!current) return

  if (current.requiredRoles === null) {
    // All roles selected, start fresh with deselected roles
    const allRoles = store.getAllRoles.map((r) => r.id)
    current.requiredRoles = allRoles.filter((r) => r !== roleId)
  } else {
    // Toggle the role
    if (isChecked) {
      if (!current.requiredRoles.includes(roleId)) {
        current.requiredRoles.push(roleId)
      }
    } else {
      current.requiredRoles = current.requiredRoles.filter((r) => r !== roleId)
    }
  }
}

/**
 * Toggle all roles for a page
 */
const toggleAllRoles = (page: SidebarPage, selectAll: boolean) => {
  const pageKey = page.pageKey
  const current = editingPages.value[pageKey]

  if (!current) return

  if (selectAll) {
    current.requiredRoles = null
  } else {
    current.requiredRoles = []
  }
}

/**
 * Toggle page selection for batch save
 */
const togglePageSelection = (pageKey: string) => {
  if (selectedPages.value.has(pageKey)) {
    selectedPages.value.delete(pageKey)
  } else {
    selectedPages.value.add(pageKey)
  }
}

/**
 * Check if page is selected
 */
const isPageSelected = (pageKey: string): boolean => {
  return selectedPages.value.has(pageKey)
}

/**
 * Toggle group expansion
 */
const toggleGroupExpanded = (groupKey: string) => {
  if (expandedGroups.value.has(groupKey)) {
    expandedGroups.value.delete(groupKey)
  } else {
    expandedGroups.value.add(groupKey)
  }
}

/**
 * Check if group is expanded
 */
const isGroupExpanded = (groupKey: string): boolean => {
  return expandedGroups.value.has(groupKey)
}

/**
 * Save page access changes via API (individual)
 */
const savePageAccess = async (page: SidebarPage) => {
  isUpdatingPage.value = page.pageKey
  try {
    const editedPage = editingPages.value[page.pageKey]
    if (!editedPage) return

    const result = await sidebarStore.updatePageAccess(page.pageKey, editedPage.requiredRoles)

    if (result.success) {
      // Update original pages
      originalPages.value[page.pageKey] = JSON.parse(JSON.stringify(editedPage))
      alert(`✅ บันทึก "${page.pageName}" เสร็จแล้ว`)
    } else {
      alert(`❌ ข้อผิดพลาด: ${result.error}`)
    }
  } catch (error: any) {
    alert(`❌ เกิดข้อผิดพลาด: ${error.message}`)
  } finally {
    isUpdatingPage.value = null
  }
}

/**
 * Save batch selected pages
 */
const saveBatchPages = async () => {
  if (selectedDirtyPages.value.length === 0) {
    alert('❌ ไม่มี pages ที่มีการเปลี่ยนแปลง')
    return
  }

  isSavingBatch.value = true
  const pagesToSave = selectedDirtyPages.value
  const successCount = { value: 0 }
  const failureCount = { value: 0 }

  try {
    // Save all selected pages concurrently
    const savePromises = pagesToSave.map(async (pageKey) => {
      try {
        const editedPage = editingPages.value[pageKey]
        if (!editedPage) return

        const result = await sidebarStore.updatePageAccess(pageKey, editedPage.requiredRoles)

        if (result.success) {
          originalPages.value[pageKey] = JSON.parse(JSON.stringify(editedPage))
          successCount.value++
        } else {
          failureCount.value++
          console.error(`Failed to save ${pageKey}:`, result.error)
        }
      } catch (error: any) {
        failureCount.value++
        console.error(`Error saving ${pageKey}:`, error.message)
      }
    })

    await Promise.all(savePromises)

    // Show result message
    let message = ''
    if (successCount.value > 0) {
      message += `✅ บันทึก ${successCount.value} pages สำเร็จ`
    }
    if (failureCount.value > 0) {
      message += `\n❌ ล้มเหลว ${failureCount.value} pages`
    }

    alert(message)

    // Clear selection after successful save
    if (failureCount.value === 0) {
      selectedPages.value.clear()
    }
  } catch (error: any) {
    alert(`❌ เกิดข้อผิดพลาด: ${error.message}`)
  } finally {
    isSavingBatch.value = false
  }
}

/**
 * Reset all changes
 */
const resetChanges = () => {
  for (const [pageKey, originalPage] of Object.entries(originalPages.value)) {
    editingPages.value[pageKey] = JSON.parse(JSON.stringify(originalPage))
  }
  selectedPages.value.clear()
  alert('✅ รีเซ็ตทั้งหมด')
}

onMounted(async () => {
  await loadData()
  await initializeEditingPages()
})
</script>
