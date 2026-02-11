/**
 * JSON Repository Implementation for Access Control
 * 
 * Implements the IAccessControlRepository interface using JSON files
 * for data persistence. This is a temporary solution that will be
 * replaced with Firestore in the future.
 * 
 * File Structure:
 * - public/data/users.json - User accounts
 * - public/data/roles.json - Role definitions
 * - public/data/permissions.json - Permission definitions
 * - public/data/role-permissions.json - Role-Permission mappings
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
  Permission,
  RolePermission,
} from '~/types/access-control'
import type { IAccessControlRepository } from './access-control.repository'

// Global file lock to prevent concurrent writes to sidebar-menu.json
let sidebarMenuWriteLock: Promise<void> = Promise.resolve()

export class AccessControlJsonRepository implements IAccessControlRepository {
  private basePath = join(process.cwd(), 'public/data')

  private usersPath = join(this.basePath, 'users.json')
  private rolesPath = join(this.basePath, 'roles.json')
  private permissionsPath = join(this.basePath, 'permissions.json')
  private rolePermissionsPath = join(this.basePath, 'role-permissions.json')
  private sidebarMenuPath = join(this.basePath, 'sidebar-menu.json')

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private async readFile<T>(filePath: string): Promise<T[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content) as T[]
    } catch (error) {
      console.error(`Failed to read ${filePath}:`, error)
      return []
    }
  }

  private async writeFile<T>(filePath: string, data: T[]): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error(`Failed to write to ${filePath}:`, error)
      throw new Error(`Failed to save data to ${filePath}`)
    }
  }

  // =========================================================================
  // Users Operations
  // =========================================================================

  async getAllUsers(): Promise<User[]> {
    return await this.readFile<User>(this.usersPath)
  }

  async getUserById(uid: string): Promise<User | null> {
    const users = await this.getAllUsers()
    return users.find((u) => u.uid === uid) || null
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const users = await this.getAllUsers()

    // Check if email already exists
    if (users.some((u) => u.email === input.email)) {
      throw new Error('Email already exists')
    }

    const newUser: User = {
      uid: `user-${Date.now()}`,
      email: input.email,
      displayName: input.displayName,
      roles: input.roles,
      primaryRole: input.primaryRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    users.push(newUser)
    await this.writeFile(this.usersPath, users)

    return newUser
  }

  async updateUser(uid: string, input: UpdateUserInput): Promise<User> {
    const users = await this.getAllUsers()
    const index = users.findIndex((u) => u.uid === uid)

    if (index === -1) {
      throw new Error('User not found')
    }

    const existingUser = users[index]!
    
    const updatedUser: User = {
      uid: uid,
      email: input.email ?? existingUser.email,
      displayName: input.displayName ?? existingUser.displayName,
      roles: input.roles ?? existingUser.roles,
      primaryRole: input.primaryRole ?? existingUser.primaryRole,
      isActive: input.isActive !== undefined ? input.isActive : existingUser.isActive,
      createdAt: existingUser.createdAt,
      updatedAt: new Date().toISOString(),
    }

    users[index] = updatedUser
    await this.writeFile(this.usersPath, users)

    return updatedUser
  }

  async deleteUser(uid: string): Promise<boolean> {
    const users = await this.getAllUsers()
    const filteredUsers = users.filter((u) => u.uid !== uid)

    if (filteredUsers.length === users.length) {
      throw new Error('User not found')
    }

    await this.writeFile(this.usersPath, filteredUsers)
    return true
  }

  // =========================================================================
  // Roles Operations
  // =========================================================================

  async getAllRoles(): Promise<Role[]> {
    return await this.readFile<Role>(this.rolesPath)
  }

  async getRoleById(roleId: string): Promise<Role | null> {
    const roles = await this.getAllRoles()
    return roles.find((r) => r.id === roleId) || null
  }

  // =========================================================================
  // Permissions Operations
  // =========================================================================

  async getAllPermissions(): Promise<Permission[]> {
    return await this.readFile<Permission>(this.permissionsPath)
  }

  async getRolePermissions(roleId: string): Promise<RolePermission> {
    const rolePermissions = await this.readFile<RolePermission>(this.rolePermissionsPath)
    const found = rolePermissions.find((rp) => rp.roleId === roleId)

    if (!found) {
      // Return empty permissions if not found
      return {
        roleId,
        permissions: {},
      }
    }

    return found
  }

  async updateRolePermissions(roleId: string, permissions: Record<string, boolean>): Promise<RolePermission> {
    const rolePermissions = await this.readFile<RolePermission>(this.rolePermissionsPath)
    const index = rolePermissions.findIndex((rp) => rp.roleId === roleId)

    const updated: RolePermission = {
      roleId,
      permissions,
    }

    if (index === -1) {
      rolePermissions.push(updated)
    } else {
      rolePermissions[index] = updated
    }

    await this.writeFile(this.rolePermissionsPath, rolePermissions)
    return updated
  }

  // =========================================================================
  // Sidebar Menu Operations
  // =========================================================================

  async getSidebarMenu(): Promise<any> {
    try {
      const content = await fs.readFile(this.sidebarMenuPath, 'utf-8')
      const data = JSON.parse(content)
      return data.menu || []
    } catch (error) {
      console.error(`Failed to read ${this.sidebarMenuPath}:`, error)
      return []
    }
  }

  async updatePageRequiredRoles(
    pageKey: string,
    requiredRoles: string[] | null,
  ): Promise<void> {
    // Queue this write operation to prevent concurrent file writes
    const writeOperation = async () => {
      try {
        const content = await fs.readFile(this.sidebarMenuPath, 'utf-8')
        const data = JSON.parse(content)
        const menu = data.menu || []

        // Find and update the page
        let found = false

        for (const group of menu) {
          const page = group.pages.find((p: any) => p.pageKey === pageKey)
          if (page) {
            page.requiredRoles = requiredRoles
            found = true
            break
          }
        }

        if (!found) {
          throw new Error(`Page ${pageKey} not found in sidebar menu`)
        }

        // Write updated data back to file
        const updatedContent = JSON.stringify(data, null, 2)
        await fs.writeFile(this.sidebarMenuPath, updatedContent, 'utf-8')
      } catch (error) {
        console.error(`Failed to update page ${pageKey}:`, error)
        throw new Error(`Failed to update sidebar menu: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Chain this operation to the lock to ensure sequential writes
    sidebarMenuWriteLock = sidebarMenuWriteLock.then(
      () => writeOperation(),
      () => writeOperation()
    )

    // Wait for this operation to complete
    await sidebarMenuWriteLock
  }
}
