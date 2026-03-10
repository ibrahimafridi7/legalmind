import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

export const Badge = ({ children, tone = 'default' }: BadgeProps) => {
  const toneClass =
    tone === 'success' ? 'badge-success' : tone === 'warning' ? 'badge-warning' : tone === 'danger' ? 'badge-danger' : ''

  return (
    <span className={`badge ${toneClass}`}>
      {children}
    </span>
  )
}

