'use client'

import { useState } from 'react'
import { Button }   from '@/components/ui/button'

export function PayPalConnectButton({ label = 'Connect PayPal Account' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/paypal/connect/onboard', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Failed to start PayPal setup.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleConnect} loading={loading} variant="gold">
        {label}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
