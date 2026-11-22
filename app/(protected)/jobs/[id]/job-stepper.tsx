import { formatDate } from '@/lib/utils'

type StepStatus = 'done' | 'current' | 'pending'

interface Step {
  label: string
  date?: string | null
  status: StepStatus
}

export function JobStepper({
  createdAt,
  acceptedQuoteExists,
  paidAt,
  shippedAt,
  deliveredAt,
  payoutAt,
  cancelled,
}: {
  createdAt: string
  acceptedQuoteExists: boolean
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  payoutAt?: string | null
  cancelled?: boolean
}) {
  if (cancelled) return null

  function status(done: boolean, active: boolean): StepStatus {
    if (done) return 'done'
    if (active) return 'current'
    return 'pending'
  }

  const steps: Step[] = [
    {
      label: 'Posted',
      date: createdAt,
      status: 'done',
    },
    {
      label: 'Accepted',
      date: null,
      status: status(acceptedQuoteExists, !acceptedQuoteExists),
    },
    {
      label: 'Paid',
      date: paidAt,
      status: status(!!paidAt, acceptedQuoteExists && !paidAt),
    },
    {
      label: 'Shipped',
      date: shippedAt,
      status: status(!!shippedAt, !!paidAt && !shippedAt),
    },
    {
      label: 'Delivered',
      date: deliveredAt,
      status: status(!!deliveredAt, !!shippedAt && !deliveredAt),
    },
    {
      label: 'Complete',
      date: payoutAt,
      status: status(!!payoutAt, !!deliveredAt && !payoutAt),
    },
  ]

  return (
    <div className="card px-5 py-4">
      <div className="relative flex items-start">
        {/* Background connector track */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-warm-100" />

        {/* Done connector (grows with progress) */}
        {(() => {
          const doneCount = steps.filter((s) => s.status === 'done').length
          const pct = doneCount === 0 ? 0 : Math.min(100, ((doneCount - 1) / (steps.length - 1)) * 100)
          return (
            <div
              className="absolute top-3 left-3 h-0.5 bg-emerald-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          )
        })()}

        {steps.map((step) => (
          <div key={step.label} className="flex-1 flex flex-col items-center z-10">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                step.status === 'done'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : step.status === 'current'
                  ? 'bg-white border-gold-400 text-gold-600 ring-4 ring-gold-50'
                  : 'bg-white border-warm-200 text-warm-300'
              }`}
            >
              {step.status === 'done' ? '✓' : ''}
            </div>
            <p
              className={`mt-1.5 text-[11px] font-semibold text-center leading-tight ${
                step.status === 'done'
                  ? 'text-emerald-700'
                  : step.status === 'current'
                  ? 'text-gold-600'
                  : 'text-warm-300'
              }`}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-[10px] text-warm-400 text-center mt-0.5">{formatDate(step.date)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
