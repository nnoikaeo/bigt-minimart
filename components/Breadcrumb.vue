<template>
  <nav aria-label="Breadcrumb" class="mb-4">
    <ol class="flex items-center space-x-2 text-sm text-gray-600">
      <!-- Home -->
      <li>
        <NuxtLink to="/admin" class="hover:text-gray-900 font-medium">
          <svg
            class="w-4 h-4 inline-block"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
            ></path>
          </svg>
          <span class="sr-only">Home</span>
        </NuxtLink>
      </li>

      <!-- Breadcrumb Items -->
      <li v-for="(breadcrumb, index) in breadcrumbs" :key="index">
        <span class="text-gray-400">/</span>
        <NuxtLink
          v-if="index < breadcrumbs.length - 1"
          :to="breadcrumb.path"
          class="ml-2 hover:text-gray-900 font-medium"
        >
          {{ breadcrumb.label }}
        </NuxtLink>
        <span v-else class="ml-2 text-gray-900 font-semibold">
          {{ breadcrumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Breadcrumb {
  label: string
  path: string
}

const route = useRoute()

// Breadcrumb label mapping for friendly names
const labelMap: Record<string, string> = {
  admin: 'Dashboard',
  dashboard: 'Dashboard',
  settings: 'Settings',
  'general-settings': 'General Settings',
  'business-info': 'Business Info',
  'payment-methods': 'Payment Methods',
  'email-notification': 'Email Notifications',
  users: 'Users Management',
  'add-user': 'Add User',
  'edit-user': 'Edit User',
  reports: 'Reports',
  'sales-report': 'Sales Report',
  'inventory-report': 'Inventory Report',
  'customer-report': 'Customer Report',
  'audit-logs': 'Audit Logs',
}

// Generate breadcrumbs from route
const breadcrumbs = computed<Breadcrumb[]>(() => {
  const pathArray = route.path.split('/').filter(p => p)

  if (pathArray.length === 0) {
    return []
  }

  // Skip 'admin' part as it's the root dashboard
  const relevantParts = pathArray.slice(1)

  if (relevantParts.length === 0) {
    return []
  }

  // Build breadcrumb path
  const breadcrumbArray: Breadcrumb[] = []
  let cumulativePath = '/admin'

  for (const part of relevantParts) {
    cumulativePath += `/${part}`
    const label = labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1)

    breadcrumbArray.push({
      label,
      path: cumulativePath,
    })
  }

  return breadcrumbArray
})
</script>

<style scoped>
/* Breadcrumb styling */
nav {
  background-color: transparent;
  padding: 0;
}
</style>
