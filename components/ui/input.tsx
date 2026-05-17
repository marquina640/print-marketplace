import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-warm-900 placeholder-warm-400',
            'transition-all focus:outline-none focus:ring-2 focus:ring-ink-500/20',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-warm-300 focus:border-ink-500',
            'disabled:cursor-not-allowed disabled:bg-warm-50 disabled:text-warm-400',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-warm-500">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export { Input }
