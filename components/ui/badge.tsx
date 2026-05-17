import { cn, getCertificationLevel, getJobType } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'gold'
}

const variantClasses = {
  default: 'bg-warm-100 text-warm-700 border-warm-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-ink-50 text-ink-700 border-ink-200',
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  gold:    'bg-gold-50 text-gold-700 border-gold-200',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}

const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  open:        { label: 'Open',        variant: 'success' },
  quoted:      { label: 'Quoted',      variant: 'info'    },
  accepted:    { label: 'Accepted',    variant: 'violet'  },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed:   { label: 'Completed',   variant: 'default' },
  cancelled:   { label: 'Cancelled',   variant: 'danger'  },
  pending:     { label: 'Pending',     variant: 'warning' },
  rejected:    { label: 'Rejected',    variant: 'danger'  },
  client:      { label: 'Client',      variant: 'info'    },
  printer_owner:{ label: 'Printer',    variant: 'violet'  },
  admin:       { label: 'Admin',       variant: 'gold'    },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

// Material-specific color chips for the feed
const MATERIAL_COLORS: Record<string, string> = {
  'PLA':               'bg-emerald-100 text-emerald-800 border-emerald-200',
  'ABS':               'bg-orange-100 text-orange-800 border-orange-200',
  'PETG':              'bg-sky-100 text-sky-800 border-sky-200',
  'TPU':               'bg-purple-100 text-purple-800 border-purple-200',
  'ASA':               'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Nylon':             'bg-pink-100 text-pink-800 border-pink-200',
  'Resin (Standard)':  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Resin (ABS-Like)':  'bg-violet-100 text-violet-800 border-violet-200',
  'Carbon Fiber PLA':  'bg-warm-200 text-warm-900 border-warm-300',
}

export function MaterialBadge({ material }: { material: string }) {
  const cls = MATERIAL_COLORS[material] ?? 'bg-warm-100 text-warm-700 border-warm-200'
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', cls)}>
      {material}
    </span>
  )
}

const CERT_CLASSES: Record<string, string> = {
  warm:   'bg-warm-100   text-warm-700   border-warm-300',
  ink:    'bg-ink-100    text-ink-700    border-ink-200',
  gold:   'bg-gold-100   text-gold-700   border-gold-300',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
}

export function CertificationBadge({ level, size = 'sm' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const cert = getCertificationLevel(level)
  const cls  = CERT_CLASSES[cert.color]
  const sizeClasses = {
    sm:  'px-2 py-0.5 text-xs',
    md:  'px-2.5 py-1 text-xs font-semibold',
    lg:  'px-3 py-1.5 text-sm font-semibold',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      cls,
      sizeClasses[size]
    )}>
      <span>{cert.icon}</span>
      {cert.name}
    </span>
  )
}

const JOB_TYPE_CLASSES: Record<string, string> = {
  warm:   'bg-warm-100   text-warm-700   border-warm-300',
  ink:    'bg-ink-100    text-ink-700    border-ink-200',
  gold:   'bg-gold-100   text-gold-700   border-gold-300',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
}

export function JobTypeBadge({ type }: { type: string }) {
  const jt  = getJobType(type)
  const cls = JOB_TYPE_CLASSES[jt.color]
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
      cls
    )}>
      <span className="font-mono">{jt.icon}</span>
      {jt.label}
    </span>
  )
}
