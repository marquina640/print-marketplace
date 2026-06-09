'use client'

import { useState } from 'react'
import { Button }   from '@/components/ui/button'

export function PayPalPaymentButton({ jobId, amount }: { jobId: string; amount: number }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paypal/orders/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId }),
      })
      const text = await res.text()
      let data: { url?: string; error?: string } = {}
      try { data = JSON.parse(text) } catch {
        setError(`Server error (${res.status}): ${text.slice(0, 200)}`)
        return
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Payment setup failed.')
        return
      }
      window.location.href = data.url
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={handlePay} loading={loading} variant="gold">
        Pay CHF {amount.toFixed(2)} via PayPal
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
