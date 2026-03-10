import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

export const Badge = ({ children, tone = 'default' }: BadgeProps) => {
  const tones: Record<string, string> = {
    default: 'bg-slate-700 text-slate-100',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-black',
    danger: 'bg-rose-600 text-white'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

