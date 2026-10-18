'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ListingForm } from './listing-form'
import { formatCurrency } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  description: string | null
  price: number
  currency: string
  photos: string[]
  category: string | null
  shipping_available: boolean
  shipping_price: number
  pickup_available: boolean
  local_delivery_available: boolean
  status: string
  created_at: string
}

export function ListingsManager({ effectiveUserId, initialListings }: { effectiveUserId: string; initialListings: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Listing | null>(null)

  async function reload() {
    const supabase = createClient()
    const { data } = await supabase
      .from('listings').select('*').eq('maker_id', effectiveUserId)
      .order('created_at', { ascending: false })
    setListings(data ?? [])
  }

  async function setStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('listings').update({ status }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this listing permanently?')) return
    const supabase = createClient()
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (showForm || editing) {
    return (
      <div className="bg-white rounded-2xl border border-warm-200 p-6">
        <ListingForm
          effectiveUserId={effectiveUserId}
          listing={editing ?? undefined}
          onSaved={async () => { setShowForm(false); setEditing(null); await reload() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="gold" onClick={() => setShowForm(true)}>+ New listing</Button>

      {listings.length === 0 && (
        <div className="text-center py-12 text-warm-400 text-sm">
          No listings yet. Create your first one to start selling.
        </div>
      )}

      <div className="space-y-3">
        {listings.map(listing => (
          <div key={listing.id} className="bg-white rounded-2xl border border-warm-200 p-4 flex gap-4 items-start">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
              {listing.photos[0] ? (
                <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-900 text-sm">{listing.title}</p>
                  <p className="text-sm text-warm-500">{formatCurrency(listing.price, listing.currency)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  listing.status === 'active' ? 'bg-green-100 text-green-700' :
                  listing.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                  'bg-warm-100 text-warm-500'
                }`}>
                  {listing.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button onClick={() => setEditing(listing)}
                  className="text-xs text-ink-600 hover:text-ink-900 underline">Edit</button>
                {listing.status === 'active'
                  ? <button onClick={() => setStatus(listing.id, 'paused')}
                      className="text-xs text-amber-600 hover:text-amber-800 underline">Pause</button>
                  : <button onClick={() => setStatus(listing.id, 'active')}
                      className="text-xs text-green-600 hover:text-green-800 underline">Activate</button>
                }
                <button onClick={() => setStatus(listing.id, 'sold_out')}
                  className="text-xs text-warm-500 hover:text-warm-700 underline">Mark sold out</button>
                <button onClick={() => deleteListing(listing.id)}
                  className="text-xs text-red-500 hover:text-red-700 underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
