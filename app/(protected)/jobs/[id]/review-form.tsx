'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ReviewFormProps {
  jobId: string
  revieweeId: string
  revieweeLabel: string
  existingReview: { id: string; rating: number; comment: string | null; is_public: boolean } | null
}

export function ReviewForm({ jobId, revieweeId, revieweeLabel, existingReview }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [hovered, setHovered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(!!existingReview)

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
        <p className="font-medium">Review submitted ✓</p>
        {existingReview?.is_public ? (
          <p className="mt-1 text-emerald-700">Both parties have reviewed — your review is now public.</p>
        ) : (
          <p className="mt-1 text-emerald-700">Waiting for the other party to review. Both reviews will go public together.</p>
        )}
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setLoading(false); return }

    const { error: dbErr } = await supabase.from('reviews').insert({
      job_id: jobId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    })

    if (dbErr) { setError(dbErr.message) }
    else { setSubmitted(true); router.refresh() }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-warm-900">
        Leave a review for <span className="text-ink-700">{revieweeLabel}</span>
      </h3>

      {/* Star rating */}
      <div>
        <p className="form-label">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110"
            >
              <span className={(hovered || rating) >= star ? 'text-gold-500' : 'text-warm-200'}>★</span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-xs text-warm-500">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </p>
        )}
      </div>

      <Textarea
        label="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Describe your experience…"
      />

      <div className="rounded-xl bg-ink-50 border border-ink-200 p-3 text-xs text-ink-700">
        <strong>How it works:</strong> Your review is private until the other party also submits theirs.
        Once both are done, both reviews go public simultaneously — just like Airbnb.
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={loading} variant="gold" className="w-full">
        Submit Review
      </Button>
    </form>
  )
}
