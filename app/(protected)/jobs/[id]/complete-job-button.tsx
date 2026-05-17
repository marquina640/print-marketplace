'use client'

import { useState, useTransition } from 'react'
import { completeJob } from '@/app/actions/complete-job'

export function CompleteJobButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleComplete() {
    setError(null)
    startTransition(async () => {
      try {
        await completeJob(jobId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
        setConfirming(false)
      }
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors"
      >
        ✓ Mark as Complete
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-emerald-900">Mark this job as complete?</p>
      <p className="text-xs text-emerald-700">
        This confirms delivery is done. Both you and the maker will be prompted to leave a review.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleComplete}
          disabled={pending}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Marking…' : 'Yes, complete job'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-xl border border-warm-300 px-4 py-2 text-sm text-warm-600 hover:bg-warm-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
