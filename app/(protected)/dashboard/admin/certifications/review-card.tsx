'use client'

import { useState, useTransition } from 'react'
import { CertificationBadge } from '@/components/ui/badge'
import { reviewCertificationRequest } from '@/app/actions/review-certification'
import { formatDate } from '@/lib/utils'

interface Request {
  id: string
  maker_id: string
  requested_level: number
  current_level: number
  notes: string | null
  photos: string[]
  created_at: string
  maker_name: string
  maker_email: string
  maker_city: string
}

export function ReviewCard({ req }: { req: Request }) {
  const [adminNotes, setAdminNotes] = useState('')
  const [lightbox, setLightbox]     = useState<string | null>(null)
  const [pending, startTransition]  = useTransition()
  const [error, setError]           = useState<string | null>(null)
  const [done, setDone]             = useState(false)

  function decide(decision: 'approved' | 'rejected' | 'more_info') {
    setError(null)
    startTransition(async () => {
      try {
        await reviewCertificationRequest(req.id, decision, adminNotes)
        setDone(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  if (done) return (
    <div className="card p-5 opacity-60">
      <p className="text-sm text-warm-500 text-center">✓ Reviewed — refresh to see updated queue</p>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-warm-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-ink-900">{req.maker_name}</span>
            <span className="text-xs text-warm-400">{req.maker_email}</span>
            <span className="text-xs text-warm-400">· {req.maker_city}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <CertificationBadge level={req.current_level} size="sm" />
            <span className="text-warm-400">→</span>
            <CertificationBadge level={req.requested_level} size="sm" />
          </div>
        </div>
        <span className="text-xs text-warm-400 flex-shrink-0">{formatDate(req.created_at)}</span>
      </div>

      {/* Maker notes */}
      {req.notes && (
        <div className="px-5 py-3 bg-warm-50 border-b border-warm-100">
          <p className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-1">Maker's Notes</p>
          <p className="text-sm text-warm-700">{req.notes}</p>
        </div>
      )}

      {/* Benchmark photos */}
      {req.photos.length > 0 && (
        <div className="px-5 py-4 border-b border-warm-100">
          <p className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
            Benchmark Photos ({req.photos.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {req.photos.map((url, i) => (
              <button key={i} onClick={() => setLightbox(url)} className="group relative">
                <img src={url} alt={`Photo ${i + 1}`}
                  className="w-full h-20 object-cover rounded-xl border border-warm-200 group-hover:border-ink-400 transition-colors" />
                <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/20 rounded-xl transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Expand</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-1.5">Admin Notes (optional)</p>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-500/20 resize-none"
            placeholder="Feedback for the maker…"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => decide('approved')}
            disabled={pending}
            className="flex-1 rounded-xl bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {pending ? '…' : '✓ Approve'}
          </button>
          <button
            onClick={() => decide('more_info')}
            disabled={pending}
            className="flex-1 rounded-xl bg-ink-100 text-ink-700 border border-ink-200 py-2 text-sm font-semibold hover:bg-ink-200 disabled:opacity-50 transition-colors"
          >
            Request Info
          </button>
          <button
            onClick={() => decide('rejected')}
            disabled={pending}
            className="flex-1 rounded-xl bg-red-50 text-red-700 border border-red-200 py-2 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-ink-950/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Benchmark" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gold-400">×</button>
        </div>
      )}
    </div>
  )
}
