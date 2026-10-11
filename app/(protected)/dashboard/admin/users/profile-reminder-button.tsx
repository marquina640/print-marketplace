'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sendProfileReminderEmails } from '@/app/actions/send-profile-reminder-emails'

export function ProfileReminderButton({ count }: { count: number }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ sent: number; skipped: number; errors: string[] } | null>(null)

  if (count === 0) return null

  async function handleSend() {
    if (!confirm(`Send profile completion reminders to ${count} maker${count !== 1 ? 's' : ''} with incomplete profiles?`)) return
    setStatus('sending')
    try {
      const r = await sendProfileReminderEmails()
      setResult(r)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setResult({ sent: 0, skipped: 0, errors: [err instanceof Error ? err.message : String(err)] })
    }
  }

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-amber-900 text-sm">
            {count} maker{count !== 1 ? 's' : ''} with incomplete profiles
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Missing display name, country, materials, a machine, or a payout method.
            {status === 'done' && result && (
              <span className="ml-1 text-emerald-700 font-medium">
                ✓ Sent {result.sent}, skipped {result.skipped} (already complete).
                {result.errors.length > 0 && ` ${result.errors.length} failed.`}
              </span>
            )}
            {status === 'error' && result && (
              <span className="ml-1 text-red-600 font-medium">Error: {result.errors[0]}</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={status === 'sending' || status === 'done'}
        >
          {status === 'sending' ? 'Sending…' : status === 'done' ? 'Sent ✓' : 'Remind all →'}
        </Button>
      </div>
    </div>
  )
}
