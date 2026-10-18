'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  price: number
  currency: string
  shipping_available: boolean
  shipping_price: number
  pickup_available: boolean
  local_delivery_available: boolean
}

export function ListingPurchaseButton({ listing, userId }: { listing: Listing; userId: string }) {
  const router = useRouter()
  const [method, setMethod]     = useState<string>('')
  const [address, setAddress]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [open, setOpen]         = useState(false)

  const options = [
    listing.shipping_available && { value: 'shipping', label: `Shipping${listing.shipping_price > 0 ? ` (+${formatCurrency(listing.shipping_price, listing.currency)})` : ' (free)'}` },
    listing.pickup_available && { value: 'pickup', label: 'Pickup' },
    listing.local_delivery_available && { value: 'local_delivery', label: 'Local delivery' },
  ].filter(Boolean) as { value: string; label: string }[]

  const shippingFee = method === 'shipping' ? listing.shipping_price : 0
  const total = listing.price + shippingFee

  async function handleCheckout() {
    if (!method) { setError('Select a delivery option.'); return }
    if (method === 'shipping' && !address.trim()) { setError('Enter your delivery address.'); return }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/stripe/listing-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, shippingMethod: method, deliveryAddress: address.trim() || null }),
    })
    const data = await res.json()

    if (!res.ok || !data.url) {
      setError(data.error ?? 'Checkout failed. Please try again.')
      setLoading(false)
      return
    }

    router.push(data.url)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#D4A017] text-[#1a1535] py-3 font-bold text-sm hover:bg-[#c49015] transition-colors"
      >
        Buy now
      </button>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-warm-200 bg-warm-50 p-4">
      <p className="text-sm font-semibold text-ink-900">Complete your order</p>

      {/* Delivery method */}
      <div>
        <p className="text-xs font-medium text-warm-700 mb-2">Delivery method</p>
        <div className="space-y-2">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="method" value={opt.value}
                checked={method === opt.value} onChange={() => setMethod(opt.value)}
                className="text-ink-600" />
              <span className="text-sm text-warm-800">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Address */}
      {method === 'shipping' && (
        <div>
          <label className="block text-xs font-medium text-warm-700 mb-1">Delivery address</label>
          <textarea
            value={address} onChange={e => setAddress(e.target.value)}
            rows={2}
            placeholder="Full name, street, city, postal code, country"
            className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink-400"
          />
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between text-sm font-semibold text-ink-900 border-t border-warm-200 pt-3">
        <span>Total</span>
        <span>{formatCurrency(total, listing.currency)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} disabled={loading}
          className="flex-1 rounded-xl border border-warm-300 py-2.5 text-sm font-medium text-warm-700 hover:bg-warm-100">
          Cancel
        </button>
        <button onClick={handleCheckout} disabled={loading}
          className="flex-1 rounded-xl bg-[#D4A017] text-[#1a1535] py-2.5 text-sm font-bold hover:bg-[#c49015] disabled:opacity-50">
          {loading ? 'Loading…' : 'Pay with Stripe'}
        </button>
      </div>
    </div>
  )
}
