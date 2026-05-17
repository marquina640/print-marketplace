'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { notifyQuoteAccepted } from '@/app/actions/notifications'

interface Props {
  jobId: string
  quoteId: string
  printerId: string
  printerEmail?: string
  priceAmount?: number
  jobTitle?: string
}

export function AcceptQuoteButton({ jobId, quoteId, printerId, printerEmail, priceAmount, jobTitle }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      const { error: rejectError } = await supabase
        .from('quotes').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', quoteId)
      if (rejectError) throw rejectError

      const { error: acceptError } = await supabase
        .from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
      if (acceptError) throw acceptError

      const { error: jobError } = await supabase
        .from('jobs').update({ status: 'accepted', accepted_quote_id: quoteId }).eq('id', jobId)
      if (jobError) throw jobError

      // Notify the maker
      if (printerEmail && priceAmount && jobTitle) {
        await notifyQuoteAccepted({ jobId, jobTitle, printerId, printerEmail, price: priceAmount })
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button size="sm" loading={loading} onClick={handleAccept}>
        Accept Quote
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
