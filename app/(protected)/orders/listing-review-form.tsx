'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ListingReviewForm({ orderId, makerId }: { orderId: string; makerId: string }) {
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 font-medium">
        Review submitted — thank you!
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setSaving(false); return }

    const { error: insertErr } = await supabase.from('listing_reviews').insert({
      order_id:    orderId,
      reviewer_id: user.id,
      maker_id:    makerId,
      rating,
      comment:     comment.trim() || null,
    })

    if (insertErr) { setError(insertErr.message); setSaving(false); return }
    setSaving(false)
    setDone(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 pt-3 border-t border-warm-100">
      <p className="text-xs font-semibold text-warm-700 uppercase tracking-wide">Leave a review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl leading-none transition-transform hover:scale-110"
          >
            <span className={(hovered || rating) >= star ? 'text-[#D4A017]' : 'text-warm-200'}>★</span>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        placeholder="Tell others about your experience (optional)"
        className="w-full rounded-xl border border-warm-300 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink-400"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={saving}
        className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Submit review'}
      </button>
    </form>
  )
}
