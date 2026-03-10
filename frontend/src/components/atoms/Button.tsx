import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export const Button = ({ variant = 'primary', children, className = '', ...rest }: ButtonProps) => {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string, string> = {
    primary: 'bg-brand-action text-white hover:bg-indigo-500',
    secondary: 'bg-brand-surface text-slate-100 hover:bg-slate-700',
    ghost: 'bg-transparent text-slate-100 hover:bg-slate-800'
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

