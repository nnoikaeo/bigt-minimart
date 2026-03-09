/**
 * Permission & Role Constants
 *
 * Centralized permission and role definitions used throughout the application
 * This ensures consistency and type-safety when checking permissions
 */

/**
 * All permission IDs in the system
 * Maps to IDs in public/data/permissions.json
 */
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view-dashboard',
  VIEW_AUDIT_LOG: 'view-audit-log',

  // Sales
  VIEW_SALES: 'view-sales',
  CREATE_SALES: 'create-sales',
  EDIT_SALES: 'edit-sales',
  DELETE_SALES: 'delete-sales',
  APPROVE_SALES: 'approve-sales',

  // Finance
  VIEW_FINANCE: 'view-finance',
  EDIT_FINANCE: 'edit-finance',

  // Users & Roles
  MANAGE_USERS: 'manage-users',
  MANAGE_ROLES: 'manage-roles',
} as const

/**
 * Permission ID type - ensures only valid permission IDs can be used
 */
export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * All role IDs in the system
 */
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  ASSISTANT_MANAGER: 'assistant_manager',
  CASHIER: 'cashier',
  AUDITOR: 'auditor',
} as const

/**
 * Role ID type - ensures only valid role IDs can be used
 */
export type RoleId = typeof ROLES[keyof typeof ROLES]

/**
 * User role type - primary role assigned to user
 */
export type UserRole = RoleId

/**
 * Role-Permission Mapping
 * Defines which permissions each role has
 * This should match public/data/role-permissions.json
 */
export const ROLE_PERMISSIONS: Record<RoleId, PermissionId[]> = {
  owner: [
    'view-dashboard',
    'view-sales',
    'create-sales',
    'edit-sales',
    'delete-sales',
    'approve-sales',
    'view-finance',
    'edit-finance',
    'manage-users',
    'manage-roles',
    'view-audit-log',
  ],
  manager: [
    'view-dashboard',
    'view-sales',
    // 'create-sales',
    // 'edit-sales',
    // 'delete-sales',
    'view-finance',
    'edit-finance',
    'manage-users',
  ],
  assistant_manager: [
    'view-dashboard',
    'view-sales',
    // 'create-sales',
    // 'edit-sales',
    'view-finance',
    'edit-finance',
  ],
  cashier: [
    'view-dashboard',
    'view-sales',
    // 'create-sales',
  ],
  auditor: [
    'view-dashboard',
    'view-sales',
    'create-sales',
    'view-finance',
    'view-audit-log',
  ],
}
