import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export const Button = ({ variant = 'primary', children, className = '', ...rest }: ButtonProps) => {
  const variantClass =
    variant === 'secondary' ? '' : variant === 'ghost' ? '' : 'btn-primary'

  return (
    <button className={`btn ${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  )
}

