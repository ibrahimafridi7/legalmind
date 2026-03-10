import type { UserRole } from '../types/user.types'

export const canUpload = (role: UserRole | undefined) =>
  role ? ['admin', 'partner'].includes(role) : false

