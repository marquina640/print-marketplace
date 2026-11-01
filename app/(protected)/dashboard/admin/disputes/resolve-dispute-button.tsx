'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ResolveDisputeButton({ disputeId }: { disputeId: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
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

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => resolve('resolved')}
        disabled={pending}
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Mark resolved'}
      </button>
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
