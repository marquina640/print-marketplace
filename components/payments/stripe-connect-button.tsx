'use client'

import { useState } from 'react'

interface Props {
  connected: boolean
  detailsSubmitted: boolean
  hasAccount?: boolean
  isReturn?: boolean
  countrySelected?: boolean
}

export function StripeConnectButton({ connected, detailsSubmitted, hasAccount, isReturn, countrySelected }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to start Stripe onboarding')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (connected && detailsSubmitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
        <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Stripe account connected</p>
          <p className="text-xs text-emerald-600">Payouts will be sent to your bank account after delivery confirmation.</p>
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="ml-auto text-xs text-emerald-700 underline hover:text-emerald-900 flex-shrink-0"
        >
          {loading ? 'Loading…' : 'Manage'}
        </button>
      </div>
    )
  }

  const buttonLabel = detailsSubmitted || isReturn ? 'Resume Stripe setup' : 'Connect bank account via Stripe'

  // If account exists in DB but not yet approved/completed, show review/resume notice
  if ((detailsSubmitted || isReturn || hasAccount) && !connected) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Stripe account under review</p>
          <p className="text-xs mt-0.5">Payouts will activate once Stripe approves your account — usually within 1–2 business days. No further action needed.</p>
        </div>
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-warm-200 bg-warm-50 px-4 py-2.5 text-xs font-medium text-warm-600 hover:bg-warm-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : 'Add missing info or check status on Stripe →'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {countrySelected === false && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Select your country above before connecting Stripe — it determines which country your payout account is created in.
        </p>
      )}
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading || countrySelected === false}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#635BFF] bg-white px-4 py-3 text-sm font-semibold text-[#635BFF] hover:bg-[#635BFF] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          'Redirecting to Stripe…'
        ) : (
          <>
            <svg viewBox="0 0 60 25" className="h-4 fill-current" aria-hidden>
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.26-.24 1.26-.78 0-1.51-5.59-.75-5.59-5.51 0-2.88 2.31-4.62 5.5-4.62 1.31 0 2.78.28 4.13.87v3.88c-1.28-.67-2.86-1.1-4.13-1.1-.9 0-1.22.28-1.22.78 0 1.58 5.78.77 5.78 5.37z" />
            </svg>
            {buttonLabel}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-warm-400">Stripe handles payouts directly to your bank account.</p>
    </div>
  )
}
