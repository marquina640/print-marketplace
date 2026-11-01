'use client'

import { useState, useTransition } from 'react'
import { raiseDispute } from '@/app/actions/raise-dispute'

const REASONS = [
  'Order not received',
  'Order arrived damaged',
  'Order does not match what was requested',
  'Tracking shows no movement',
  'Other',
]

export function RaiseDisputeButton({ jobId }: { jobId: string }) {
  const [open, setOpen]     = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [pending, start]    = useTransition()

  function submit() {
    if (!reason) return
    setError(null)
    start(async () => {
      try {
        await raiseDispute(jobId, reason, details)
        setDone(true)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to raise dispute')
      }
    })
  }

  if (done) {
    return (
      <p className="text-xs text-orange-700 font-medium">
        Dispute submitted. Our team will follow up shortly.
      </p>
    )
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-orange-700 underline underline-offset-2 hover:text-orange-900 font-medium"
        >
          Raise a dispute
        </button>
      )}

      {open && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3 mt-1">
          <p className="text-sm font-semibold text-orange-900">Raise a dispute</p>
          <p className="text-xs text-orange-700">
            Tell us what's wrong. Our team will investigate and contact both parties.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-warm-700">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900"
            >
              <option value="">Select a reason...</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-warm-700">Additional details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Describe the issue in more detail..."
              className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={pending || !reason}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
            >
              {pending ? 'Submitting...' : 'Submit dispute'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-warm-500 hover:text-warm-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
