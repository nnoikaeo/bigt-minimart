export type UserRole = 
  | 'owner' 
  | 'manager' 
  | 'assistant_manager' 
  | 'cashier' 
  | 'auditor'

export interface User {
  uid: string
  email: string
  displayName: string
  role: UserRole
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export interface CreateUserInput {
  email: string
  password: string
  displayName: string
  role: UserRole
}

export interface UpdateUserInput {
  displayName?: string
  role?: UserRole
  isActive?: boolean
}
