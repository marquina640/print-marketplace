'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { refundDispute } from '@/app/actions/refund-dispute'
import { sendDisputeWarning } from '@/app/actions/dispute-warning'
import { useRouter } from 'next/navigation'

export function ResolveDisputeButton({ disputeId, hasStripeSession }: { disputeId: string; hasStripeSession: boolean }) {
  const [pending, start]         = useTransition()
  const [confirming, setConfirm] = useState(false)
  const [warned, setWarned]      = useState(false)
  const [error, setError]        = useState<string | null>(null)
  const router = useRouter()

  function resolve(status: 'resolved' | 'closed') {
    setError(null)
    start(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('disputes')
          .update({ status, resolved_at: new Date().toISOString() })
          .eq('id', disputeId)
        if (error) throw new Error(error.message)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  function issueRefund() {
    setError(null)
    start(async () => {
      try {
        await refundDispute(disputeId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-red-700">Issue a full refund to the client and cancel the job?</p>
        <p className="text-xs text-warm-500">This will charge back the Stripe payment. The maker will be notified and will not receive payment.</p>
        <div className="flex gap-2 items-center">
          <button
            onClick={issueRefund}
            disabled={pending}
            className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {pending ? 'Processing...' : 'Confirm refund'}
          </button>
          <button onClick={() => setConfirm(false)} className="text-sm text-warm-500 hover:text-warm-800">
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  function warnMaker() {
    setError(null)
    start(async () => {
      try {
        await sendDisputeWarning(disputeId)
        setWarned(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send email')
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={warnMaker}
        disabled={pending || warned}
        className="text-sm font-semibold text-orange-700 hover:text-orange-900 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {warned ? '✓ Warning sent to maker' : pending ? 'Sending...' : 'Warn maker (2-day deadline)'}
      </button>
      <button
        onClick={() => resolve('resolved')}
        disabled={pending}
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Maker is right, release payment'}
      </button>
      {hasStripeSession && (
        <button
          onClick={() => setConfirm(true)}
          disabled={pending}
          className="text-sm font-semibold text-red-700 hover:text-red-900 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          Client is right, refund
        </button>
      )}
      <button
        onClick={() => resolve('closed')}
        disabled={pending}
        className="text-sm text-warm-400 hover:text-warm-700"
      >
        Close without action
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
