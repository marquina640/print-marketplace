'use client'

import { useState, useTransition } from 'react'
import { sendOnboardingReminderBulk } from '@/app/actions/send-onboarding-reminder-bulk'

export function RemindAllButton({ count }: { count: number }) {
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSend() {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const res = await sendOnboardingReminderBulk()
        setResult(res)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  if (result) {
    return (
      <span className="text-sm text-emerald-700 font-medium">
        ✓ Sent to {result.sent} user{result.sent !== 1 ? 's' : ''}
        {result.errors.length > 0 && ` (${result.errors.length} failed)`}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleSend}
        disabled={pending || count === 0}
        className="text-sm font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {pending ? 'Sending…' : `Remind all (${count})`}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}
