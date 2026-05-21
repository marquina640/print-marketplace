import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            'w-full rounded-xl border bg-warm-50 px-3.5 py-2.5 text-sm text-warm-900 placeholder-warm-400',
            'transition-all focus:outline-none focus:ring-2 focus:ring-gold-500/30 resize-y',
            error ? 'border-red-500/50' : 'border-warm-300 focus:border-gold-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
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
Textarea.displayName = 'Textarea'
export { Textarea }
