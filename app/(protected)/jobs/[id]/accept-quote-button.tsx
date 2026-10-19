'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { acceptQuote } from '@/app/actions/accept-quote'

interface Props {
  jobId: string
  quoteId: string
  printerId: string
  printerEmail?: string
  priceAmount?: number
  jobTitle?: string
  usePayPal?: boolean
  shippingIncluded?: boolean
}

export function AcceptQuoteButton({ jobId, quoteId, printerId, printerEmail, priceAmount, jobTitle, usePayPal, shippingIncluded }: Props) {
  const [open, setOpen]       = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [shipName,    setShipName]    = useState('')
  const [shipLine1,   setShipLine1]   = useState('')
  const [shipLine2,   setShipLine2]   = useState('')
  const [shipCity,    setShipCity]    = useState('')
  const [shipPostal,  setShipPostal]  = useState('')
  const [shipCountry, setShipCountry] = useState('')

  async function handleAccept() {
    if (shippingIncluded) {
      if (!shipName.trim() || !shipLine1.trim() || !shipCity.trim() || !shipPostal.trim() || !shipCountry.trim()) {
        setError('Please fill in all required shipping fields.')
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const shippingAddress = shippingIncluded ? {
        name:       shipName.trim(),
        line1:      shipLine1.trim(),
        line2:      shipLine2.trim() || undefined,
        city:       shipCity.trim(),
        postalCode: shipPostal.trim(),
        country:    shipCountry.trim(),
      } : undefined

      await acceptQuote({ jobId, quoteId, printerId, printerEmail, priceAmount, jobTitle, message, shippingAddress })

      const endpoint = usePayPal ? '/api/paypal/orders/create' : '/api/stripe/checkout'
      const checkoutRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      const checkoutData = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkoutData.error ?? 'Checkout failed. Please try again.')
      window.location.href = checkoutData.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Accept Quote
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 my-4">
            <h2 className="text-lg font-bold text-ink-900 mb-1">Accept this quote?</h2>
            <p className="text-sm text-warm-500 mb-5">
              You can send the maker a message with any details about your order — dimensions, colors, delivery preferences, etc.
            </p>

            <div className="space-y-4">
              {/* Shipping address — only when quote includes shipping */}
              {shippingIncluded && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-900">📦 Shipping address</p>
                  <Field label="Full name" value={shipName} onChange={setShipName} placeholder="Jane Smith" required />
                  <Field label="Address line 1" value={shipLine1} onChange={setShipLine1} placeholder="Bahnhofstrasse 12" required />
                  <Field label="Address line 2" value={shipLine2} onChange={setShipLine2} placeholder="Apt 3B (optional)" />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="City" value={shipCity} onChange={setShipCity} placeholder="Zurich" required />
                    <Field label="Postal code" value={shipPostal} onChange={setShipPostal} placeholder="8001" required />
                  </div>
                  <Field label="Country" value={shipCountry} onChange={setShipCountry} placeholder="Switzerland" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-warm-800 mb-1">
                  Message to maker <span className="text-warm-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Please print in black PLA, I need it by Friday…"
                  className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink-400"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" variant="gold" className="flex-1" loading={loading} onClick={handleAccept}>
                  Accept & pay
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-warm-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
      />
    </div>
  )
}
