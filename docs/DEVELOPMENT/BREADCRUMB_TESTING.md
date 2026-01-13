# Task 2.4 - Breadcrumb Navigation Testing Guide

## Feature Overview
✅ Breadcrumb Navigation component with Logger integration
✅ Automatic breadcrumb generation from route path
✅ Friendly label mapping for all admin pages
✅ Clickable navigation (except current page)
✅ Comprehensive logging for debugging

## Logger Features
The new `useLogger` composable provides:
- `log()` - General information logs
- `info()` - Informational messages
- `warn()` - Warning messages (always shown)
- `error()` - Error messages (always shown)
- `debug()` - Debug-level messages (dev mode only)
- `table()` - Display data in table format

## Console Logging Examples

### When navigating to Admin pages:
```
[Breadcrumb] Route changed {from: "/admin", to: "/admin/system-settings"}
[Breadcrumb] Generating breadcrumbs {currentPath: "/admin/system-settings", pathArray: ["admin", "system-settings"]}
[Breadcrumb] Generated Breadcrumbs:
  (table shows: [{label: "ตั้งค่าระบบ", path: "/admin/system-settings"}])
[Breadcrumb] Route changed {from: "/admin/system-settings", to: "/admin/users"}
[Breadcrumb] Breadcrumbs count 1
```

### When on Dashboard (no breadcrumbs):
```
[Breadcrumb] Route path is empty, returning empty breadcrumbs
```

### When navigating to user profile page:
```
[Breadcrumb] Route changed {from: "/admin", to: "/user/profile"}
[Breadcrumb] Generating breadcrumbs {currentPath: "/user/profile", pathArray: ["user", "profile"]}
[Breadcrumb] Generated Breadcrumbs:
  (table shows: [{label: "บัญชีผู้ใช้", path: "/user"}, {label: "โปรไฟล์", path: "/user/profile"}])
[Breadcrumb] Route changed {from: "/user/profile", to: "/user/user-settings"}
[Breadcrumb] Breadcrumbs count 2
```

## Route Change Logging Fix

**Problem Fixed**: Route change logs were showing identical `from` and `to` values  
**Root Cause**: The watch was comparing against the current route.path instead of tracking the previous value  
**Solution**: Store the previous route path in a variable and update it after each route change

```typescript
// Track previous path for accurate route change logging
let previousPath = route.path

watch(
  () => route.path,
  (newPath) => {
    logger.info('Route changed', { from: previousPath, to: newPath })
    previousPath = newPath  // Update for next watch
  }
)
```

## Testing Steps

### 1. Open Browser Developer Console
- Press F12 or Ctrl+Shift+I
- Go to Console tab

### 2. Test Navigation
- **Login** with any test user
- **Navigate** to different admin pages:
  - Dashboard (should have no breadcrumbs)
  - Settings (should show: 🏠 / ตั้งค่า)
  - System Settings (should show: 🏠 / ตั้งค่าระบบ)
  - User Management (should show: 🏠 / จัดการผู้ใช้)
  - Add User (should show: 🏠 / จัดการผู้ใช้ / เพิ่มผู้ใช้)
  - Reports (should show: 🏠 / รายงาน)
  - Audit Logs (should show: 🏠 / บันทึกการตรวจสอบ)

### 3. Verify Logging
- Check console for:
  - ✅ Route change logs
  - ✅ Breadcrumb generation logs
  - ✅ Breadcrumb data tables
  - ✅ Breadcrumb count logs

### 4. Test Breadcrumb Clicks
- Click on breadcrumb items (except last)
- Should navigate to that page
- Check console for "Route changed" log

## Breadcrumb Label Mapping
```typescript
{
  // Admin pages
  admin: 'แดชบอร์ด',
  dashboard: 'แดชบอร์ด',
  // Settings pages
  settings: 'ตั้งค่า',
  'system-settings': 'ตั้งค่าระบบ',
  'general-settings': 'ตั้งค่าทั่วไป',
  'business-info': 'ข้อมูลร้านค้า',
  'payment-methods': 'วิธีการชำระเงิน',
  'email-notification': 'การแจ้งเตือนอีเมล',
  // User Management pages
  users: 'จัดการผู้ใช้',
  'add-user': 'เพิ่มผู้ใช้',
  'edit-user': 'แก้ไขผู้ใช้',
  // Reports pages
  reports: 'รายงาน',
  'sales-report': 'รายงานการขาย',
  'inventory-report': 'รายงานสินค้าคงคลัง',
  'customer-report': 'รายงานลูกค้า',
  // Audit pages
  'audit-logs': 'บันทึกการตรวจสอบ',
  // User profile pages (not admin routes)
  user: 'บัญชีผู้ใช้',
  profile: 'โปรไฟล์',
  'user-settings': 'ตั้งค่าบัญชี',
}
```

## Component Files Modified
- `components/Breadcrumb.vue` - Added logging with watch on route changes
- `composables/useLogger.ts` - New logger utility
- `layouts/default.vue` - Breadcrumb already integrated

## Expected Console Output Format
```
[Breadcrumb] Message text
ℹ [Breadcrumb] Info message
⚠ [Module] Warning message
❌ [Module] Error message
🔍 [Module] Debug message
```

## Development Environment
- Node.js version: 18.x
- Nuxt: 4.2.2
- Vue: 3.5.26
- All type-check passing ✅
- All linting passing ✅

## Notes
- Logger only shows detailed logs in development mode
- Warnings and errors always show regardless of environment
- Table format helps visualize breadcrumb data structure
- Can be extended for other components (Header, Sidebar, etc.)
