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
[Breadcrumb] Route changed {from: "/admin", to: "/admin/settings"}
[Breadcrumb] Generating breadcrumbs {currentPath: "/admin/settings", pathArray: ["admin", "settings"]}
[Breadcrumb] Generated Breadcrumbs:
  (table shows: [{label: "Settings", path: "/admin/settings"}])
[Breadcrumb] Route changed {from: "/admin/settings", to: "/admin/users"}
[Breadcrumb] Breadcrumbs count 1
```

### When on Dashboard (no breadcrumbs):
```
[Breadcrumb] Route path is empty, returning empty breadcrumbs
```

## Testing Steps

### 1. Open Browser Developer Console
- Press F12 or Ctrl+Shift+I
- Go to Console tab

### 2. Test Navigation
- **Login** with any test user
- **Navigate** to different admin pages:
  - Dashboard (should have no breadcrumbs)
  - Settings (should show: Home / Settings)
  - User Management (should show: Home / Users Management)
  - Add User (should show: Home / Users Management / Add User)
  - Reports (should show: Home / Reports)
  - Audit Logs (should show: Home / Audit Logs)

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
