'use client'

interface CheckItem {
  label: string
  done: boolean
  href: string
  group: 'core' | 'visibility' | 'trust'
}

interface ProfileCompletenessBannerProps {
  items: CheckItem[]
}

const GROUP_LABELS: Record<string, string> = {
  core: 'Core',
  visibility: 'Visibility',
  trust: 'Trust signals',
}

export function ProfileCompletenessBanner({ items }: ProfileCompletenessBannerProps) {
  const totalDone = items.filter((i) => i.done).length
  const total = items.length

  if (totalDone === total) return null

  const groups = ['core', 'visibility', 'trust'] as const
  const pct = Math.round((totalDone / total) * 100)

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-amber-900">Incomplete profile reduces your visibility to customers</p>
          <p className="text-xs text-amber-700 mt-0.5">{totalDone} of {total} items complete ({pct}%)</p>
        </div>
        <div className="flex-shrink-0">
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#fde68a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#d97706"
                strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-800">
              {pct}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {groups.map((group) => {
          const groupItems = items.filter((i) => i.group === group)
          if (groupItems.length === 0) return null
          return (
            <div key={group}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1.5">
                {GROUP_LABELS[group]}
              </p>
              <ul className="space-y-1">
                {groupItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.done ? undefined : item.href}
                      className={`flex items-center gap-2 text-sm ${
                        item.done
                          ? 'text-emerald-700 cursor-default'
                          : 'text-amber-800 hover:text-amber-900 hover:underline'
                      }`}
                    >
                      {item.done ? (
                        <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
