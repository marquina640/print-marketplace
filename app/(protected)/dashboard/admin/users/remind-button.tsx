'use client'

import { useState, useTransition } from 'react'
import { sendOnboardingReminder } from '@/app/actions/send-onboarding-reminder'

export function RemindButton({ userId }: { userId: string }) {
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSend() {
    setError(null)
    startTransition(async () => {
      try {
        await sendOnboardingReminder(userId)
        setSent(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  if (sent) return <span className="text-xs text-emerald-600 font-medium">Sent</span>

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={handleSend}
        disabled={pending}
        className="text-xs text-ink-500 hover:text-ink-800 font-medium transition-colors disabled:opacity-50"
      >
        {pending ? '…' : 'Remind'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}
