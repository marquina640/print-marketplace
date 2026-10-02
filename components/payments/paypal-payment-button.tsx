'use client'

import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    paypal?: any
  }
}

export function PayPalPaymentButton({ jobId, amount }: { jobId: string; amount: number }) {
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const containerRef            = useRef<HTMLDivElement>(null)
  const rendered                = useRef(false)

  useEffect(() => {
    if (rendered.current) return
    rendered.current = true

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) { setError('PayPal not configured.'); setLoading(false); return }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=CHF&components=buttons&enable-funding=card&disable-funding=venmo,paylater`
    script.async = true
    script.onload = () => {
      setLoading(false)
      if (!window.paypal || !containerRef.current) return
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color:  'gold',
          shape:  'rect',
          label:  'pay',
          height: 45,
        },
        createOrder: async () => {
          const res = await fetch('/api/paypal/orders/create', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ jobId }),
          })
          const data = await res.json()
          if (!res.ok || !data.orderId) throw new Error(data.error ?? 'Failed to create order')
          return data.orderId
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch(`/api/paypal/orders/capture`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ orderId: data.orderID, jobId }),
          })
          const result = await res.json()
          if (!res.ok) { setError(result.error ?? 'Payment capture failed.'); return }
          window.location.href = result.redirect ?? `/jobs/${jobId}?payment=success`
        },
        onError: (err: any) => {
          console.error('PayPal error', err)
          setError('Payment failed. Please try again.')
        },
        onCancel: () => {
          setError('Payment cancelled.')
        },
      }).render(containerRef.current)
    }
    script.onerror = () => { setError('Failed to load PayPal.'); setLoading(false) }
    document.body.appendChild(script)
  }, [jobId])

  return (
    <div className="space-y-2">
      {loading && (
        <div className="h-11 rounded-lg bg-warm-100 animate-pulse" />
      )}
      <div ref={containerRef} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
