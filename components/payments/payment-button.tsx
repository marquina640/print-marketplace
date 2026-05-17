'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PaymentButton({ jobId, amount }: { jobId: string; amount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Payment setup failed.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={handlePay} loading={loading} variant="gold">
        Pay CHF {amount.toFixed(2)} via Stripe
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
