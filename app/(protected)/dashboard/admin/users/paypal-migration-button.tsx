'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sendPaypalMigrationEmails } from '@/app/actions/send-paypal-migration-emails'

export function PaypalMigrationButton({ count }: { count: number }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null)

  if (count === 0) return null

  async function handleSend() {
    if (!confirm(`Send PayPal migration emails to ${count} maker${count !== 1 ? 's' : ''}? This will email them asking to switch to Stripe.`)) return
    setStatus('sending')
    try {
      const r = await sendPaypalMigrationEmails()
      setResult(r)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setResult({ sent: 0, errors: [err instanceof Error ? err.message : String(err)] })
    }
  }

  return (
    <div className="rounded-xl bg-orange-50 border border-orange-200 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-orange-900 text-sm">
            {count} maker{count !== 1 ? 's' : ''} with PayPal but no Stripe
          </p>
          <p className="text-xs text-orange-700 mt-0.5">
            These makers have a PayPal address on file but haven't connected Stripe.
            {status === 'done' && result && (
              <span className="ml-1 text-emerald-700 font-medium">
                ✓ Sent {result.sent} email{result.sent !== 1 ? 's' : ''}.
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
          {status === 'sending' ? 'Sending…' : status === 'done' ? 'Sent ✓' : 'Email all →'}
        </Button>
      </div>
    </div>
  )
}
