/**
 * Access Control Type Definitions
 * 
 * Defines all types for Users, Roles, Permissions management
 * Supports multiple roles per user (rotation system)
 */

// ============================================================================
// User Types
// ============================================================================

export type UserRole = 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'

/**
 * User interface - represents a system user with multiple roles
 */
export interface User {
  /** Unique user ID (Firebase UID format) */
  uid: string

  /** User email address */
  email: string

  /** Display name (Thai format) */
  displayName: string

  /** Array of roles (supports multiple roles per user) */
  roles: UserRole[]

  /** Primary role (for display and default actions) */
  primaryRole: UserRole

  /** Whether user account is active */
  isActive: boolean

  /** Account creation timestamp */
  createdAt?: string | Date

  /** Last update timestamp */
  updatedAt?: string | Date
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  /** User email (must be unique) */
  email: string

  /** Display name */
  displayName: string

  /** Array of roles to assign */
  roles: UserRole[]

  /** Primary role */
  primaryRole: UserRole
}

/**
 * Input for updating an existing user
 */
export interface UpdateUserInput {
  /** Optional: update email */
  email?: string

  /** Optional: update display name */
  displayName?: string

  /** Optional: update roles array */
  roles?: UserRole[]

  /** Optional: update primary role */
  primaryRole?: UserRole

  /** Optional: update active status */
  isActive?: boolean
}

// ============================================================================
// Role Types
// ============================================================================

/**
 * Role interface - represents a system role
 */
export interface Role {
  /** Role ID (unique identifier) */
  id: string

  /** Role name in Thai (single field) */
  name: string

  /** Role description */
  description: string

  /** Role creation timestamp */
  createdAt?: string | Date
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission interface - represents a system permission
 */
export interface Permission {
  /** Permission ID (unique identifier) */
  id: string

  /** Permission name in Thai (single field) */
  name: string

  /** Permission description */
  description: string

  /** Permission category for organization */
  category: 'dashboard' | 'sales' | 'finance' | 'users' | 'roles'

  /** Permission creation timestamp */
  createdAt?: string | Date
}

/**
 * Role-Permission mapping - defines which permissions a role has
 */
export interface RolePermission {
  /** Role ID */
  roleId: string

  /** Permissions mapping: permissionId -> boolean (granted or not) */
  permissions: Record<string, boolean>
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response for single resource
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Standard API response for list of resources
 */
export interface ApiListResponse<T> {
  success: boolean
  data: T[]
  count: number
  error?: string
  message?: string
}

// ============================================================================
// Store State Types
// ============================================================================

/**
 * Access Control Store State
 */
export interface AccessControlState {
  users: User[]
  roles: Role[]
  permissions: Permission[]
  rolePermissions: Record<string, RolePermission>
  loading: boolean
  error: string
}
