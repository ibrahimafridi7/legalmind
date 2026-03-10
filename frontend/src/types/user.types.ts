export type UserRole = 'admin' | 'partner' | 'associate' | 'paralegal' | 'guest'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

