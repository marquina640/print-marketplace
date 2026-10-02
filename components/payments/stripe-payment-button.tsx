'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export function StripePaymentButton({ jobId, amount }: { jobId: string; amount: number }) {
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [paying,        setPaying]        = useState(false)
  const [stripe,        setStripe]        = useState<Stripe | null>(null)
  const [elements,      setElements]      = useState<StripeElements | null>(null)
  const [clientSecret,  setClientSecret]  = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        // Create payment intent
        const res = await fetch('/api/stripe/payment-intent', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ jobId }),
        })
        const data = await res.json()
        if (!res.ok || !data.clientSecret) throw new Error(data.error ?? 'Failed to initialize payment')

        setClientSecret(data.clientSecret)

        const s = await getStripe()
        if (!s) throw new Error('Stripe failed to load')
        setStripe(s)

        const els = s.elements({
          clientSecret: data.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#1a1535', borderRadius: '10px' },
          },
        })
        const paymentEl = els.create('payment', { layout: 'tabs' })
        paymentEl.mount('#stripe-payment-element')
        setElements(els)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment setup failed')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [jobId])

  async function handlePay() {
    if (!stripe || !elements || !clientSecret) return
    setPaying(true)
    setError(null)

    const { error: submitErr } = await elements.submit()
    if (submitErr) { setError(submitErr.message ?? 'Validation failed'); setPaying(false); return }

    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (confirmErr) {
      setError(confirmErr.message ?? 'Payment failed')
      setPaying(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Confirm server-side
      const res = await fetch('/api/stripe/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ paymentIntentId: paymentIntent.id, jobId }),
      })
      const result = await res.json()
      if (result.redirect) window.location.href = result.redirect
    } else {
      setError('Payment was not completed. Please try again.')
      setPaying(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading && <div className="h-32 rounded-xl bg-warm-100 animate-pulse" />}
      <div id="stripe-payment-element" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!loading && (
        <button
          onClick={handlePay}
          disabled={paying || !stripe || !elements}
          className="w-full rounded-xl bg-[#1a1535] text-white font-bold py-3 text-sm hover:bg-[#2d2845] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? 'Processing…' : `Pay CHF ${amount.toFixed(2)}`}
        </button>
      )}
    </div>
  )
}
