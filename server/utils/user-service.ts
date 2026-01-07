import type { User, CreateUserInput, UpdateUserInput } from '~/types/user'

// Mock data for development
const mockUsers: User[] = [
  {
    uid: '1',
    email: 'owner@example.com',
    displayName: 'Owner Account',
    role: 'owner',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    uid: '2',
    email: 'manager@example.com',
    displayName: 'Store Manager',
    role: 'manager',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export class UserService {
  // Create a new user with auth + Firestore
  async createUser(input: CreateUserInput, createdBy: string): Promise<User> {
    try {
      // For development, create in memory
      const newUser: User = {
        uid: Math.random().toString(36).substr(2, 9),
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        posNumber: input.posNumber,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
      }

      mockUsers.push(newUser)
      console.log('[UserService] Created user:', newUser.email)
      return newUser
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`)
    }
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      // For development, return mock users
      console.log('[UserService] Getting all users, count:', mockUsers.length)
      return mockUsers
    } catch (error: any) {
      throw new Error(`Failed to get users: ${error.message}`)
    }
  }

  // Get user by ID
  async getUserById(uid: string): Promise<User | null> {
    try {
      const user = mockUsers.find(u => u.uid === uid)
      return user || null
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`)
    }
  }

  // Update user
  async updateUser(uid: string, input: UpdateUserInput): Promise<User> {
    try {
      const user = mockUsers.find(u => u.uid === uid)
      if (!user) throw new Error('User not found')

      // Update user object
      if (input.displayName) user.displayName = input.displayName
      if (input.role) user.role = input.role
      if (input.posNumber !== undefined) user.posNumber = input.posNumber
      if (input.isActive !== undefined) user.isActive = input.isActive
      user.updatedAt = new Date()

      console.log('[UserService] Updated user:', uid)
      return user
    } catch (error: any) {
      throw new Error(`Failed to update user: ${error.message}`)
    }
  }

  // Delete user (soft delete)
  async deleteUser(uid: string): Promise<void> {
    try {
      const user = mockUsers.find(u => u.uid === uid)
      if (user) {
        user.isActive = false
        user.updatedAt = new Date()
        console.log('[UserService] Deleted user:', uid)
      }
    } catch (error: any) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  // Change password
  async changePassword(uid: string, newPassword: string): Promise<void> {
    try {
      // For development, just log
      console.log('[UserService] Changed password for user:', uid)
    } catch (error: any) {
      throw new Error(`Failed to change password: ${error.message}`)
    }
  }
}

export const userService = new UserService()
