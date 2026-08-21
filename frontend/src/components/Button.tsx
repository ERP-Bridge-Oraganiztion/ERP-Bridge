import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 border font-body font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40',
          size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
          variant === 'primary' && 'border-ink bg-ink text-paper hover:bg-graphite-800',
          variant === 'secondary' && 'border-ink bg-paper text-ink hover:bg-graphite-100',
          variant === 'ghost' && 'border-transparent text-graphite-700 hover:bg-graphite-100',
          variant === 'danger' && 'border-ink bg-paper text-ink hover:bg-ink hover:text-paper',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
