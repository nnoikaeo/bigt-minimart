# 📝 Change Log

All notable changes to this project are documented here.

---

## [1.7] - 2026-02-09

### ✨ Daily Sales UI Refinements & User Experience Improvements

**Added**
- [ENHANCED] ConfirmDialog pattern for delete operations in Daily Sales
  - Replaced browser's native confirm() with styled ConfirmDialog component
  - Delete confirmation shows "danger" variant (red) for clear user intent
  - Matches existing approval confirmation dialog pattern
- [ENHANCED] Three-level color-coded difference display in sales table
  - Green (✓) when difference = 0 (perfect match)
  - Yellow (⚠️) when -5 ≤ difference ≤ 5 (acceptable variance)
  - Red (❌) when difference < -5 or > 5 (significant discrepancy)
  - Conditional badge styling with appropriate icons and colors
- [ENHANCED] Approval confirmation styling
  - Changed from orange (warning) to green (success) variant
  - Better visual feedback for confirmation actions

**Changed**
- [UPDATED] pages/sales/daily-sales.vue
  - Unified confirmation dialog pattern for delete and approve actions
  - Implemented callback-based async action pattern
  - Updated handleDelete to use confirmDialog instead of browser confirm()
  - Changed handleApprove confirmDialogVariant from 'warning' to 'success'
  - Enhanced difference column rendering with 3-level color coding logic
  - All confirmation states now managed through single dialog system
- [UPDATED] components/DailySalesModal.vue
  - Removed "Recommendation" field from form
  - Cleaned up form validation (no longer validating removed field)
  - Simplified auditDetails object structure
- [UPDATED] types/repositories.ts
  - Removed "recommendation" property from DailySalesEntry.auditDetails interface
  - Cleaner type definition matching actual form fields

**Removed**
- [DELETED] Recommendation field from:
  - DailySalesModal.vue form fields and initial data
  - types/repositories.ts (DailySalesEntry interface)
  - server/api/daily-sales/index.post.ts (POST endpoint Zod schema)
  - server/api/daily-sales/[id].put.ts (PUT endpoint Zod schema)
  - All API payload handling

**Fixes**
- Fixed TypeScript error in DailySalesModal.vue
  - Removed orphaned "recommendation" property from formData initialization
  - Property existed in initial data but was removed from interface
  - Updated both initial formData and resetForm function for consistency
- Ensured type consistency across all API endpoints
  - All three POST/PUT endpoints now match simplified auditDetails structure
  - No orphaned fields in validation schemas

**Quality Assurance**
- TypeScript: 0 errors ✅
- npm run lint: PASS ✅
- Component structure validated ✅
- All confirmation patterns consistent across page ✅
- Form data type consistency verified ✅

**Impact**
- Better UX: Confirmation dialogs are more consistent and user-friendly
- Improved feedback: Three-level color coding makes cash differences immediately visible
- Cleaner code: Removed unused recommendation field simplifies data model
- Production-ready: All changes are backward-compatible with existing data

---

## [1.6] - 2026-02-06 (Evening)

### ✨ Week 4: Workflow 1.4 - Owner Approval System Complete

**Added**
- [NEW] Owner approval workflow for daily sales entries
  - Dedicated approval API endpoint: POST /api/daily-sales/[id]/approve
  - Quick-approve button (✓) in DailySalesTable for fast approvals
  - Detailed approval section in DailySalesModal for review before approval
  - Approval tracking with timestamps and approver information
- [NEW] Approval fields in DailySalesEntry type
  - `approvedAt`: ISO timestamp of approval
  - `approvedBy`: User ID of approver (normalized approach)
- [NEW] Helper functions for robust date handling
  - `formatApprovedDate()`: Safely converts string | Date | undefined to formatted date
  - `getApproverName()`: Dynamic lookup of owner display name from access-control store

**Features Implemented**
- Owner-only access control for approval operations
- Status flow: 'pending' (รออนุมัติ) → 'approved' (อนุมัติแล้ว)
- Data normalization: Store only user ID, lookup name dynamically
- Safe TypeScript handling of date types (string | Date | undefined)
- Immutable approved entries (cannot be edited after approval)
- Role-based authorization validation on backend

**Fixes**
- Resolved TypeScript type error with date formatting
  - Fixed: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
  - Solution: Created formatApprovedDate() wrapper for safe conversion
- Fixed test data to use new status values ('pending' instead of 'submitted')
- All lint checks passing

**Quality Assurance**
- TypeScript: 0 errors ✅
- npm run lint: PASS ✅
- All merge conflicts resolved ✅
- PR #30 merged to main and develop ✅
- Branches synchronized (main, develop, origin/main, origin/develop) ✅

**Git History**
- PR #30: Merge feature/workflow-1.4-approval to main ✅
- Commit b3793bf: feat(approval): implement workflow 1.4 owner approval
- Commit 219ab6a: fix: resolve TypeScript lint errors for workflow 1.4 approval
- Merged to develop for full branch synchronization

**Impact**
- Completes Workflow 1.4 (Owner Approval) from requirements
- All Week 4 tasks now 100% complete
- Ready for production deployment

---

## [1.5] - 2026-02-06

### ✨ Week 4: Problem Type Selection UI for Daily Sales Audit

**Added**
- [NEW] Problem type dropdown selections in DailySalesModal.vue
  - 7 predefined problem categories (cash_counting_error, pos_operation_error, cancel_bill, customer_deposit, bank_system_error, supplier_issue, other)
  - Conditional dropdowns per payment channel (only shown when difference exists)
  - Thai language labels for all categories
- [ENHANCED] Daily Sales validation logic
  - Changed from free-text validation to dropdown value checking
  - Per-channel audit validation (conditional based on differences)
  - Clear error messages when problem type not selected
- [ENHANCED] DailySalesTable.vue with problem type badges
  - Color-coded badges for each payment channel (blue, purple, green, amber)
  - Display only non-empty problem types
  - Helper functions: getProblemTypeLabel(), getChannelEmoji()
  - Badge styling matches payment channel colors
- [UPDATED] Sample data in public/data/daily-sales.json
  - Added auditDetails with problem types examples
  - Includes examples: "cash_counting_error" and "customer_deposit"

**Features Implemented**
- Problem categorization: 7 predefined types instead of free-text
- Visual UI: Color-coded problem type badges in table
- Validation: Conditional field validation based on differences
- UX: Dropdown selection for consistency and data quality
- Data: Sample data with problem types for testing

**Fixes**
- Fixed TypeScript error in middleware/auth.ts
  - Changed: currentUser.role → currentUser.primaryRole
  - Added assistant_manager to rolesNeedingAccessControl
  - Error resolution: TS2551 type mismatch fixed
- Improved form field organization in DailySalesModal

**Quality Assurance**
- TypeScript: 0 errors ✅
- npm run lint: PASS ✅
- Components responsive and accessible ✅
- Sample data updated with new format ✅
- Validation working correctly ✅

**Feature Branch**
- Branch: feature/week4-problem-types-ui
- Commits: 4 commits
  - c66f15e: Problem type dropdowns and validation
  - 5113acb: Problem type display in table
  - 43778a5: Sample data updates
  - 6a6f783: TypeScript fix (auth middleware)
- Status: Ready for merge

---

## [1.4] - 2026-02-03

### ✨ Week 4: Access Control System (User/Role Management)

**Added**
- [NEW] pages/admin/access-control.vue - Complete access control management page (596 lines)
  - Users table with status toggle iOS switch
  - User modal with create/edit functionality
  - Primary role selection with auto-sync to roles checkboxes
  - Permissions modal for role permission management
  - Delete confirmation modal
- [NEW] stores/access-control.ts - Pinia store for access control (407 lines)
  - State: users, roles, permissions, rolePermissions
  - Getters: getAllUsers, getAllRoles, getAllPermissions, getCashiers
  - Actions: fetchUsers, createUser, updateUser, deleteUser, fetchRoles
  - Repository pattern support (JSON & Firestore-ready)
- [NEW] types/access-control.ts - Type definitions for access control
  - User interface with uid, email, displayName, primaryRole, roles, isActive
  - Role interface with id, name, description
  - Permission interface
  - CreateUserInput & UpdateUserInput for form validation
- [NEW] server/repositories/access-control.repository.ts - Abstract repository interface
- [NEW] server/repositories/access-control-json.repository.ts - JSON implementation (400+ lines)
  - All CRUD operations for users, roles, permissions
  - File-based persistence
- [NEW] server/api/access-control/users/*.ts - API endpoints
  - GET /api/access-control/users (fetch all)
  - POST /api/access-control/users (create)
  - PUT /api/access-control/users/[id] (update)
  - DELETE /api/access-control/users/[id] (delete)
- [NEW] server/api/access-control/roles/*.ts - Role API endpoints
  - GET /api/access-control/roles (fetch all)
  - GET /api/access-control/roles/[id]/permissions (fetch permissions)
  - PUT /api/access-control/roles/[id]/permissions (update permissions)
- [NEW] public/data/roles.json - Role definitions (5 roles)
  - owner, manager, assistant_manager, auditor, cashier
- [NEW] public/data/permissions.json - Permission definitions
- [NEW] public/data/role-permissions.json - Role-permission mappings
- [NEW] public/data/users.json - Sample user data (5 users)
- [NEW] docs/TECHNICAL/ACCESS_CONTROL_IMPLEMENTATION.md - Complete implementation guide
- [NEW] docs/TECHNICAL/AUTH_STORE_USAGE.md - Auth store usage patterns
- [NEW] docs/TECHNICAL/HYBRID_APPROACH_SETUP.md - Hybrid approach architecture
- [NEW] pages/admin/audit-log.vue - Audit log page (placeholder)
- [NEW] pages/admin/system-logs.vue - System logs page (placeholder)

**Changed**
- [UPDATED] stores/access-control.ts - getAllRoles now returns sorted list
  - Role order: owner → manager → assistant_manager → auditor → cashier
- [ENHANCED] Access Control Store with watch for primaryRole auto-sync
  - Selecting primaryRole auto-clears and sets roles checkbox

**Features Implemented**
- User management: Create, Read, Update, Delete (Full CRUD)
- Status toggle: iOS switch for active/inactive status
- Auto-sync: Primary role selection auto-syncs to roles
- Role-based UI: Access control available to owner/manager only
- Data validation: Zod validation on API endpoints
- Responsive design: Mobile-friendly modal and table
- Thai localization: All labels in Thai
- Error handling: User-friendly error messages

**Fixes**
- Fixed email mismatch: Firebase Auth and Firestore now use same email
- Fixed UID mismatch: Firestore document IDs match Firebase Auth UIDs
- Fixed type errors: primaryRole type includes 'unknown' value
- Fixed redundant role field: Removed deprecated 'role' field
- Fixed Zod validation: Changed error.errors to error.issues

**Quality Assurance**
- TypeScript: 0 errors ✅
- All API endpoints tested ✅
- Pinia store fully functional ✅
- Components responsive and accessible ✅
- Documentation complete ✅

---

## [1.3] - 2026-01-16

### ✨ Week 3: Sidebar Navigation & Pages Complete

**Added**
- [NEW] stores/ui.ts - Pinia store for sidebar state management (162 lines)
- [NEW] utils/sidebar-menu.ts - Complete sidebar menu structure with 6 groups, 18 pages (257 lines)
- [NEW] pages/sales/daily-sales.vue - Daily sales page with full CRUD functionality
- [NEW] pages/sales/sales-report.vue - Sales report page
- [NEW] pages/finance/daily-expenses.vue - Daily expenses page
- [NEW] pages/finance/cash-flow.vue - Cash flow analysis page
- [NEW] pages/finance/monthly-report.vue - Monthly financial report page
- [NEW] pages/hr/attendance.vue - Attendance tracking page
- [NEW] pages/hr/overtime.vue - Overtime management page
- [NEW] pages/admin/roles.vue - Role management page
- [NEW] pages/settings/system-settings.vue - System settings page
- [NEW] pages/settings/others.vue - Additional settings page
- Sidebar accordion menu with 6 functional groups
- Role-based access control for all 18 pages
- Thai language labels for breadcrumb navigation (16+ routes)
- Pinia store for managing expandable groups and active page state
- LocalStorage persistence for sidebar state

**Changed**
- [UPDATED] components/Breadcrumb.vue - Fixed home link from /admin to /, enhanced Thai label mapping (42 lines changed)
- [UPDATED] components/Sidebar.vue - Complete rewrite with accordion groups, Pinia integration (389 lines)
- [UPDATED] components/Header.vue - Refined hamburger menu toggle, improved responsiveness (200+ lines)
- [UPDATED] utils/sidebar-menu.ts - All routes aligned with new page structure
- [ENHANCED] Sidebar state: dashboard, sales, finance, personnel, settings all expanded by default
- [ENHANCED] Sidebar state: admin group expanded by default for owner role

**Removed**
- [DELETED] pages/admin/profile.vue - Moved to Phase 3 planning
- [DELETED] pages/admin/settings.vue - Deprecated, replaced with /settings/
- [DELETED] pages/admin/daily-sales.vue - Moved to /sales/daily-sales.vue
- [DELETED] pages/admin/system-settings.vue - Moved to /settings/system-settings.vue

**Fixed**
- Fixed 404 warning: breadcrumb home link now points to valid route (/)
- Fixed dashboard route: /dashboard → / in sidebar menu
- Fixed breadcrumb labels: English route names now display as Thai
- Fixed single-page groups: render as direct links instead of accordion
- Removed duplicate page definitions across routes

**Quality**
- Type-check: ✅ PASS
- Lint: ✅ PASS
- Build: ✅ COMPLETE (14.8 MB, 3.43 MB gzip)
- Testing: ✅ Manual testing (all pages navigable, all routes valid)
- PR #15: Sidebar Implementation ✅ Merged to develop
- PR #16: Merge develop → main ✅ Completed (commit: 9dd98fb)

**Documentation**
- Updated WEEK_03.md with sidebar implementation details
- Updated STATUS.md: Week 3 now 100% COMPLETE
- Created SIDEBAR_IMPLEMENTATION.md with comprehensive guide

---

## [1.2] - 2026-01-13

### ✨ Week 2: Layout & Navigation Complete

**Added**
- [NEW] components/Breadcrumb.vue - Automatic breadcrumb navigation (156 lines)
- [NEW] composables/useLogger.ts - Structured logging utility (69 lines)
- [NEW] pages/user/account-settings.vue - User account settings page
- [NEW] docs/DEVELOPMENT/BREADCRUMB_TESTING.md - Breadcrumb testing guide (200+ lines)
- [NEW] docs/PROGRESS/WEEK_SUMMARIES/WEEK_02.md - Week 2 completion summary
- Breadcrumb labels for 24+ routes in Thai language
- Logger composable with methods: log(), info(), warn(), error(), debug(), table()
- Mobile menu toggle button in Header
- Role-based menu access control (Owner, Manager, Auditor)
- Responsive layout for mobile (375px), tablet (768px), desktop (1920px)

**Changed**
- [UPDATED] components/Header.vue - Added mobile menu toggle, responsive styling
- [UPDATED] components/Sidebar.vue - Added role-based visibility, hidden on mobile
- [UPDATED] layouts/default.vue - Added Breadcrumb component, responsive margins
- [UPDATED] docs/README.md - Updated last modified date, added WEEK_02.md reference
- [UPDATED] docs/PROGRESS/STATUS.md - Week 2 completion, 40% overall progress
- Renamed /user/settings → /user/account-settings
- Header dropdown link now points to /user/account-settings

**Removed**
- [DELETED] pages/user/settings.vue - Deprecated settings page

**Fixed**
- Fixed TypeScript strict mode errors in Breadcrumb component
- Fixed array indexing type assertions (rootSegment, relevantParts)
- Fixed labelMap lookup with proper typing
- Fixed route change logging (previousPath tracking)
- Fixed breadcrumb path generation (dynamic root segment)

**Quality**
- Type-check: ✅ PASS
- Lint: ✅ PASS
- Testing: ✅ Manual testing (3 viewports, 3 user roles)
- PR #7: Sidebar + Mobile Menu ✅ Merged
- PR #8: Role-Based Items ✅ Merged
- PR #9: Breadcrumb Navigation ✅ Merged
- PR #10: Responsive Layout ✅ Merged (commit: 81a8774)

---

## [1.1] - 2026-01-07

### 📚 Documentation Restructure

**Added**
- [NEW] docs/PROJECT/ folder with project documentation
- [NEW] docs/REQUIREMENTS/ folder with business requirements
- [NEW] docs/TECHNICAL/ folder with technical details
- [NEW] docs/DESIGN/ folder with design guidelines
- [NEW] docs/DEVELOPMENT/ folder with development docs
- [NEW] docs/ROADMAP/ folder with roadmap
- [NEW] docs/PROGRESS/ folder with tracking
- [NEW] docs/REFERENCE/ folder with reference materials
- [NEW] docs/ARCHIVE/ folder with version backups
- [NEW] docs/PROJECT/PROJECT_OVERVIEW.md
- [NEW] docs/REQUIREMENTS/BUSINESS_REQUIREMENTS.md
- [NEW] docs/REQUIREMENTS/USER_ROLES.md
- [NEW] docs/REQUIREMENTS/WORKFLOWS.md
- [NEW] docs/REQUIREMENTS/USE_CASES.md
- [NEW] docs/TECHNICAL/TECHNOLOGY_STACK.md
- [NEW] docs/TECHNICAL/DATABASE_SCHEMA.md
- [NEW] docs/TECHNICAL/API_ENDPOINTS.md
- [NEW] docs/TECHNICAL/FIREBASE_SETUP.md
- [NEW] docs/DESIGN/BRAND_IDENTITY.md
- [NEW] docs/DESIGN/COLOR_PALETTE.md
- [NEW] docs/REFERENCE/GLOSSARY.md
- [NEW] docs/REFERENCE/FAQ.md
- [NEW] docs/PROGRESS/WEEK_SUMMARIES/WEEK_01.md
- [NEW] docs/PROGRESS/STATUS.md (current)

**Changed**
- [MOVED] 01_PROJECT_OVERVIEW.md → docs/PROJECT/PROJECT_OVERVIEW.md
- [MOVED] 02_BUSINESS_REQUIREMENTS.md → docs/REQUIREMENTS/BUSINESS_REQUIREMENTS.md
- [MOVED] 03_TECHNICAL_SPECIFICATION.md → docs/TECHNICAL/FULL_SPECIFICATION.md
- [MOVED] 04_UI_UX_GUIDELINES.md → docs/DESIGN/UI_UX_GUIDELINES.md
- [MOVED] 05_DEVELOPMENT_ROADMAP.md → docs/ROADMAP/ROADMAP_PHASE1.md
- [MOVED] 06_PROJECT_INSTRUCTIONS.md → docs/DEVELOPMENT/PROJECT_INSTRUCTIONS.md

**Improved**
- Documentation now hierarchical and organized
- Better navigation between documents
- Easier to find specific information
- Added cross-references
- Split large documents into manageable pieces

**Benefits**
- ✅ Easier to search and find documents
- ✅ Easier to update specific sections
- ✅ Better organization for future phases
- ✅ Clearer documentation structure
- ✅ Scalable for Phase 2, 3, 4

---

## [1.0] - 2026-01-07

### 🎉 Week 1: Complete - Project Setup + Authentication

**Added**
- [NEW] Nuxt 3 project created
- [NEW] TypeScript configuration
- [NEW] Tailwind CSS setup
- [NEW] Firebase integration (Auth, Firestore, Storage)
- [NEW] Authentication system (Login/Logout)
- [NEW] Auth middleware (Route protection)
- [NEW] User management system (CRUD)
- [NEW] Test users created (3 users)
- [NEW] Dashboard page
- [NEW] Login page
- [NEW] Admin users management page
- [NEW] Pinia store for auth state
- [NEW] API endpoints for users
- [NEW] Firestore user service

**Features**
- ✅ User login with Firebase Authentication
- ✅ User logout functionality
- ✅ Route protection middleware
- ✅ User CRUD operations
- ✅ Role-based user management
- ✅ Auth state persistence
- ✅ Error handling (Thai language)
- ✅ Responsive design

**Enhancement**
- ✅ Edit form now displays current user data (watch function)
- ✅ Form population working correctly
- ✅ Password field handled securely

**Testing**
- ✅ Authentication flow verified
- ✅ User CRUD operations verified
- ✅ Route protection verified
- ✅ UI/UX tested
- ✅ Responsive design tested
- ✅ Console errors: 0

**Status**: Phase 1 Week 1 - COMPLETE ✅

---

## Legend

- [NEW] - New feature/file added
- [ADD] - Added to existing
- [UPDATE] - Changed/updated
- [ENHANCE] - Improved/optimized
- [FIX] - Bug fix
- [MOVE] - Moved/renamed
- [REMOVE] - Removed/deleted

---

**Latest Version**: 1.1  
**Updated**: 2026-01-07 19:00 UTC+7  
**Next Update**: After Week 2  
