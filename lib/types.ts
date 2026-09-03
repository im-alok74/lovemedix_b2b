export type UserRole = 'ADMIN' | 'PHARMACY' | 'DISTRIBUTOR'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type PurchaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED'
export type OutOfStockStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED'
export type B2BOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type MedicineStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT'
export type DocumentProfileType = 'PHARMACY' | 'DISTRIBUTOR'
export type DocumentType = 'LICENSE' | 'GST' | 'ADDRESS_PROOF' | 'IDENTITY_PROOF' | 'OTHER'
export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'SUPPORT'

export interface SessionUser {
  id: number
  email: string
  fullName: string
  phone: string | null
  role: UserRole
  status: UserStatus
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginationParams {
  page: number
  limit: number
}
