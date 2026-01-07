export interface FirebaseUser {
  uid: string
  email: string
  displayName: string
  role: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface DailySales {
  id: string
  date: Date
  userId: string
  userName: string
  posNumber: 1 | 2
  shift: 'morning' | 'afternoon'
  sales: {
    posposTotal: number
    cashAmount: number
    transferAmount: {
      qrCode: number
      bankAccount: number
      govProgram: number
      total: number
    }
    total: number
  }
  status: 'draft' | 'submitted' | 'audited' | 'approved'
}

export interface DailyExpense {
  id: string
  date: Date
  userId: string
  category: string
  amount: number
  description: string
  paymentMethod: 'cash' | 'transfer'
  receiptUrl?: string
  status: 'draft' | 'submitted' | 'audited' | 'approved'
}

export interface AuditLog {
  id: string
  date: Date
  userId: string
  action: string
  entityType: string
  entityId: string
  changes: Record<string, any>
  createdAt: Date
}
