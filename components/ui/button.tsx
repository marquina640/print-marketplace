import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  // Ochre — main CTA
  gold:
    'bg-gold-500 text-ink-950 font-semibold hover:bg-gold-600 focus-visible:ring-gold-400 disabled:bg-gold-300',
  // Deep purple — primary action
  primary:
    'bg-ink-800 text-white hover:bg-ink-900 focus-visible:ring-gold-500/50 disabled:opacity-50',
  // Surface — secondary
  secondary:
    'bg-warm-200 text-warm-900 hover:bg-warm-300 focus-visible:ring-warm-400',
  // Outlined
  outline:
    'border border-warm-300 bg-transparent text-warm-700 hover:bg-warm-200 hover:border-warm-400 focus-visible:ring-warm-300',
  // Ghost
  ghost:
    'text-warm-600 hover:bg-warm-200 hover:text-warm-900 focus-visible:ring-warm-300',
  // Danger
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm font-semibold',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
export { Button }
