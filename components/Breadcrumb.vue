<template>
  <nav aria-label="Breadcrumb" class="mb-4 overflow-x-auto">
    <ol class="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
      <!-- Home -->
      <li>
        <NuxtLink to="/" class="hover:text-gray-900 font-medium">
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
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Breadcrumb {
  label: string
  path: string
}

const route = useRoute()
const logger = useLogger('Breadcrumb')

// Breadcrumb label mapping for friendly names (Thai)
const labelMap: Record<string, string> = {
  // Dashboard
  dashboard: 'แดชบอร์ด',
  // Sales pages
  sales: 'การขาย',
  'daily-sales': 'บันทึกยอดขาย',
  'sales-report': 'รายงานการขาย',
  // Finance pages
  finance: 'บัญชีการเงิน',
  'daily-expenses': 'รายรับ-รายจ่าย',
  'cash-flow': 'กระแสเงินสด',
  'monthly-report': 'รายงานประจำเดือน',
  // HR pages
  hr: 'บุคคล',
  attendance: 'เวลาเข้าออก',
  overtime: 'โอที',
  // Settings pages
  settings: 'ตั้งค่า',
  'system-settings': 'ตั้งค่าระบบ',
  others: 'เพิ่มเติม',
  // Admin pages
  admin: 'ผู้ดูแลระบบ',
  users: 'จัดการผู้ใช้',
  roles: 'บทบาทและสิทธิ์',
  // User profile pages
  user: 'บัญชีผู้ใช้',
  profile: 'โปรไฟล์',
  'account-settings': 'ตั้งค่าบัญชี',
}

// Helper function to get context-aware label
const getLabel = (segment: string, root: string): string => {
  // Special case: 'settings' label depends on the root context
  if (segment === 'settings') {
    if (root === 'admin') {
      return '✏️ ตั้งค่า'
    }
    if (root === 'user') {
      return 'ตั้งค่าบัญชี'
    }
  }

  // Use labelMap for all other segments
  return (labelMap[segment as keyof typeof labelMap] || segment.charAt(0).toUpperCase() + segment.slice(1))
}

// Generate breadcrumbs from route
const breadcrumbs = computed<Breadcrumb[]>(() => {
  const pathArray = route.path.split('/').filter(p => p)

  if (pathArray.length === 0) {
    logger.log('Route path is empty, returning empty breadcrumbs')
    return []
  }

  logger.debug('Generating breadcrumbs', { currentPath: route.path, pathArray })

  // Get root segment (admin or user) and extract relevant parts
  const rootSegment = pathArray[0] as string
  const relevantParts = pathArray.slice(1) as string[]

  if (relevantParts.length === 0) {
    logger.log('No relevant parts after root segment', { root: rootSegment })
    return []
  }

  // Build breadcrumb path using actual root from URL
  const breadcrumbArray: Breadcrumb[] = []
  let cumulativePath = `/${rootSegment}`

  for (const part of relevantParts) {
    cumulativePath += `/${part}`
    const label = getLabel(part, rootSegment)

    breadcrumbArray.push({
      label,
      path: cumulativePath,
    })
  }

  logger.table('Generated Breadcrumbs', breadcrumbArray)

  return breadcrumbArray
})

// Track previous path for accurate route change logging
let previousPath = route.path

// Watch route changes
watch(
  () => route.path,
  (newPath) => {
    logger.info('Route changed', { from: previousPath, to: newPath })
    logger.debug('Breadcrumbs count', breadcrumbs.value.length)
    previousPath = newPath
  }
)
</script>

<style scoped>
/* Breadcrumb styling */
nav {
  background-color: transparent;
  padding: 0;
}
</style>
