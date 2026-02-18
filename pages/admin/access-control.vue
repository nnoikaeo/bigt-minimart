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
            บทบาทและสิทธิ์
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

      <!-- Roles Tab - Matrix View -->
      <div v-show="activeTab === 'roles'" class="space-y-6">
        <!-- Roles Content with Status Bar -->
        <div class="space-y-2">
          <!-- Status Bar -->
          <div
            :class="[
              'rounded-lg p-4 flex items-center justify-between transition',
              dirtyRoles.length > 0
                ? 'bg-yellow-50 border border-yellow-300'
                : 'bg-gray-50 border border-gray-200'
            ]"
          >
            <div class="text-sm" :class="dirtyRoles.length > 0 ? 'text-yellow-800' : 'text-gray-600'">
              <span class="font-medium">
                <span v-if="dirtyRoles.length > 0">⚠️ มี {{ dirtyRoles.length }} บทบาท ที่เปลี่ยนแปลง</span>
                <span v-else>✅ ไม่มีการเปลี่ยนแปลง</span>
              </span>
              <span v-if="dirtyRoles.length > 0 && selectedDirtyRoles.length > 0" class="ml-2">(เลือก {{ selectedDirtyRoles.length }})</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="saveBatchRoles"
                :disabled="dirtyRoles.length === 0 || selectedDirtyRoles.length === 0 || isSavingRoles"
                class="px-4 py-2 rounded-lg transition font-medium text-sm"
                :class="
                  dirtyRoles.length > 0 && selectedDirtyRoles.length > 0 && !isSavingRoles
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'border border-gray-300 text-gray-600 cursor-not-allowed'
                "
              >
                <span v-if="isSavingRoles" class="inline-block animate-spin">🔄</span>
                <span v-else>💾 บันทึกที่เลือก ({{ selectedDirtyRoles.length }})</span>
              </button>
              <button
                @click="openResetConfirm"
                :disabled="dirtyRoles.length === 0"
                class="px-4 py-2 rounded-lg transition font-medium text-sm"
                :class="
                  dirtyRoles.length > 0
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'border border-gray-300 text-gray-600 cursor-not-allowed'
                "
              >
                🔄 รีเซ็ต
              </button>
            </div>
          </div>

          <!-- Permission Categories with Collapse Toggle (using CollapsibleGroup component) -->
          <div v-if="store.getAllRoles.length > 0">
            <template v-for="(permissions, category) in groupedPermissions" :key="category">
            <CollapsibleGroup
              v-if="permissions.length > 0"
              :group-id="`perm-${category}`"
              :is-expanded="isPermGroupExpanded(category)"
              :on-toggle="() => togglePermGroupExpanded(category)"
              :item-count="permissions.length"
              item-label="สิทธิ์"
              class="mb-2"
            >
              <template #title>
                {{ getCategoryLabel(category) }}
              </template>
              <template #content>
                <table class="w-full">
                  <!-- หัวตารางสิทธิ์ -->
                  <thead class="bg-gray-100">
                    <tr class="text-xs font-semibold text-gray-700 uppercase">
                      <th class="px-4 py-3 text-center w-14">เลือก</th>
                      <th class="px-4 py-3 text-left min-w-56">สิทธิ์</th>
                      <th
                        v-for="role in store.getAllRoles"
                        :key="`header-${role.id}`"
                        class="px-4 py-3 text-center min-w-32"
                        :title="role.description"
                      >
                        {{ role.name }}
                      </th>
                    </tr>
                  </thead>
                  <!-- เนื้อหาตารางสิทธิ์ -->
                  <tbody class="divide-y divide-gray-200">
                    <tr
                      v-for="perm in permissions"
                      :key="perm.id"
                      class="transition"
                      :class="[
                        isPermissionDirty(perm.id)
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'bg-white hover:bg-gray-50',
                      ]"
                    >
                      <!-- คอลัมน์เลือก (Auto-checks if dirty) -->
                      <td class="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          :checked="isPermissionDirty(perm.id)"
                          @change="(e) => {
                            if ((e.target as any).checked) {
                              selectedPermissions.add(perm.id)
                            } else {
                              selectedPermissions.delete(perm.id)
                            }
                          }"
                          class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </td>

                      <!-- คอลัมน์ชื่อสิทธิ์ -->
                      <td class="px-4 py-3">
                        <p class="font-medium text-gray-900">{{ perm.name }}</p>
                      </td>

                      <!-- คอลัมน์ช่องทำเครื่องหมายบทบาท -->
                      <td
                        v-for="role in store.getAllRoles"
                        :key="`${role.id}-${perm.id}`"
                        class="px-4 py-3 text-center"
                      >
                        <input
                          type="checkbox"
                          :checked="isPermissionGranted(role.id, perm.id)"
                          @change="togglePermissionForRole(role.id, perm.id)"
                          class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </CollapsibleGroup>
          </template>
          </div>

          <div v-else class="p-8 bg-white rounded-lg text-center">
            <p class="text-gray-600">ไม่พบบทบาท</p>
          </div>
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
                :class="dirtyPages.length === 0 ? 'border border-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'"
              >
                <span v-if="isSavingBatch" class="inline-block animate-spin">🔄</span>
                <span v-else>💾 บันทึกที่เลือก ({{ selectedDirtyPages.length }})</span>
              </button>
              <button
                @click="openResetConfirm"
                :disabled="dirtyPages.length === 0 || isSavingBatch"
                class="px-4 py-2 rounded-lg transition font-medium text-sm"
                :class="dirtyPages.length === 0 ? 'border border-gray-300 text-gray-600 cursor-not-allowed' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'"
              >
                🔄 รีเซ็ต
              </button>
            </div>
          </div>
          <template v-for="group in sidebarStore.sidebarMenu.filter(g => g.groupKey !== 'dashboard')" :key="group.groupKey">
            <CollapsibleGroup
              :group-id="group.groupKey"
              :is-expanded="isGroupExpanded(group.groupKey)"
              :on-toggle="() => toggleGroupExpanded(group.groupKey)"
              :item-count="group.pages.length"
              item-label="หน้า"
              class="mb-4"
            >
              <template #title>
                {{ group.icon }} {{ group.groupName }}
              </template>
              <template #content>
                <table class="w-full">
                  <!-- หัวตารางเมนู -->
                  <thead class="bg-gray-100">
                    <tr class="text-xs font-semibold text-gray-700 uppercase">
                      <th class="px-4 py-3 text-center w-14">เลือก</th>
                      <th class="px-4 py-3 text-left min-w-56">ชื่อเพจ</th>
                      <th
                        v-for="role in store.getAllRoles"
                        :key="`menu-header-${role.id}`"
                        class="px-4 py-3 text-center min-w-32"
                        :title="role.description"
                      >
                        {{ role.name }}
                      </th>
                    </tr>
                  </thead>
                  <!-- เนื้อหาตารางเมนู -->
                  <tbody class="divide-y divide-gray-200">
                    <tr
                      v-for="page in group.pages.filter(p => p.pageKey !== 'dashboard')"
                      :key="page.pageKey"
                      class="transition"
                      :class="[
                        dirtyPages.includes(page.pageKey)
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'bg-white hover:bg-gray-50',
                      ]"
                    >
                      <!-- คอลัมน์เลือก -->
                      <td class="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          :checked="dirtyPages.includes(page.pageKey)"
                          @change="(e) => {
                            if ((e.target as any).checked) {
                              selectedPages.add(page.pageKey)
                            } else {
                              selectedPages.delete(page.pageKey)
                            }
                          }"
                          class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </td>

                      <!-- คอลัมน์ชื่อเพจและไอคอน -->
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <span v-if="page.icon" class="text-lg flex-shrink-0">{{ page.icon }}</span>
                          <div class="flex-1">
                            <p class="font-medium text-gray-900">{{ page.pageName }}</p>
                          </div>
                        </div>
                      </td>

                      <!-- คอลัมน์ช่องทำเครื่องหมายบทบาท -->
                      <td
                        v-for="role in store.getAllRoles"
                        :key="`${role.id}-${page.pageKey}`"
                        class="px-4 py-3 text-center"
                      >
                        <input
                          type="checkbox"
                          :checked="isRoleIncluded(page.pageKey, role.id as UserRole)"
                          @change="(e) => togglePageRole(page, role.id as UserRole, (e.target as any).checked)"
                          class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </CollapsibleGroup>
          </template>
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

    <!-- Confirm Reset Modal -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style="z-index: 51"
      @click.self="closeResetConfirm"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <h2 class="text-lg font-bold mb-4 text-gray-900">ยืนยันการรีเซ็ต</h2>
        <p class="text-gray-600 mb-6">
          คุณแน่ใจหรือว่าต้องการรีเซ็ตการเปลี่ยนแปลงทั้งหมด? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป
        </p>
        <div class="flex gap-3">
          <button
            @click="closeResetConfirm"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            ไม่
          </button>
          <button
            @click="confirmReset"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            ใช่
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
import type { User, Role, UserRole, RolePermission } from '~/types/access-control'
import type { SidebarPage } from '~/utils/sidebar-menu'

// Stores
const store = useAccessControlStore()
const sidebarStore = useSidebarStore()

// Tabs
const activeTab = ref<'users' | 'menu' | 'roles'>('users')

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

// Reset Confirmation
const showResetConfirm = ref(false)

// Sidebar Menu Management
const editingPages = ref<Record<string, SidebarPage>>({})
const originalPages = ref<Record<string, SidebarPage>>({})
const selectedPages = ref<Set<string>>(new Set())
const isSavingBatch = ref(false)
const expandedGroups = ref<Set<string>>(new Set())

// Roles & Permissions Management
const originalRolePermissions = ref<Record<string, RolePermission>>({})
const selectedRoles = ref<Set<string>>(new Set())
const selectedPermissions = ref<Set<string>>(new Set())
const isSavingRoles = ref(false)
const expandedPermGroups = ref<Set<string>>(new Set())

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

    // เปรียบเทียบ roles - สำหรับ deep equality
    const editedSorted = JSON.stringify(editedRoles?.sort() || [])
    const originalSorted = JSON.stringify(originalRoles?.sort() || [])
    const rolesChanged = editedSorted !== originalSorted

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
 * Track dirty roles (มีการเปลี่ยนแปลง permissions)
 */
const dirtyRoles = computed(() => {
  const dirty: string[] = []
  const current = store.rolePermissions
  const original = originalRolePermissions.value

  for (const roleId in current) {
    if (!original[roleId]) continue

    const currentPerms = current[roleId]?.permissions || {}
    const originalPerms = original[roleId]?.permissions || {}

    // เปรียบเทียบ permissions - deep equality
    const currentSorted = JSON.stringify(currentPerms)
    const originalSorted = JSON.stringify(originalPerms)
    const permsChanged = currentSorted !== originalSorted

    if (permsChanged) {
      dirty.push(roleId)
    }
  }

  return dirty
})

/**
 * Get selected roles that are dirty
 */
const selectedDirtyRoles = computed(() => {
  return Array.from(selectedRoles.value).filter((roleId) => dirtyRoles.value.includes(roleId))
})

/**
 * Get set of dirty permission IDs (computed property for proper reactivity)
 * This ensures Vue tracks changes and properly re-renders checkboxes
 */
const dirtyPermissions = computed(() => {
  const dirty = new Set<string>()

  // For each dirty role, find which permissions changed
  for (const roleId of dirtyRoles.value) {
    const currentPerms = store.rolePermissions[roleId]?.permissions || {}
    const originalPerms = originalRolePermissions.value[roleId]?.permissions || {}

    // Check each permission
    for (const permId in currentPerms) {
      if (currentPerms[permId] !== originalPerms[permId]) {
        dirty.add(permId)
      }
    }

    // Also check permissions that were in original but not in current
    for (const permId in originalPerms) {
      if (currentPerms[permId] !== originalPerms[permId]) {
        dirty.add(permId)
      }
    }
  }

  return dirty
})

/**
 * Check if a permission has any dirty assignments (any role has changed for this permission)
 */
const isPermissionDirty = (permissionId: string): boolean => {
  return dirtyPermissions.value.has(permissionId)
}

/**
 * Group permissions by category for matrix view
 */
const groupedPermissions = computed(() => {
  const perms = store.getAllPermissions || []
  const grouped: Record<string, any[]> = {
    dashboard: [],
    sales: [],
    finance: [],
    users: [],
  }

  for (const perm of perms) {
    const category = perm.category as string
    if (category && category in grouped) {
      grouped[category as keyof typeof grouped]!.push(perm)
    }
  }

  return grouped
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

/**
 * Monitor sidebar menu tab dirty state
 * Alert when Menu tab has changes
 */
watch(
  () => dirtyPages.value,
  (dirty) => {
    if (dirty && dirty.length > 0) {
      console.log(`[AccessControl] Menu Tab: ${dirty.length} pages changed`)
      // Suggest checking Roles tab for consistency
      if (dirtyRoles.value.length > 0) {
        console.warn(
          `⚠️ Both Menu (${dirty.length}) and Roles (${dirtyRoles.value.length}) tabs have changes. Consider reviewing for consistency.`
        )
      }
    }
  }
)

/**
 * Monitor roles tab dirty state
 * Alert when Roles tab has changes
 */
watch(
  () => dirtyRoles.value,
  (dirty) => {
    if (dirty && dirty.length > 0) {
      console.log(`[AccessControl] Roles Tab: ${dirty.length} roles changed`)
      // Suggest checking Menu tab for consistency
      if (dirtyPages.value.length > 0) {
        console.warn(
          `⚠️ Both Roles (${dirty.length}) and Menu (${dirtyPages.value.length}) tabs have changes. Consider reviewing for consistency.`
        )
      }
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
  try {
    await store.loadAllData()

    // Load role permissions for all roles
    // Note: store.loadAllData() doesn't load role permissions, we need to fetch them separately
    if (store.getAllRoles.length > 0) {
      const fetchPromises = store.getAllRoles.map((role) =>
        store.fetchRolePermissions(role.id)
      )
      await Promise.all(fetchPromises)
    }

    // Initialize original role permissions for dirty tracking
    originalRolePermissions.value = JSON.parse(JSON.stringify(store.rolePermissions))
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

  // Track original permissions for dirty detection
  if (!originalRolePermissions.value[role.id]) {
    originalRolePermissions.value[role.id] = {
      roleId: role.id,
      permissions: { ...permissionsForm.value },
    }
  }

  // Mark role as selected for batch tracking
  selectedRoles.value.add(role.id)

  showPermissionsModal.value = true
}

/**
 * Close permissions modal
 */
const closePermissionsModal = () => {
  showPermissionsModal.value = false
  selectedRole.value = null
  // Note: Keep selectedRoles for batch tracking across saves
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

/**
 * Open reset confirmation dialog
 */
const openResetConfirm = () => {
  showResetConfirm.value = true
}

/**
 * Close reset confirmation dialog
 */
const closeResetConfirm = () => {
  showResetConfirm.value = false
}

/**
 * Confirm and execute reset
 */
const confirmReset = () => {
  if (activeTab.value === 'menu') {
    // Reset Menu Tab
    for (const [pageKey, originalPage] of Object.entries(originalPages.value)) {
      editingPages.value[pageKey] = JSON.parse(JSON.stringify(originalPage))
    }
    selectedPages.value.clear()
  } else if (activeTab.value === 'roles') {
    // Reset Roles Tab
    for (const roleId of dirtyRoles.value) {
      resetRolePermissions(roleId)
    }
    selectedRoles.value.clear()
  }

  closeResetConfirm()
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

  // Ensure requiredRoles is an array
  if (!current.requiredRoles || current.requiredRoles === null) {
    // All roles selected, start fresh with deselected roles
    const allRoles = store.getAllRoles.map((r) => r.id) as any
    current.requiredRoles = allRoles.filter((r: string) => r !== roleId)
  } else {
    // Toggle the role
    if (isChecked) {
      if (!(current.requiredRoles as any).includes(roleId)) {
        (current.requiredRoles as any).push(roleId)
      }
    } else {
      current.requiredRoles = (current.requiredRoles as any).filter((r: string) => r !== roleId)
    }
  }

  // Auto-select the page when its roles are modified
  if (!selectedPages.value.has(pageKey)) {
    selectedPages.value.add(pageKey)
  }
}

/**
 * Check if a role is included for a page
 */
const isRoleIncluded = (pageKey: string, roleId: UserRole): boolean => {
  const page = editingPages.value[pageKey]
  if (!page) return false
  return !page.requiredRoles || page.requiredRoles.includes(roleId)
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
 * Toggle permission group expansion (for Roles Tab matrix view)
 */
const togglePermGroupExpanded = (categoryKey: string) => {
  if (expandedPermGroups.value.has(categoryKey)) {
    expandedPermGroups.value.delete(categoryKey)
  } else {
    expandedPermGroups.value.add(categoryKey)
  }
}

/**
 * Check if permission group is expanded
 */
const isPermGroupExpanded = (categoryKey: string): boolean => {
  return expandedPermGroups.value.has(categoryKey)
}

/**
 * Get Thai label for permission category
 */
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    dashboard: '📊 แดชบอร์ด',
    sales: '👁️ ขาย',
    finance: '💰 การเงิน',
    users: '👥 ผู้ใช้ & บทบาท',
  }
  return labels[category] || category
}

/**
 * Check if a role has a specific permission
 */
const isPermissionGranted = (roleId: string, permissionId: string): boolean => {
  const rolePerms = store.rolePermissions[roleId]
  if (!rolePerms) return false
  return rolePerms.permissions?.[permissionId] ?? false
}

/**
 * Toggle a permission for a role (inline in matrix view)
 */
const togglePermissionForRole = (roleId: string, permissionId: string) => {
  const rolePerms = store.rolePermissions[roleId]
  if (!rolePerms) return

  // Create a copy to ensure reactivity
  const newPerms = { ...rolePerms.permissions }
  newPerms[permissionId] = !newPerms[permissionId]

  // Update the store
  const rolePermsRef = store.rolePermissions[roleId]
  if (rolePermsRef) {
    rolePermsRef.permissions = newPerms
  }

  // Mark role as selected for batch tracking
  if (!selectedRoles.value.has(roleId)) {
    selectedRoles.value.add(roleId)
  }
}

/**
 * Reset a role's permissions to original
 */
const resetRolePermissions = (roleId: string) => {
  const original = originalRolePermissions.value[roleId]
  if (!original) return

  // Reset to original
  const rolePermsRef = store.rolePermissions[roleId]
  if (rolePermsRef) {
    rolePermsRef.permissions = JSON.parse(JSON.stringify(original.permissions))
  }

  // Remove from selected if now clean
  if (!dirtyRoles.value.includes(roleId)) {
    selectedRoles.value.delete(roleId)
  }
}

/**
 * Save batch selected roles
 */
const saveBatchRoles = async () => {
  if (selectedDirtyRoles.value.length === 0) {
    alert('❌ ไม่มี roles ที่มีการเปลี่ยนแปลง')
    return
  }

  isSavingRoles.value = true
  const rolesToSave = selectedDirtyRoles.value
  const successCount = { value: 0 }
  const failureCount = { value: 0 }

  try {
    // Save all selected roles concurrently
    const savePromises = rolesToSave.map(async (roleId) => {
      try {
        const rolePerms = store.rolePermissions[roleId]
        if (!rolePerms) return

        const result = await store.updateRolePermissions(roleId, rolePerms.permissions)

        if (result.success) {
          originalRolePermissions.value[roleId] = {
            roleId,
            permissions: JSON.parse(JSON.stringify(rolePerms.permissions)),
          }
          successCount.value++
        } else {
          failureCount.value++
          console.error(`Failed to save ${roleId}:`, result.error)
        }
      } catch (error: any) {
        failureCount.value++
        console.error(`Error saving ${roleId}:`, error.message)
      }
    })

    await Promise.all(savePromises)

    // Show result message
    let message = ''
    if (successCount.value > 0) {
      message += `✅ บันทึก ${successCount.value} roles สำเร็จ`
    }
    if (failureCount.value > 0) {
      message += `\n❌ ล้มเหลว ${failureCount.value} roles`
    }

    alert(message)

    // Clear selection after successful save
    if (failureCount.value === 0) {
      selectedRoles.value.clear()
    }
  } catch (error: any) {
    alert(`❌ เกิดข้อผิดพลาด: ${error.message}`)
  } finally {
    isSavingRoles.value = false
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

        const result = await sidebarStore.updatePageAccess(pageKey, editedPage.requiredRoles ?? null)

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

onMounted(async () => {
  await loadData()
  await initializeEditingPages()
})
</script>
