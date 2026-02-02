/**
 * Access Control Repository Interface
 * 
 * Defines the contract for data access operations
 * Allows seamless switching between JSON and Firestore implementations
 */

import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
  Permission,
  RolePermission,
} from '~/types/access-control'

/**
 * Repository interface for Access Control operations
 * Implements the Repository Pattern for data source abstraction
 */
export interface IAccessControlRepository {
  // =========================================================================
  // Users Operations
  // =========================================================================

  /**
   * Get all users from the data source
   * @returns Array of all users
   */
  getAllUsers(): Promise<User[]>

  /**
   * Get a specific user by ID
   * @param uid - User ID
   * @returns User object or null if not found
   */
  getUserById(uid: string): Promise<User | null>

  /**
   * Create a new user
   * @param input - User creation input
   * @returns Created user object with generated UID
   */
  createUser(input: CreateUserInput): Promise<User>

  /**
   * Update an existing user
   * @param uid - User ID
   * @param input - Fields to update
   * @returns Updated user object
   */
  updateUser(uid: string, input: UpdateUserInput): Promise<User>

  /**
   * Delete a user
   * @param uid - User ID
   * @returns true if successful, throws error otherwise
   */
  deleteUser(uid: string): Promise<boolean>

  // =========================================================================
  // Roles Operations
  // =========================================================================

  /**
   * Get all available roles
   * @returns Array of all roles
   */
  getAllRoles(): Promise<Role[]>

  /**
   * Get a specific role by ID
   * @param roleId - Role ID
   * @returns Role object or null if not found
   */
  getRoleById(roleId: string): Promise<Role | null>

  // =========================================================================
  // Permissions Operations
  // =========================================================================

  /**
   * Get all available permissions
   * @returns Array of all permissions
   */
  getAllPermissions(): Promise<Permission[]>

  /**
   * Get permissions for a specific role
   * @param roleId - Role ID
   * @returns RolePermission object with permissions for the role
   */
  getRolePermissions(roleId: string): Promise<RolePermission>

  /**
   * Update permissions for a specific role
   * @param roleId - Role ID
   * @param permissions - Permissions object (permissionId -> boolean)
   * @returns Updated RolePermission object
   */
  updateRolePermissions(roleId: string, permissions: Record<string, boolean>): Promise<RolePermission>
}
